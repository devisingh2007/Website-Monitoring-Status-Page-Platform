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

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  let session: mongoose.ClientSession | null = null;

  try {
    await connectDB();

    const { id } = await params;

    // Validate incident ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid incident ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "title",
      "description",
      "severity",
      "status",
    ];

    const hasAllowedField = allowedFields.some((field) =>
      Object.prototype.hasOwnProperty.call(body, field)
    );

    if (!hasAllowedField) {
      return NextResponse.json(
        { success: false, message: "No valid fields provided" },
        { status: 400 }
      );
    }

    // Validate title
    if (Object.prototype.hasOwnProperty.call(body, "title")) {
      if (
        typeof body.title !== "string" ||
        body.title.trim().length < 3 ||
        body.title.trim().length > 150
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid incident title" },
          { status: 400 }
        );
      }
    }

    // Validate description
    if (Object.prototype.hasOwnProperty.call(body, "description")) {
      if (
        typeof body.description !== "string" ||
        body.description.trim().length < 3 ||
        body.description.trim().length > 1000
      ) {
        return NextResponse.json(
          { success: false, message: "Invalid description" },
          { status: 400 }
        );
      }
    }

    // Validate severity
    const severities = ["minor", "major", "critical"];

    if (
      Object.prototype.hasOwnProperty.call(body, "severity") &&
      (typeof body.severity !== "string" ||
        !severities.includes(body.severity))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid severity" },
        { status: 400 }
      );
    }

    // Validate status
    const statuses = [
      "investigating",
      "identified",
      "monitoring",
      "resolved",
    ];

    if (
      Object.prototype.hasOwnProperty.call(body, "status") &&
      (typeof body.status !== "string" ||
        !statuses.includes(body.status))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid incident status" },
        { status: 400 }
      );
    }

    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const incident = await Incident.findById(id).session(session!);

      if (!incident) {
        throw new Error("INCIDENT_NOT_FOUND");
      }

      const historyEntries: {
        incidentId: mongoose.Types.ObjectId;
        message: string;
        status: string | null;
      }[] = [];

      let statusChanged = false;

      // Title change
      if (body.title !== undefined) {
        const newTitle = body.title.trim();

        if (incident.title !== newTitle) {
          incident.title = newTitle;

          historyEntries.push({
            incidentId: incident._id,
            message: `Title updated: ${newTitle}`,
            status: null,
          });
        }
      }

      // Description change
      if (body.description !== undefined) {
        const newDescription = body.description.trim();

        if (incident.description !== newDescription) {
          incident.description = newDescription;

          historyEntries.push({
            incidentId: incident._id,
            message: "Incident description updated",
            status: null,
          });
        }
      }

      // Severity change
      if (body.severity !== undefined) {
        const newSeverity = body.severity;

        if (incident.severity !== newSeverity) {
          const previousSeverity = incident.severity;

          incident.severity = newSeverity;

          historyEntries.push({
            incidentId: incident._id,
            message: `Severity changed: ${previousSeverity} → ${newSeverity}`,
            status: null,
          });
        }
      }

      // Status change
      if (body.status !== undefined) {
        const newStatus = body.status;

        if (incident.status !== newStatus) {
          const previousStatus = incident.status;

          incident.status = newStatus;
          statusChanged = true;

          historyEntries.push({
            incidentId: incident._id,
            message: `Status changed: ${previousStatus} → ${newStatus}`,
            status: newStatus,
          });
        }
      }

      // Update resolvedAt only when status actually changes
      if (statusChanged) {
        incident.resolvedAt =
          incident.status === "resolved" ? new Date() : null;
      }

      // Save only if something actually changed
      if (historyEntries.length > 0) {
        await incident.save({ session });

        await IncidentHistory.create(historyEntries, { session });
      }
    });

    const updatedIncident = await Incident.findById(id);

    return NextResponse.json(
      {
        success: true,
        message: "Incident updated successfully",
        data: updatedIncident,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INCIDENT_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Incident not found" },
        { status: 404 }
      );
    }

    console.error("PATCH Incident Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update incident",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
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
