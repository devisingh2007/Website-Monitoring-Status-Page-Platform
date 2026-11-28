export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

export type IncidentSeverity = "minor" | "major" | "critical";

export interface IncidentMonitor {
  _id: string;
  name: string;
  url: string;
  type: "website" | "api";
  status: string;
}

export interface Incident {
  _id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  startedAt: string;
  resolvedAt: string | null;
  monitorId: IncidentMonitor | null;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
