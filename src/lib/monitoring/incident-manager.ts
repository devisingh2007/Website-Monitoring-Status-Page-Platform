import connectDB from "../db";
import { Incident } from "@/models";
import { IncidentHistory } from "@/models";
import { Monitor } from "@/models";

interface IncidentManagerOptions {
  monitorId: string;
  monitorStatus: "operational" | "down"|"paused";
  errorMessage?: string | null;
}

export async function manageMonitorIncident({
  monitorId,
  monitorStatus,
  errorMessage,
}: IncidentManagerOptions) {
  await connectDB();

  const monitor = await Monitor.findById(monitorId);

  if (!monitor) {
    throw new Error("Monitor not found");
  }

  const openIncident = await Incident.findOne({
    monitorId: monitor._id,
    status: { $ne: "resolved" },
  });

  if (monitorStatus == "down") {
    if (openIncident) {
      return {
        action: "existing_incident",
        incident: openIncident,
      };
    }

    const incident = await Incident.create({
      monitorId: monitor._id,
      title: `${monitor.name} is down`,
      description: errorMessage || "monitor failed consecutive health checks",
      severity: "critical",
      status: "investigating",
    });

    await IncidentHistory.create({
      incidentId: incident._id,
      message:
        "Incident automatically created after consecutive health check failures .",
      status: "investigating",
    });

    return {
      action: "incident_created",
      incident,
    };
  }

  if (monitorStatus === "operational" && openIncident) {
    openIncident.status = "resolved";
    openIncident.resolvedAt = new Date();

    await openIncident.save();

    const history = await IncidentHistory.create({
      incidentId: openIncident._id,
      message: "Monitor recovered. Service is operational again.",
      status: "resolved",
    });

    return {
      action: "incident_resolved",
      incident: openIncident,
      history,
    };
  }

  return {
    action: "no_action",
    incident: null,
  };
}


