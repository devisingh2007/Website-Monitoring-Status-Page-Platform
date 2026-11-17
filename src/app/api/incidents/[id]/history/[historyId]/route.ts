import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Incident, IncidentHistory } from "@/models";

type RouteContext = {params: Promise<{id: string;
    updateId: string;}>;
};

export async function DELETE(request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id, updateId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) ||!mongoose.Types.ObjectId.isValid(updateId)) {
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
      _id: updateId,
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
      message: "Incident update deleted successfully",
      data: update
    });
  } catch (error) {
    console.error("DELETE Incident Update Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete incident update"
      },
      { status: 500 }
    );
  }
}
