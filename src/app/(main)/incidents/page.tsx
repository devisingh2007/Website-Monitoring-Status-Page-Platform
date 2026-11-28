"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { IncidentStatus,IncidentSeverity,Pagination,Incident } from "@/types/incident";

const statusStyles: Record<IncidentStatus, string> = {
  investigating: "bg-red-50 text-red-700 border-red-200",
  identified: "bg-orange-50 text-orange-700 border-orange-200",
  monitoring: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
};

const severityStyles: Record<IncidentSeverity, string> = {
  minor: "bg-slate-100 text-slate-700",
  major: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setError("");

      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });

      if (statusFilter) params.set("status", statusFilter);
      if (severityFilter) params.set("severity", severityFilter);

      const response = await fetch(
        `/api/incidents?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch incidents");
      }

      setIncidents(result.data ?? []);
      setPagination(result.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, severityFilter]);

  useEffect(() => {
    setLoading(true);
    void fetchIncidents();
  }, [fetchIncidents]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSeverityChange = (value: string) => {
    setSeverityFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const activeCount = incidents.filter(
    (incident) => incident.status !== "resolved"
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === "resolved"
  ).length;

  const criticalCount = incidents.filter(
    (incident) => incident.severity === "critical"
  ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchIncidents();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Incidents
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor, investigate and manage service incidents.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Incidents"
          value={pagination.total}
          icon={<ShieldAlert className="h-5 w-5" />}
          color="blue"
        />

        <StatCard
          title="Active on This Page"
          value={activeCount}
          icon={<Clock3 className="h-5 w-5" />}
          color="orange"
        />

        <StatCard
          title="Critical on This Page"
          value={criticalCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />

        <StatCard
          title="Resolved on This Page"
          value={resolvedCount}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">
            All Incidents
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Filter incidents by their status and severity.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Statuses</option>
            <option value="investigating">Investigating</option>
            <option value="identified">Identified</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => handleSeverityChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to load incidents</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Incident Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Incident
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Monitor
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Severity
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Started At
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading incidents...
                    </p>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <CheckCircle2 className="mx-auto h-9 w-9 text-green-500" />
                    <p className="mt-3 font-semibold text-slate-800">
                      No incidents found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your filters or check back later.
                    </p>
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="max-w-[260px] px-5 py-4">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {incident.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {incident.description}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {incident.monitorId?.name ?? "Monitor unavailable"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {incident.monitorId?.type ?? "Unknown"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          severityStyles[incident.severity]
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                          statusStyles[incident.status]
                        }`}
                      >
                        {incident.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {formatDate(incident.startedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/incidents/${incident._id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                      >
                        View
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && incidents.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.totalPages}
              {" "}({pagination.total} incidents)
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page - 1,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "orange" | "red" | "green";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}
