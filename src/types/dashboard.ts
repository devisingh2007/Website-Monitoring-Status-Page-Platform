
export interface MonitorInfo {
  _id: string;
  name: string;
  url?: string;
  type?: "website" | "api";
  status?: string;
}

export interface IncidentInfo {
  _id: string;
  title: string;
  severity: "minor" | "major" | "critical";
  status: string;
  startedAt: string;
  monitorId?: MonitorInfo | null;
}

export interface CheckInfo {
  _id: string;
  status: "success" | "failure";
  statusCode?: number | null;
  responseTime?: number | null;
  checkedAt: string;
  monitorId?: MonitorInfo | null;
}

export interface UptimeTrendPoint {
  time: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
}

export interface DashboardData {
  summary: {
    totalMonitors: number;
    operationalMonitors: number;
    downMonitors: number;
    pausedMonitors: number;
    activeIncidents: number;
  };

  uptime: {
    percentage: number | null;
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    period: string;
  };

  uptimeTrend: UptimeTrendPoint[];

  recentIncidents: IncidentInfo[];
  recentChecks: CheckInfo[];
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
}