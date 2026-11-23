
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

interface CheckResult {
  _id: string;
  monitorId: string;
  status: "success" | "failure";
  statusCode: number | null;
  responseTime: number | null;
  errorMessage: string;
  checkedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CheckHistoryResponse {
  success: boolean;
  message?: string;
  pagination: Pagination;
  data: CheckResult[];
}

interface CheckHistoryProps {
  monitorId: string;
}

export default function CheckHistory({
  monitorId,
}: CheckHistoryProps) {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCheckHistory = useCallback(
    async (page: number, signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError("");

       const response = await fetch(
  `/api/check-results?monitorId=${monitorId}&page=${page}&limit=10`,
  {
    cache: "no-store",
    signal,
  }
);

const result: CheckHistoryResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to fetch check history"
          );
        }

        setChecks(result.data);
        setPagination(result.pagination);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
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

    void fetchCheckHistory(pagination.page, controller.signal);

    return () => controller.abort();
  }, [fetchCheckHistory, pagination.page]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (
      newPage < 1 ||
      newPage > pagination.totalPages ||
      newPage === pagination.page
    ) {
      return;
    }

    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={19} className="text-blue-600" />

            <h2 className="text-lg font-bold text-slate-900">
              Check History
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            View your monitor's previous health checks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchCheckHistory(pagination.page)}
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

      {/* Summary */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <p className="text-sm text-slate-500">
          Total checks:{" "}
          <span className="font-semibold text-slate-900">
            {pagination.total}
          </span>
        </p>
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
        <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin text-blue-600" />
          Loading check history...
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && checks.length === 0 && (
        <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
          <Activity size={32} className="mb-3 text-slate-300" />

          <h3 className="font-semibold text-slate-800">
            No check history yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Check results will appear here once monitoring starts.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && checks.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">HTTP Code</th>
                  <th className="px-5 py-4 font-semibold">
                    Response Time
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Checked At
                  </th>
                  <th className="px-5 py-4 font-semibold">
                    Error Message
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {checks.map((check) => (
                  <tr
                    key={check._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      {check.status === "success" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2 size={14} />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <XCircle size={14} />
                          Failure
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {check.statusCode ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                        <Clock size={14} className="text-slate-400" />
                        {check.responseTime !== null
                          ? `${check.responseTime} ms`
                          : "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(check.checkedAt)}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-sm text-slate-500">
                      <span className="block truncate">
                        {check.errorMessage || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              {(pagination.page - 1) * pagination.limit + 1}
              {" - "}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}{" "}
              of {pagination.total} checks
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="px-2 text-sm font-medium text-slate-600">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={
                  pagination.page >= pagination.totalPages || loading
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
