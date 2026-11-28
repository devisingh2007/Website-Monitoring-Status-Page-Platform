
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Globe,
  ExternalLink,
  Save,
  AlertCircle,
} from "lucide-react";

type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved";

type IncidentSeverity = "minor" | "major" | "critical";

interface IncidentMonitor {
  _id: string;
  name: string;
  url: string;
  type: "website" | "api";
  status: string;
}

interface Incident {
  _id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  startedAt: string;
  resolvedAt: string | null;
  monitorId: IncidentMonitor | null;
}

interface IncidentHistory {
  _id: string;
  message: string;
  status: IncidentStatus | null;
  createdAt: string;
}

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

const statuses: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
];

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function IncidentDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const incidentId = params.id;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [history, setHistory] = useState<IncidentHistory[]>([]);
  const [selectedStatus, setSelectedStatus] =
    useState<IncidentStatus>("investigating");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchIncidentData = useCallback(async () => {
    try {
      setError("");

      const [incidentResponse, historyResponse] = await Promise.all([
        fetch(`/api/incidents/${incidentId}`, {
          cache: "no-store",
        }),
        fetch(`/api/incidents/${incidentId}/history`, {
          cache: "no-store",
        }),
      ]);

      const incidentResult = await incidentResponse.json();
      const historyResult = await historyResponse.json();

      if (!incidentResponse.ok || !incidentResult.success) {
        throw new Error(
          incidentResult.message || "Failed to fetch incident"
        );
      }

      if (!historyResponse.ok || !historyResult.success) {
        throw new Error(
          historyResult.message || "Failed to fetch incident history"
        );
      }

      setIncident(incidentResult.data);
      setSelectedStatus(incidentResult.data.status);
      setHistory(historyResult.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [incidentId]);

  useEffect(() => {
    void fetchIncidentData();
  }, [fetchIncidentData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIncidentData();
  };

  const handleStatusUpdate = async () => {
    if (!incident || selectedStatus === incident.status) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update incident");
      }

      setSuccessMessage("Incident status updated successfully.");

      await fetchIncidentData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading incident details...
          </p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Incident not found
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {error || "This incident may have been deleted or does not exist."}
        </p>
        <Link
          href="/incidents"
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/incidents"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to incidents
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {incident.title}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                severityStyles[incident.severity]
              }`}
            >
              {incident.severity}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Incident ID: {incident._id}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Status and Severity Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <InfoCard
          title="Current Status"
          value={incident.status}
          icon={<Activity className="h-5 w-5" />}
        >
          <span
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
              statusStyles[incident.status]
            }`}
          >
            {incident.status}
          </span>
        </InfoCard>

        <InfoCard
          title="Severity"
          value={incident.severity}
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              severityStyles[incident.severity]
            }`}
          >
            {incident.severity}
          </span>
        </InfoCard>

        <InfoCard
          title="Started At"
          value={formatDate(incident.startedAt)}
          icon={<Clock3 className="h-5 w-5" />}
        >
          <p className="mt-3 text-xs text-slate-500">
            {incident.resolvedAt
              ? `Resolved: ${formatDate(incident.resolvedAt)}`
              : "Incident is not resolved yet"}
          </p>
        </InfoCard>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Description */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Incident Description
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {incident.description}
            </p>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Incident Timeline
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Automatically recorded incident activity.
                </p>
              </div>

              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>

            {history.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No timeline activity available.
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                {history.map((item, index) => (
                  <div key={item._id} className="relative flex gap-4">
                    {index !== history.length - 1 && (
                      <div className="absolute left-[11px] top-7 h-full w-px bg-slate-200" />
                    )}

                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {item.message}
                      </p>

                      {item.status && (
                        <span
                          className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                            statusStyles[item.status]
                          }`}
                        >
                          {item.status}
                        </span>
                      )}

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Update Incident Status
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Change the current investigation stage.
            </p>

            <label
              htmlFor="incident-status"
              className="mt-5 block text-sm font-medium text-slate-700"
            >
              New Status
            </label>

            <select
              id="incident-status"
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as IncidentStatus)
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={handleStatusUpdate}
              disabled={
                saving ||
                selectedStatus === incident.status
              }
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Updating..." : "Update Status"}
            </button>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Status changes are automatically recorded in the incident
              timeline.
            </p>
          </section>

          {/* Monitor Information */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Affected Monitor
            </h2>

            {incident.monitorId ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                    <Globe className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {incident.monitorId.name}
                    </p>
                    <p className="text-xs capitalize text-slate-500">
                      {incident.monitorId.type}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Monitor URL
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-700">
                    {incident.monitorId.url}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Current Monitor Status
                  </p>
                  <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                    {incident.monitorId.status}
                  </p>
                </div>

                <Link
                  href={`/monitors/${incident.monitorId._id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View Monitor
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Associated monitor is unavailable.
              </p>
            )}
          </section>

          {/* Resolution Information */}
          {incident.resolvedAt && (
            <section className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="font-semibold">Incident Resolved</h2>
              </div>

              <p className="mt-2 text-sm text-green-700">
                This incident was resolved on:
              </p>

              <p className="mt-2 text-sm font-semibold text-green-800">
                {formatDate(incident.resolvedAt)}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
  children,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-lg bg-slate-50 p-2 text-slate-500">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-lg font-bold capitalize text-slate-900">
        {value}
      </p>

      {children}
    </div>
  );
}

export default function IncidentDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <IncidentDetailsContent />
    </Suspense>
  );
}
