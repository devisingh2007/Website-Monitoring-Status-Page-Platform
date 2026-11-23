"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CheckHistory from "@/components/monitors/CheckHistory";
import { Suspense } from "react";

import {
  ArrowLeft,
  Globe,
  Monitor,
  Activity,
  AlertTriangle,
  PauseCircle,
  Clock,
  RefreshCw,
  Loader2,
  Pencil,
  ExternalLink,
  FolderKanban,
  Timer,
  CheckCircle2,
  Trash2,X
} from "lucide-react";

type MonitorStatus = "operational" | "down" | "paused";
type MonitorType = "website" | "api";

interface MonitorProject {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface MonitorDetails {
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
  updatedAt: string;
}

interface MonitorApiResponse {
  success: boolean;
  message: string;
  data: MonitorDetails;
}

 function MonitorDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const monitorId = params.id;

  const [monitor, setMonitor] = useState<MonitorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [deleting, setDeleting] = useState(false);
const [deleteError, setDeleteError] = useState("");
const requestedMonitorId = useRef<string | null>(null);
  const fetchMonitorDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/monitors/${monitorId}`, {
        cache: "no-store",
      });

      const result: MonitorApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch monitor details"
        );
      }

      setMonitor(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [monitorId]);


const handleDeleteMonitor = async () => {
  try {
    setDeleting(true);
    setDeleteError("");

    const response = await fetch(`/api/monitors/${monitorId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to delete monitor"
      );
    }

    setDeleteDialogOpen(false);

    router.replace("/monitors");
    router.refresh();

  } catch (error) {
    setDeleteError(
      error instanceof Error
        ? error.message
        : "Failed to delete monitor"
    );
  } finally {
    setDeleting(false);
  }
};


useEffect(() => {
  if (!monitorId) return;

  // Prevent duplicate initial request in React Strict Mode
  if (requestedMonitorId.current === monitorId) {
    return;
  }

  requestedMonitorId.current = monitorId;

  void fetchMonitorDetails();
}, [monitorId, fetchMonitorDetails]);
  function getProjectName(projectId: MonitorProject | string) {
    return typeof projectId === "object"
      ? projectId?.name ?? "Unknown Project"
      : "Project information unavailable";
  }

  function getProjectId(projectId: MonitorProject | string) {
    return typeof projectId === "object"
      ? projectId?._id
      : projectId;
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

  function getStatusIcon(status: MonitorStatus) {
    switch (status) {
      case "operational":
        return <CheckCircle2 size={22} />;

      case "down":
        return <AlertTriangle size={22} />;

      case "paused":
        return <PauseCircle size={22} />;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <Loader2 size={22} className="animate-spin" />
        Loading monitor details...
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertTriangle
          className="mx-auto mb-3 text-red-500"
          size={30}
        />

        <h2 className="font-semibold text-slate-900">
          Unable to load monitor
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error || "Monitor not found"}
        </p>

        <button
          onClick={() => void fetchMonitorDetails()}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold !text-white hover:bg-blue-700"
        >
          Try Again
        </button>

        <div>
          <Link
            href="/monitors"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Back to Monitors
          </Link>
        </div>
      </div>
    );
  }

  const projectId = getProjectId(monitor.projectId);

  const configuration = [
    {
      label: "Monitor Type",
      value: monitor.type.toUpperCase(),
    },
    {
      label: "Check Interval",
      value: `${monitor.interval / 60} minutes`,
    },
    {
      label: "Request Timeout",
      value: `${monitor.timeout / 1000} seconds`,
    },
    {
      label: "Failure Count",
      value: String(monitor.failureCount),
    },
    {
      label: "Monitoring Enabled",
      value: monitor.enabled ? "Yes" : "No",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* Header */}
      <div>
        <Link
          href="/monitors"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Monitors
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Monitor size={27} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-slate-900">
                {monitor.name}
              </h1>

              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm text-slate-500 hover:text-blue-600"
              >
                <span className="truncate">{monitor.url}</span>
                <ExternalLink size={13} className="shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void fetchMonitorDetails()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <Link
              href={`/monitors/${monitor._id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
            >
              <Pencil size={16} />
              Edit Monitor
            </Link>
            <button
  onClick={() => {
    setDeleteError("");
    setDeleteDialogOpen(true);
  }}
  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
>
  <Trash2 size={16} />
  Delete Monitor
</button>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Current Monitor Status
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div
                className={`rounded-xl p-3 ${getStatusStyle(monitor.status)}`}
              >
                {getStatusIcon(monitor.status)}
              </div>

              <div>
                <h2 className="text-xl font-bold capitalize text-slate-900">
                  {monitor.status}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {monitor.enabled
                    ? "Monitor is enabled"
                    : "Monitor is disabled"}
                </p>
              </div>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-semibold capitalize ${getStatusStyle(
              monitor.status
            )}`}
          >
            {monitor.status}
          </span>
        </div>
      </section>

      {/* Performance Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Response Time
            </p>
            <Activity className="text-blue-600" size={21} />
          </div>

          <p className="mt-4 text-3xl font-bold text-slate-900">
            {monitor.lastResponseTime !== null
              ? `${monitor.lastResponseTime} ms`
              : "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Last Checked
            </p>
            <Clock className="text-blue-600" size={21} />
          </div>

          <p className="mt-4 text-lg font-bold text-slate-900">
            {monitor.lastCheckedAt
              ? new Date(monitor.lastCheckedAt).toLocaleString()
              : "Not checked yet"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Next Scheduled Check
            </p>
            <Timer className="text-blue-600" size={21} />
          </div>

          <p className="mt-4 text-lg font-bold text-slate-900">
            {monitor.enabled
              ? new Date(monitor.nextCheckAt).toLocaleString()
              : "Disabled"}
          </p>
        </div>
      </section>

      {/* Monitor Configuration */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Monitor size={20} className="text-blue-600" />

          <h2 className="font-semibold text-slate-900">
            Monitor Configuration
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {configuration.map((item) => (
            <div
              key={item.label}
              className="border-b border-slate-100 pb-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {item.label}
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        
      </section>
{monitor && (
  < CheckHistory monitorId={monitor._id} />
)}
      {/* Expected Status Codes */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-blue-600" />

          <h2 className="font-semibold text-slate-900">
            Expected HTTP Status Codes
          </h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {monitor.expectedStatusCodes.map((code) => (
            <span
              key={code}
              className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
            >
              {code}
            </span>
          ))}
        </div>
      </section>

      {/* Associated Project */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <FolderKanban size={20} className="text-blue-600" />

          <h2 className="font-semibold text-slate-900">
            Associated Project
          </h2>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-slate-900">
              {getProjectName(monitor.projectId)}
            </p>

            {typeof monitor.projectId === "object" && (
              <p className="mt-1 text-sm text-slate-500">
                {monitor.projectId.slug}
              </p>
            )}
          </div>

          {projectId && (
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View Project
              <ExternalLink size={14} />
            </Link>
          )}
        </div>
      </section>
{monitor && (
  <CheckHistory monitorId={monitor._id} />
)}
      {/* Timestamps */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">
          Record Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">Created At</p>
            <p className="mt-1 text-sm text-slate-700">
              {new Date(monitor.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Last Updated</p>
            <p className="mt-1 text-sm text-slate-700">
              {new Date(monitor.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </section>
{deleteDialogOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-3 text-red-600">
            <Trash2 size={22} />
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            Delete Monitor?
          </h2>
        </div>

        <button
          type="button"
          disabled={deleting}
          onClick={() => setDeleteDialogOpen(false)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>
      </div>

      <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          You are about to permanently delete:
        </p>

        <p className="mt-2 font-semibold text-red-900">
          {monitor.name}
        </p>

        <p className="mt-1 break-all text-xs text-red-700">
          {monitor.url}
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        All associated check results, incidents and incident
        histories will also be permanently deleted.
      </p>

      {deleteError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={deleting}
          onClick={() => setDeleteDialogOpen(false)}
          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDeleteMonitor}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Delete Permanently
            </>
          )}
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
}
export default function MonitorDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-500">Loading monitor details...</p>
        </div>
      }
    >
      <MonitorDetailsContent />
    </Suspense>
  );
}