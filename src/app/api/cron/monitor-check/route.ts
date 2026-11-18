import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Monitor } from "@/models";
import { runMonitorCheck } from "@/lib/monitoring/run-monitor-check";

export async function POST(request: Request) {
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
      try {
        const result = await runMonitorCheck(monitor._id.toString());

        results.push({
          monitorId: monitor._id,
          success: true,
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
  }
}
