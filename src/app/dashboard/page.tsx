
"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  Clock3,
} from "lucide-react";


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
    period: string;
  };
  recentIncidents: IncidentInfo[];
  recentChecks: CheckInfo[];
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data: DashboardData;
}

const initialData: DashboardData = {
  summary: {
    totalMonitors: 0,
    operationalMonitors: 0,
    downMonitors: 0,
    pausedMonitors: 0,
    activeIncidents: 0,
  },
  uptime: {
    percentage: null,
    totalChecks: 0,
    successfulChecks: 0,
    period: "24 hours",
  },
  recentIncidents: [],
  recentChecks: [],
};

// -------------------- Helpers --------------------

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-50 text-red-700 ring-red-600/10";
    case "major":
      return "bg-orange-50 text-orange-700 ring-orange-600/10";
    default:
      return "bg-blue-50 text-blue-700 ring-blue-600/10";
  }
}

// -------------------- Reusable Components --------------------

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
  loading,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconStyle: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <div className={`rounded-xl p-2.5 ${iconStyle}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <h3 className="text-3xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString("en-IN")}
          </h3>
        )}

        <p className="mt-2 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-5 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3">
        <Activity size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

// -------------------- Dashboard --------------------

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Unable to load dashboard data."
        );
      }

      setData(result.data);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const summaryCards = [
    {
      title: "Total Monitors",
      value: data.summary.totalMonitors,
      description: "All registered monitors",
      icon: Activity,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      title: "Operational",
      value: data.summary.operationalMonitors,
      description: "Currently healthy",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Down Monitors",
      value: data.summary.downMonitors,
      description: "Currently unavailable",
      icon: XCircle,
      iconStyle: "bg-red-50 text-red-600",
    },
    {
      title: "Active Incidents",
      value: data.summary.activeIncidents,
      description: "Unresolved incidents",
      icon: AlertTriangle,
      iconStyle: "bg-amber-50 text-amber-600",
    },
  ];

  const totalMonitors = data.summary.totalMonitors;

  const getPercentage = (value: number) =>
    totalMonitors > 0 ? (value / totalMonitors) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                Monitoring Workspace
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Overview
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor your websites and APIs from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchDashboard()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh Data
          </button>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle size={18} />
              {error}
            </div>

            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Monitoring Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A quick look at your monitoring infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.title}
                {...card}
                loading={loading}
              />
            ))}
          </div>
        </section>

        {/* Uptime and Distribution */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* Uptime */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Overall Uptime
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Based on successful checks in the last 24 hours
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="mt-7">
              {loading ? (
                <div className="h-11 w-32 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tight text-slate-900">
                    {data.uptime.percentage === null
                      ? "N/A"
                      : `${data.uptime.percentage}%`}
                  </h3>

                  <span className="text-sm text-slate-500">
                    Last 24 hours
                  </span>
                </div>
              )}
            </div>

            <div
              className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="Overall uptime"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={data.uptime.percentage ?? 0}
            >
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${data.uptime.percentage ?? 0}%`,
                }}
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
              <span className="text-slate-500">
                Successful checks:{" "}
                <strong className="text-slate-800">
                  {loading ? "—" : data.uptime.successfulChecks}
                </strong>
              </span>

              <span className="text-slate-500">
                Total checks:{" "}
                <strong className="text-slate-800">
                  {loading ? "—" : data.uptime.totalChecks}
                </strong>
              </span>
            </div>
          </div>

          {/* Distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Monitor Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current monitor status breakdown
            </p>

            <div className="mt-7 space-y-6">
              {[
                {
                  label: "Operational",
                  value: data.summary.operationalMonitors,
                  color: "bg-emerald-500",
                  textColor: "text-emerald-600",
                },
                {
                  label: "Down",
                  value: data.summary.downMonitors,
                  color: "bg-red-500",
                  textColor: "text-red-600",
                },
                {
                  label: "Paused",
                  value: data.summary.pausedMonitors,
                  color: "bg-slate-400",
                  textColor: "text-slate-500",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <strong className={item.textColor}>
                      {loading ? "—" : item.value}
                    </strong>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{
                        width: `${getPercentage(item.value)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

          {/* Incidents */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <SectionHeading
                title="Recent Incidents"
                description="Latest incident activity"
                icon={AlertTriangle}
              />

              <ArrowUpRight size={18} className="text-slate-400" />
            </div>

            {loading ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-12 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : data.recentIncidents.length === 0 ? (
              <EmptyState message="No incidents found. Everything looks quiet!" />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentIncidents.map((incident) => (
                  <div
                    key={incident._id}
                    className="flex items-start justify-between gap-4 p-5 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {incident.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {incident.monitorId?.name ?? "Unknown monitor"}
                      </p>

                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <Clock3 size={12} />
                        {formatDate(incident.startedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getSeverityStyle(incident.severity)}`}
                      >
                        {incident.severity}
                      </span>

                      <span className="text-xs capitalize text-slate-500">
                        {incident.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Checks */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <SectionHeading
                title="Recent Checks"
                description="Latest monitoring results"
                icon={Activity}
              />

              <ArrowUpRight size={18} className="text-slate-400" />
            </div>

            {loading ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-12 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            ) : data.recentChecks.length === 0 ? (
              <EmptyState message="No monitoring checks available yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.recentChecks.map((check) => (
                  <div
                    key={check._id}
                    className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`rounded-xl p-2.5 ${check.status === "success"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                          }`}
                      >
                        {check.status === "success" ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <XCircle size={19} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {check.monitorId?.name ?? "Unknown monitor"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {check.statusCode
                            ? `HTTP ${check.statusCode}`
                            : check.status}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(check.checkedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-700">
                        {check.responseTime != null
                          ? `${check.responseTime} ms`
                          : "—"}
                      </p>

                      <p
                        className={`mt-1 text-xs font-medium capitalize ${check.status === "success"
                            ? "text-emerald-600"
                            : "text-red-600"
                          }`}
                      >
                        {check.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400">
          <span>ArgusSiteSentinel · Monitoring Dashboard</span>

          <span>
            {lastUpdated
              ? `Last updated: ${lastUpdated}`
              : "Waiting for data"}
          </span>
        </footer>
      </div>
    </DashboardLayout>
  );
}
