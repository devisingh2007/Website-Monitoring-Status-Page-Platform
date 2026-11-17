import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Incident, IncidentHistory } from "@/models";

type RouteContext = {params: Promise<{id: string;
    historyId: string;}>;
};

export async function DELETE(request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id, historyId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) ||!mongoose.Types.ObjectId.isValid(historyId)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
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

    const update = await IncidentHistory.findOneAndDelete({
      _id: historyId,
      incidentId: incident._id,
    });

    if (!update) {
      return NextResponse.json(
        { success: false, message: "Incident update not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Incident update history deleted successfully",
      data: update
    });
  } catch (error) {
    console.error("DELETE Incident Update history Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete incident update"
      },
      { status: 500 }
    );
  }
}
