import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Monitor } from "@/models";
import { runMonitorCheck } from "@/lib/monitoring/run-monitor-check";
import {
  acquireCronLock,
  releaseCronLock,
  renewCronLock,
} from "@/lib/monitoring/cron-lock";

export async function POST(request: Request) {
  let ownerToken: string | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let lockLost = false;
  let heartbeatInProgress = false;
  const executionStartedAt = Date.now();
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "Cron secret is not configured",
        },
        { status: 500 },
      );
    }
    const authorization = request.headers.get("authorization");

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();
    // acquire distributed lock
    ownerToken = await acquireCronLock();

    if (!ownerToken) {
      return NextResponse.json(
        {
          success: true,
          message: "Monitoring is already running. Execution skipped.",
          skipped: true,
          durationMs: Date.now() - executionStartedAt,
        },
        { status: 200 },
      );
    }

    heartbeat = setInterval(async () => {
      if (heartbeatInProgress || lockLost || !ownerToken) {
        return;
      }

      heartbeatInProgress = true;

      try {
        const renewed = await renewCronLock(ownerToken);

        if (!renewed) {
          lockLost = true;
          console.error("Cron lock lost. Stopping monitoring execution.");
        }
      } catch (error) {
        lockLost = true;
        console.error("Cron lock renewal failed:", error);
      } finally {
        heartbeatInProgress = false;
      }
    }, 30_000);

    const now = new Date();

    const monitors = await Monitor.find({
      enabled: true,
      $or: [{ nextCheckAt: { $lte: now } }, { nextCheckAt: null }],
    })
      .select("_id interval")
      .sort({ nextCheckAt: 1 })
      .limit(50)
      .lean();

    const results = [];
    for (const monitor of monitors) {
      if (lockLost) {
        console.error("Cron execution stopped because lock was lost.");
        break;
      }
      try {
        const result = await runMonitorCheck(monitor._id.toString());

        results.push({
          monitorId: monitor._id,
          success: true,
          incidentManagementSuccess: !result.incidentError,
          incidentError: result.incidentError,
          data: result,
        });
      } catch (error) {
        results.push({
          monitorId: monitor._id,
          success: false,
          error: error instanceof Error ? error.message : "Health check failed",
        });
      } finally {
        await Monitor.updateOne(
          { _id: monitor._id, enabled: true },
          {
            $set: {
              nextCheckAt: new Date(Date.now() + monitor.interval * 1000),
            },
          },
        );
      }
    }
    return NextResponse.json({
      success: true,
      message: "Scheduled monitoring completed",
      total: monitors.length,
      successful: results.filter((item) => item.success).length,
      failed: results.filter((item) => !item.success).length,
      durationMs: Date.now() - executionStartedAt,
      incidentManagementFailed: results.filter(
        (item) => !item.incidentManagementSuccess,
      ).length,
      results,
    });
  } catch (error) {
    console.error("Cron Monitoring Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Scheduled monitoring failed",
      },
      { status: 500 },
    );
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat);
    }

    if (ownerToken) {
      try {
        await releaseCronLock(ownerToken);
      } catch (error) {
        console.error("Cron lock relese error", error);
      }
    }
  }
}
