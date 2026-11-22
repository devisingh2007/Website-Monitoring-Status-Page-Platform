import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Monitor, CheckResult, Incident } from "@/models";


export async function GET() {
  try {
    await connectDB();

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalMonitors, operationalMonitors, downMonitors, pausedMonitors,activeIncidents,recentIncidents,recentChecks,uptimeData] =
      await Promise.all([
        Monitor.countDocuments(),
        Monitor.countDocuments({ status: "operational" }),
        Monitor.countDocuments({ status: "down" }),
        Monitor.countDocuments({ status: "paused" }),
        Incident.countDocuments({status:{$ne:"resolved"}}),
        Incident.find().populate("monitorId","name url type status").sort({startedAt:-1}).limit(5).lean(),
        CheckResult.find().populate("monitorId","name url type status").sort({checkedAt:-1}).limit(5).lean(),
        CheckResult.aggregate([
          {$match:{checkedAt:{$gte:last24Hours}}},
          {$group :{_id:null,totalChecks:{$sum:1},successfulChecks:{$sum:{$cond:[{$eq:["$status","success"]},1,0],},},},}
        ])
      ]);

      const totalChecks=uptimeData[0]?.totalChecks??0;
      const successfulChecks=uptimeData[0]?.successfulChecks??0;
      const uptimePercentage=totalChecks>0?Number(((successfulChecks/totalChecks)*100).toFixed(2)):null;

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
            period: "24 hours",
          },

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

