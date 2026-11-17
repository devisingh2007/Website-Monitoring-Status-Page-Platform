import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Incident } from "@/models";
import { IncidentHistory } from "@/models";

type RouteContext = {params: Promise<{ id: string }>;
};

export async function GET(_request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid incident ID"
        },
        { status: 400 }
      );
    }

    const incident = await Incident.findById(id)
      .populate("monitorId", "name url type status")
      .lean();

    if (!incident) {
      return NextResponse.json({success: false,message: "Incident not found"},{ status: 404 });
    }

    
    return NextResponse.json(
      {
        success: true,
        data: incident
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET Incident By ID Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch incident"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request,{ params }: RouteContext) {
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


    const incident = await Incident.findById(id);

    if (!incident) {
      return NextResponse.json(
        { success: false, message: "Incident not found" },
        { status: 404 }
      );
    }

    const allowedFields = ["title","description","severity","status"] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided" },
        { status: 400 }
      );
    }

    const severities = ["minor", "major", "critical"];

    if (updates.severity !== undefined &&(typeof updates.severity !== "string" ||
        !severities.includes(updates.severity))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid severity" },
        { status: 400 }
      );
    }


    const statuses = ["investigating","identified","monitoring","resolved"];

    if (updates.status !== undefined &&(typeof updates.status !== "string" ||!statuses.includes(updates.status))) {
      return NextResponse.json(
        { success: false, message: "Invalid incident status" },
        { status: 400 }
      );
    }

    
    if (updates.title !== undefined) {
      if (
        typeof updates.title !== "string" ||
        updates.title.trim().length < 3 ||
        updates.title.trim().length > 150
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid incident title" },
          { status: 400 }
        );
      }

      updates.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      if (
        typeof updates.description !== "string" ||
        updates.description.trim().length < 3 ||
        updates.description.trim().length > 2000
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid description" },
          { status: 400 }
        );
      }

      updates.description = updates.description.trim();
    }

    
    incident.set(updates);

    if (updates.status === "resolved") {
      incident.resolvedAt = new Date();
    } else if (updates.status !== undefined) {
      incident.resolvedAt = null;
    }

    await incident.save();

    return NextResponse.json(
      {
        success: true,
        message: "Incident updated successfully",
        data: incident
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("PATCH Incident Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update incident"
      },
      { status: 500 }
    );
  }
}


export async function DELETE(_request: Request,{ params }: RouteContext) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid incident ID",
        },
        { status: 400 }
      );
    }

    const incident = await Incident.findById(id);

    if (!incident) {
      return NextResponse.json(
        {
          success: false,
          message: "Incident not found"
        },
        { status: 404 }
      );
    }

    await IncidentHistory.deleteMany({
      incidentId: incident._id,
    });

    await Incident.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Incident and its updates history deleted successfully"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE Incident Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete incident"
      },
      { status: 500 }
    );
  }
}
