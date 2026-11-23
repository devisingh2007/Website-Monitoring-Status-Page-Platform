import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Monitor, CheckResult, Incident } from "@/models";

export async function GET() {
  try {
    await connectDB();

    
    const now = new Date();
    const last24Hours = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    );

    
    const [
      totalMonitors,
      operationalMonitors,
      downMonitors,
      pausedMonitors,
      activeIncidents,
      recentIncidents,
      recentChecks,
      uptimeData,
      uptimeTrend,
    ] = await Promise.all([

      // Total monitors
      Monitor.countDocuments(),

      // Operational monitors
      Monitor.countDocuments({
        status: "operational",
      }),

      Monitor.countDocuments({
        status: "down",
      }),

      Monitor.countDocuments({
        status: "paused",
      }),

      Incident.countDocuments({
        status: { $ne: "resolved" },
      }),

      Incident.find()
        .populate("monitorId", "name url type status")
        .sort({ startedAt: -1 })
        .limit(5)
        .lean(),

      CheckResult.find()
        .populate("monitorId", "name url type status")
        .sort({ checkedAt: -1 })
        .limit(5)
        .lean(),

      
      CheckResult.aggregate([
        {
          $match: {
            checkedAt: {
              $gte: last24Hours,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalChecks: {
              $sum: 1,
            },
            successfulChecks: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "success"] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),

      
      CheckResult.aggregate([
        {
          $match: {
            checkedAt: {
              $gte: last24Hours,
              $lte: now,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateTrunc: {
                date: "$checkedAt",
                unit: "hour",
                timezone: "UTC",
              },
            },

            totalChecks: {$sum: 1,},

            successfulChecks: {$sum: {$cond: [{ $eq: ["$status", "success"] },1,0,],},
            },

            failedChecks: {$sum: {$cond: [
                  { $eq: ["$status", "failure"] },1,0,],},
            },},},
        {
          $sort: {
            _id: 1,
          },
        },
      ]),
    ]);

    const totalChecks =uptimeData[0]?.totalChecks ?? 0;

    const successfulChecks =uptimeData[0]?.successfulChecks ?? 0;

    const failedChecks =totalChecks - successfulChecks;

    const uptimePercentage =totalChecks > 0? Number(((successfulChecks / totalChecks) *100).toFixed(2)): null;

    const hourlyMap = new Map(
      uptimeTrend.map((item) => [
        new Date(item._id).getTime(),
        item,
      ])
    );

    
    const currentHour = new Date(now);

    currentHour.setUTCMinutes(0, 0, 0);

    const hourlyHistory = Array.from(
      { length: 24 },
      (_, index) => {
        const hour = new Date(currentHour);

        hour.setUTCHours(
          currentHour.getUTCHours() - (23 - index)
        );

        const result = hourlyMap.get(
          hour.getTime()
        );

        return {
          time: hour.toISOString(),

          totalChecks:
            result?.totalChecks ?? 0,

          successfulChecks:
            result?.successfulChecks ?? 0,

          failedChecks:
            result?.failedChecks ?? 0,
        };
      }
    );

    
    return NextResponse.json(
      {
        success: true,

        data: {
          summary: {
            totalMonitors,
            operationalMonitors,
            downMonitors,
            pausedMonitors,
            activeIncidents,
          },

          uptime: {
            percentage: uptimePercentage,
            totalChecks,
            successfulChecks,
            failedChecks,
            period: "24 hours",
          },

          uptimeTrend: hourlyHistory,

          recentIncidents,

          recentChecks,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Dashboard API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch dashboard data",
      },
      { status: 500 }
    );
  }
}
