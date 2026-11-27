import mongoose from "mongoose";
import connectDB from "../db";
import { Incident, IncidentHistory, Monitor } from "@/models";

interface IncidentManagerOptions {
  monitorId: string;
  monitorStatus: "operational" | "down" | "paused";
  errorMessage?: string | null;
}

export async function manageMonitorIncident({
  monitorId,
  monitorStatus,
  errorMessage,
}: IncidentManagerOptions) {
  await connectDB();

  let session: mongoose.ClientSession | null = null;

  let action:
    | "incident_created"
    | "existing_incident"
    | "incident_resolved"
    | "no_action" = "no_action";

  let incidentId: string | null = null;

  try {
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const monitor = await Monitor.findById(monitorId).session(session!);

      if (!monitor) {
        throw new Error("Monitor not found");
      }

      const openIncident = await Incident.findOne({
        monitorId: monitor._id,
        status: { $ne: "resolved" },
      }).session(session!);

      // Monitor is down
      if (monitorStatus === "down") {
        if (openIncident) {
          action = "existing_incident";
          incidentId = openIncident._id.toString();
          return;
        }

        const [incident] = await Incident.create(
          [
            {
              monitorId: monitor._id,
              title: `${monitor.name} is down`,
              description:
                errorMessage || "Monitor failed consecutive health checks",
              severity: "critical",
              status: "investigating",
            },
          ],
          { session },
        );

        await IncidentHistory.create(
          [
            {
              incidentId: incident._id,
              message:
                "Incident automatically created after consecutive health check failures.",
              status: "investigating",
            },
          ],
          { session },
        );

        action = "incident_created";
        incidentId = incident._id.toString();
        return;
      }

      // Monitor recovered
      if (monitorStatus === "operational" && openIncident) {
        openIncident.status = "resolved";
        openIncident.resolvedAt = new Date();

        await openIncident.save({ session });

        await IncidentHistory.create(
          [
            {
              incidentId: openIncident._id,
              message: "Monitor recovered. Service is operational again.",
              status: "resolved",
            },
          ],
          { session },
        );

        action = "incident_resolved";
        incidentId = openIncident._id.toString();
      }
    });

    const incident = incidentId ? await Incident.findById(incidentId) : null;

    return {
      action,
      incident,
    };
  } catch (error) {
    const mongoError = error as {
      code?: number;
      keyPattern?: Record<string, unknown>;
    };

    // Handle duplicate active incident
    if (mongoError.code === 11000 && mongoError.keyPattern?.monitorId) {
      const existingIncident = await Incident.findOne({
        monitorId,
        status: {
          $in: ["investigating", "identified", "monitoring"],
        },
      });

      if (existingIncident) {
        return {
          action: "existing_incident" as const,
          incident: existingIncident,
        };
      }
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
