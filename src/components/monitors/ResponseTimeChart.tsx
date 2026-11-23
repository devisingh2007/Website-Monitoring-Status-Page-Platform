"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    Clock,
    Loader2,
    RefreshCw,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
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

interface ResponseTimeChartProps {
    monitorId: string;
}

export default function ResponseTimeChart({
    monitorId,
}: ResponseTimeChartProps) {
    const [checks, setChecks] = useState<CheckResult[]>([]);
    const [timeRange, setTimeRange] = useState<TimeRange>("24h");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchResponseTimes = useCallback(
        async (signal?: AbortSignal) => {
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
                    throw new Error("Failed to fetch response time history.");
                }

                const firstResult: CheckHistoryResponse =
                    await firstResponse.json();

                if (!firstResult.success) {
                    throw new Error(
                        firstResult.message || "Failed to load analytics."
                    );
                }

                let allChecks = [...firstResult.data];

                // Fetch remaining pages if available.
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
                        throw new Error("Failed to fetch remaining check records.");
                    }

                    const result: CheckHistoryResponse = await response.json();

                    if (!result.success) {
                        throw new Error(
                            result.message || "Failed to load analytics."
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
        },
        [monitorId]
    );

    useEffect(() => {
        const controller = new AbortController();

        void fetchResponseTimes(controller.signal);

        return () => controller.abort();
    }, [fetchResponseTimes]);

    // Filter successful checks by selected time range.
    const filteredChecks = useMemo(() => {
        const now = Date.now();

        const rangeInHours = {
            "24h": 24,
            "7d": 24 * 7,
            "30d": 24 * 30,
        };

        const cutoff =
            now - rangeInHours[timeRange] * 60 * 60 * 1000;

        return checks
            .filter(
                (check) =>
                    check.status === "success" &&
                    check.responseTime !== null &&
                    Number.isFinite(check.responseTime) &&
                    new Date(check.checkedAt).getTime() >= cutoff
            )
            .sort(
                (a, b) =>
                    new Date(a.checkedAt).getTime() -
                    new Date(b.checkedAt).getTime()
            );
    }, [checks, timeRange]);

    // Chart data.
    const chartData = useMemo(() => {
        return filteredChecks.map((check) => ({
            time: new Date(check.checkedAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }),
            responseTime: check.responseTime,
        }));
    }, [filteredChecks]);

    // Analytics.
    const analytics = useMemo(() => {
        const values = filteredChecks
            .map((check) => check.responseTime)
            .filter((value): value is number => value !== null);

        if (values.length === 0) {
            return {
                average: null,
                minimum: null,
                maximum: null,
            };
        }

        const total = values.reduce((sum, value) => sum + value, 0);

        return {
            average: Math.round(total / values.length),
            minimum: Math.min(...values),
            maximum: Math.max(...values),
        };
    }, [filteredChecks]);

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Activity size={20} className="text-blue-600" />

                        <h2 className="text-lg font-bold text-slate-900">
                            Response Time Analytics
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor your endpoint response performance over time.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void fetchResponseTimes()}
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

            {/* Time Filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
                {([
                    { label: "Last 24 Hours", value: "24h" },
                    { label: "Last 7 Days", value: "7d" },
                    { label: "Last 30 Days", value: "30d" },
                ] as const).map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimeRange(option.value)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${timeRange === option.value
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
                    Loading analytics...
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Analytics Cards */}
                    <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Activity size={17} />
                                <span className="text-sm">Average Response</span>
                            </div>

                            <p className="mt-3 text-2xl font-bold text-slate-900">
                                {analytics.average !== null
                                    ? `${analytics.average} ms`
                                    : "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-slate-500">
                                <TrendingDown size={17} />
                                <span className="text-sm">Fastest Response</span>
                            </div>

                            <p className="mt-3 text-2xl font-bold text-emerald-600">
                                {analytics.minimum !== null
                                    ? `${analytics.minimum} ms`
                                    : "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 text-slate-500">
                                <TrendingUp size={17} />
                                <span className="text-sm">Slowest Response</span>
                            </div>

                            <p className="mt-3 text-2xl font-bold text-slate-900">
                                {analytics.maximum !== null
                                    ? `${analytics.maximum} ms`
                                    : "—"}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    {chartData.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 pb-6 text-center">
                            <Clock size={32} className="mb-3 text-slate-300" />

                            <h3 className="font-semibold text-slate-800">
                                No response data available
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Successful checks for this time period will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="px-3 pb-6 sm:px-5">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    Response Time (ms)
                                </h3>

                                <span className="text-xs text-slate-400">
                                    {chartData.length} successful checks
                                </span>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 15,
                                            left: 0,
                                            bottom: 10,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="time"
                                            tick={{ fontSize: 11 }}
                                            minTickGap={30}
                                        />

                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            width={55}
                                            tickFormatter={(value) => `${value} ms`}
                                        />

                                        <Tooltip
                                            formatter={(value) => [
                                                `${value} ms`,
                                                "Response Time",
                                            ]}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="responseTime"
                                            stroke="#2563eb"
                                            strokeWidth={2.5}
                                            dot={chartData.length <= 20}
                                            activeDot={{ r: 6 }}
                                            connectNulls
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
