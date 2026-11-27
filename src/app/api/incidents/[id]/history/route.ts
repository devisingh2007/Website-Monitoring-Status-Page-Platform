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