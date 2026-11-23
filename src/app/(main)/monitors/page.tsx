
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Activity,
  AlertTriangle,
  Clock,
  Globe,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  Loader2,
  ExternalLink,
  PauseCircle,
} from "lucide-react";

type MonitorStatus = "operational" | "down" | "paused";
type MonitorType = "website" | "api";

interface MonitorProject {
  _id: string;
  name: string;
  slug: string;
}

interface MonitorItem {
  _id: string;
  projectId: MonitorProject | string;
  name: string;
  url: string;
  type: MonitorType;
  interval: number;
  timeout: number;
  expectedStatusCodes: number[];
  status: MonitorStatus;
  enabled: boolean;
  failureCount: number;
  nextCheckAt: string;
  lastCheckedAt: string | null;
  lastResponseTime: number | null;
  createdAt: string;
}

interface MonitorsApiResponse {
  success: boolean;
  message?: string;
  count?: number;
  data: MonitorItem[];
}

type StatusFilter = "all" | MonitorStatus;
type TypeFilter = "all" | MonitorType;

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const fetchMonitors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/monitors", {
        cache: "no-store",
      });

      const result: MonitorsApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch monitors");
      }

      setMonitors(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMonitors();
  }, [fetchMonitors]);

  const filteredMonitors = useMemo(() => {
    return monitors.filter((monitor) => {
      const projectName =
        typeof monitor.projectId === "object"
          ? monitor.projectId?.name ?? ""
          : "";

      const matchesSearch =
        monitor.name.toLowerCase().includes(search.toLowerCase()) ||
        monitor.url.toLowerCase().includes(search.toLowerCase()) ||
        projectName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || monitor.status === statusFilter;

      const matchesType =
        typeFilter === "all" || monitor.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [monitors, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: monitors.length,
      operational: monitors.filter(
        (monitor) => monitor.status === "operational"
      ).length,
      down: monitors.filter(
        (monitor) => monitor.status === "down"
      ).length,
      paused: monitors.filter(
        (monitor) => monitor.status === "paused"
      ).length,
    }),
    [monitors]
  );

  const statCards = [
    {
      label: "Total Monitors",
      value: stats.total,
      icon: Monitor,
      color: "text-blue-600",
      background: "bg-blue-50",
    },
    {
      label: "Operational",
      value: stats.operational,
      icon: Activity,
      color: "text-emerald-600",
      background: "bg-emerald-50",
    },
    {
      label: "Down",
      value: stats.down,
      icon: AlertTriangle,
      color: "text-red-600",
      background: "bg-red-50",
    },
    {
      label: "Paused",
      value: stats.paused,
      icon: PauseCircle,
      color: "text-amber-600",
      background: "bg-amber-50",
    },
  ];

  function getProjectName(projectId: MonitorProject | string) {
    return typeof projectId === "object"
      ? projectId?.name ?? "Unknown Project"
      : "Project not populated";
  }

  function getStatusStyle(status: MonitorStatus) {
    switch (status) {
      case "operational":
        return "bg-emerald-50 text-emerald-700";

      case "down":
        return "bg-red-50 text-red-700";

      case "paused":
        return "bg-amber-50 text-amber-700";
    }
  }

  function formatInterval(seconds: number) {
    return `${seconds / 60} min`;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Monitor Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor all your websites and APIs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchMonitors()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            href="/monitors/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Create Monitor
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {card.label}
                </p>

                <div
                  className={`rounded-lg p-2 ${card.background} ${card.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search monitor, URL or project..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilter)
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All statuses</option>
            <option value="operational">Operational</option>
            <option value="down">Down</option>
            <option value="paused">Paused</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as TypeFilter)
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All types</option>
            <option value="website">Website</option>
            <option value="api">API</option>
          </select>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

          <button
            onClick={() => void fetchMonitors()}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Monitor Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">
              All Monitors
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredMonitors.length} of {monitors.length} monitors
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
            <Loader2 size={22} className="animate-spin" />
            Loading monitors...
          </div>
        ) : filteredMonitors.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-blue-50 p-4 text-blue-600">
              <Monitor size={28} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {monitors.length === 0
                ? "No monitors found"
                : "No matching monitors"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {monitors.length === 0
                ? "Create your first monitor to start tracking your websites and APIs."
                : "Try changing your search or filter criteria."}
            </p>

            {monitors.length === 0 && (
              <Link
                href="/monitors/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Create Monitor
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Monitor</th>
                  <th className="px-5 py-4">Project</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Interval</th>
                  <th className="px-5 py-4">Response Time</th>
                  <th className="px-5 py-4">Last Checked</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredMonitors.map((monitor) => (
                  <tr
                    key={monitor._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Globe size={18} />
                        </div>

                        <div className="min-w-0">
                          <Link
  href={`/monitors/${monitor._id}`}
  className="font-semibold text-slate-900 hover:text-blue-600"
>
  {monitor.name}
</Link>

                          <a
                            href={monitor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex max-w-64 items-center gap-1 truncate text-xs text-slate-500 hover:text-blue-600"
                          >
                            <span className="truncate">{monitor.url}</span>
                            <ExternalLink
                              size={12}
                              className="shrink-0"
                            />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {getProjectName(monitor.projectId)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                        {monitor.type}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                          monitor.status
                        )}`}
                      >
                        {monitor.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Clock size={14} />
                        {formatInterval(monitor.interval)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {monitor.lastResponseTime !== null
                        ? `${monitor.lastResponseTime} ms`
                        : "N/A"}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {monitor.lastCheckedAt
                        ? new Date(
                            monitor.lastCheckedAt
                          ).toLocaleString()
                        : "Not checked yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
