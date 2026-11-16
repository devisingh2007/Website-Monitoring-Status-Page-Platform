import {NextResponse} from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import {CheckResult} from "@/models";
import {Monitor} from "@/models";
export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);


    const monitorId = searchParams.get("monitorId");
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    if (!monitorId || !mongoose.Types.ObjectId.isValid(monitorId)) {
      return NextResponse.json({success: false,message: "A valid monitorId is required"},
        { status: 400 }
      );
    }

    if (!Number.isInteger(page) ||!Number.isInteger(limit) ||page < 1 ||limit < 1 ||limit > 100) {
      return NextResponse.json({
          success: false,
          message: "Invalid page or limit"
        },
        { status: 400 }
      );
    }

    const filter = {monitorId: new mongoose.Types.ObjectId(monitorId)};

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      CheckResult.find(filter)
        .sort({ checkedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      CheckResult.countDocuments(filter),
    ]);
    return NextResponse.json(
      {
        success: true,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        data: results,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET Check Results Error:", error);

    return NextResponse.json({success: false,message: "Failed to fetch check results"},
      { status: 500 }
    );
  }
}




export async function POST(request: Request) {
  try {
    await connectDB();


    const secret = request.headers.get("x-cron-secret");

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const body = await request.json();

    const {monitorId,status,statusCode,responseTime,errorMessage} = body;

    if (!monitorId || !status) {
      return NextResponse.json({success: false,message: "monitorId and status are required"},
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(monitorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid monitor ID" },
        { status: 400 }
      );
    }


    if (status!=="success" &&status!=="failure") {
      return NextResponse.json(
        { success: false, message: "Invalid check status" },
        { status: 400 }
      );
    }

   
    if (statusCode !== undefined &&statusCode !== null &&(!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599)) {
      return NextResponse.json(
        { success: false, message: "Invalid HTTP status code" },
        { status: 400 }
      );
    }

    if (responseTime !== undefined &&responseTime !== null &&(typeof responseTime !== "number" ||!Number.isFinite(responseTime) ||responseTime < 0)) {
      return NextResponse.json(
        { success: false, message: "Invalid response time" },
        { status: 400 }
      );
    }

    const monitor = await Monitor.findById(monitorId);

    if (!monitor) {
      return NextResponse.json(
        { success: false, message: "Monitor not found" },
        { status: 404 }
      );
    }

    const checkResult = await CheckResult.create({
      monitorId,
      status,
      statusCode: statusCode ?? null,
      responseTime: responseTime ?? null,
      errorMessage: errorMessage ?? "",
      checkedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Check result created successfully",
        data: checkResult,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST Check Result Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create check result"
      },
      { status: 500 }
    );
  }
}
