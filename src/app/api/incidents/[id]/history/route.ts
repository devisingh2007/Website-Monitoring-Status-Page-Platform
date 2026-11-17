import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Incident, IncidentHistory } from "@/models";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid incident ID" },
        { status: 400 }
      );
    }

    const incident = await Incident.findById(id);

    if (!incident) {
      return NextResponse.json(
        { success: false, message: "Incident not found" },
        { status: 404 }
      );
    }

    const updates = await IncidentHistory.find({
      incidentId: incident._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        count: updates.length,
        data: updates,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET Incident Updates history Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch incident update history",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid incident ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message, status } = body;

    if (typeof message !== "string" ||message.trim().length < 3 ||message.trim().length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message must be between 3 and 1000 characters"
        },
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

    const incident = await Incident.findById(id);

    if (!incident) {
      return NextResponse.json(
        { success: false, message: "Incident not found" },
        { status: 404 }
      );
    }

    const update = await IncidentHistory.create({
      incidentId: incident._id,
      message: message.trim(),
      status: status ?? null,
    });

    if (status !== undefined) {
      incident.status = status;
      incident.resolvedAt =
        status === "resolved" ? new Date() : null;

      await incident.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Incident update history added successfully",
        data: {
          update,
          incident
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Incident Update Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to add incident update"
      },
      { status: 500 }
    );
  }
}
