
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CheckResult {
  _id: string;
  monitorId: string;
  status: "success" | "failure";
  statusCode: number | null;
  responseTime: number | null;
  errorMessage: string;
  checkedAt: string;
}

interface CheckHistoryResponse {
  success: boolean;
  message?: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: CheckResult[];
}

type TimeRange = "24h" | "7d" | "30d";

interface UptimeAnalyticsProps {
  monitorId: string;
}

export default function UptimeAnalytics({
  monitorId,
}: UptimeAnalyticsProps) {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchChecks = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");

      const firstResponse = await fetch(
        `/api/check-results?monitorId=${encodeURIComponent(monitorId)}&page=1&limit=100`,
        {
          cache: "no-store",
          signal,
        }
      );

      if (!firstResponse.ok) {
        throw new Error("Failed to fetch uptime records.");
      }

      const firstResult: CheckHistoryResponse =
        await firstResponse.json();

      if (!firstResult.success) {
        throw new Error(
          firstResult.message || "Failed to load uptime analytics."
        );
      }

      let allChecks = [...firstResult.data];

      for (
        let page = 2;
        page <= firstResult.pagination.totalPages;
        page++
      ) {
        const response = await fetch(
          `/api/check-results?monitorId=${encodeURIComponent(monitorId)}&page=${page}&limit=100`,
          {
            cache: "no-store",
            signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch remaining records.");
        }

        const result: CheckHistoryResponse = await response.json();

        if (!result.success) {
          throw new Error(
            result.message || "Failed to load uptime analytics."
          );
        }

        allChecks = [...allChecks, ...result.data];
      }

      setChecks(allChecks);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [monitorId]);

  useEffect(() => {
    const controller = new AbortController();

    void fetchChecks(controller.signal);

    return () => controller.abort();
  }, [fetchChecks]);

  // Filter records by selected time range.
  const filteredChecks = useMemo(() => {
    const now = Date.now();

    const hours = {
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30,
    };

    const cutoff = now - hours[timeRange] * 60 * 60 * 1000;

    return checks.filter((check) => {
      const checkedAt = new Date(check.checkedAt).getTime();

      return (
        Number.isFinite(checkedAt) &&
        checkedAt >= cutoff &&
        checkedAt <= now
      );
    });
  }, [checks, timeRange]);

  // Calculate uptime and downtime.
  const analytics = useMemo(() => {
    const total = filteredChecks.length;

    const successful = filteredChecks.filter(
      (check) => check.status === "success"
    ).length;

    const failed = filteredChecks.filter(
      (check) => check.status === "failure"
    ).length;

    const uptime =
      total > 0 ? (successful / total) * 100 : 0;

    const downtime =
      total > 0 ? (failed / total) * 100 : 0;

    return {
      total,
      successful,
      failed,
      uptime,
      downtime,
    };
  }, [filteredChecks]);

  const chartData = [
    {
      name: "Uptime",
      value: analytics.successful,
      color: "#16a34a",
    },
    {
      name: "Downtime",
      value: analytics.failed,
      color: "#ef4444",
    },
  ];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />

            <h2 className="text-lg font-bold text-slate-900">
              Uptime Analytics
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor endpoint availability and downtime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchChecks()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Time Filter */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-4">
        {([
          { label: "Last 24 Hours", value: "24h" },
          { label: "Last 7 Days", value: "7d" },
          { label: "Last 30 Days", value: "30d" },
        ] as const).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTimeRange(option.value)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              timeRange === option.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="m-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin text-blue-600" />
          Loading uptime analytics...
        </div>
      )}

      {/* Analytics */}
      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-500">
                <Activity size={17} />
                <span className="text-sm">Total Checks</span>
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {analytics.total}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={17} />
                <span className="text-sm">Successful Checks</span>
              </div>

              <p className="mt-3 text-2xl font-bold text-emerald-600">
                {analytics.successful}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-red-500">
                <XCircle size={17} />
                <span className="text-sm">Failed Checks</span>
              </div>

              <p className="mt-3 text-2xl font-bold text-red-600">
                {analytics.failed}
              </p>
            </div>
          </div>

          {analytics.total === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 pb-6 text-center">
              <Clock size={32} className="mb-3 text-slate-300" />

              <h3 className="font-semibold text-slate-800">
                No uptime data available
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Check records for this time period will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-center gap-6 px-5 pb-6 lg:grid-cols-2">
              {/* Donut Chart */}
              <div className="relative h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={analytics.failed > 0 ? 4 : 0}
                      stroke="none"
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [
                        `${value} checks`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">
                    {analytics.uptime.toFixed(2)}%
                  </span>

                  <span className="mt-1 text-xs font-medium text-slate-500">
                    Uptime
                  </span>
                </div>
              </div>

              {/* Uptime Details */}
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-slate-500">
                    Uptime Percentage
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {analytics.uptime.toFixed(2)}%
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Based on successful monitoring checks.
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Uptime
                    </span>

                    <span className="text-sm font-semibold text-emerald-600">
                      {analytics.uptime.toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${analytics.uptime}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Downtime
                    </span>

                    <span className="text-sm font-semibold text-red-600">
                      {analytics.downtime.toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all"
                      style={{ width: `${analytics.downtime}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
