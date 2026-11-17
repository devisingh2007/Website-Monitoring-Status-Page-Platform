import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Incident ,Monitor} from "@/models";

export async function GET(request: Request) {
  try {
    await connectDB();
const { searchParams } = new URL(request.url);

    const monitorId = searchParams.get("monitorId");
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    
    if (!Number.isInteger(page) ||!Number.isInteger(limit) ||page < 1 ||limit < 1 ||limit > 100) {
      return NextResponse.json({ success: false, message: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    if (monitorId &&!mongoose.Types.ObjectId.isValid(monitorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid monitor ID" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["investigating","identified","monitoring","resolved"];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid incident status" },
        { status: 400 }
      );
    }


    const allowedSeverities = ["minor", "major", "critical"];

    if (severity && !allowedSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, message: "Invalid incident severity" },
        { status: 400 }
      );
    }


    const filter: Record<string, unknown> = {};

    if (monitorId) {
      filter.monitorId = new mongoose.Types.ObjectId(monitorId);
    }

    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    
    const skip = (page - 1) * limit;

    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .populate("monitorId", "name url type status")
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Incident.countDocuments(filter),
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
        data: incidents
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET Incidents Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch incidents"
      },
      { status: 500 }
    );
  }
}



export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const {monitorId,title,description,severity,status} = body;

    if (!monitorId || !title || !description || !severity) {
      return NextResponse.json({
          success: false,
          message: "monitorId, title, description and severity are required"
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(monitorId)) {
      return NextResponse.json(
        { success: false, message: "Invalid monitor ID" },
        { status: 400 }
      );
    }

    if (typeof title !== "string" ||typeof description !== "string" ||title.trim().length < 3 ||title.trim().length > 150 ||
      description.trim().length < 3 ||
      description.trim().length > 2000
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid title or description" },
        { status: 400 }
      );
    }

    
    const allowedSeverities = ["minor", "major", "critical"];

    if (!allowedSeverities.includes(severity)) {
      return NextResponse.json(
        { success: false, message: "Invalid incident severity" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["investigating","identified","monitoring","resolved"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid incident status" },
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

    
    const incident = await Incident.create({
      monitorId,
      title: title.trim(),
      description: description.trim(),
      severity,
      status: status ?? "investigating",
      ...(status === "resolved" && { //? when incident resolve means user mark it as resolve that time resolvedAt is add other wise it's not add 
        resolvedAt: new Date(),
      }),
    });

    
    return NextResponse.json(
      {
        success: true,
        message: "Incident created successfully",
        data: incident,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST Incident Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create incident",
      },
      { status: 500 }
    );
  }
}


