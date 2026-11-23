
"use client";

import { useCallback, useEffect, useState,useRef } from "react";
import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Monitor,
  Globe,
} from "lucide-react";

type MonitorType = "website" | "api";

interface MonitorDetails {
  _id: string;
  projectId: string | { _id: string; name: string };
  name: string;
  url: string;
  type: MonitorType;
  interval: number;
  timeout: number;
  expectedStatusCodes: number[];
  enabled: boolean;
}

interface MonitorApiResponse {
  success: boolean;
  message: string;
  data: MonitorDetails;
}

const INTERVAL_OPTIONS = [
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "20 minutes", value: 1200 },
  { label: "25 minutes", value: 1500 },
  { label: "30 minutes", value: 1800 },
];

 function EditMonitorContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const monitorId = params.id;

  const [monitor, setMonitor] = useState<MonitorDetails | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<MonitorType>("website");
  const [interval, setInterval] = useState(300);
  const [timeout, setTimeoutValue] = useState(10000);
  const [expectedStatusCodes, setExpectedStatusCodes] = useState("200");
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
const requestedMonitorId = useRef<string | null>(null);
  // Fetch existing monitor
  const fetchMonitor = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/monitors/${monitorId}`, {
        cache: "no-store",
      });

      const result: MonitorApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load monitor");
      }

      const data = result.data;

      setMonitor(data);
      setName(data.name);
      setUrl(data.url);
      setType(data.type);
      setInterval(data.interval);
      setTimeoutValue(data.timeout);
      setExpectedStatusCodes(
        data.expectedStatusCodes.join(", ")
      );
      setEnabled(data.enabled);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [monitorId]);

useEffect(() => {
  if (!monitorId) return;

  if (requestedMonitorId.current === monitorId) return;

  requestedMonitorId.current = monitorId;
  void fetchMonitor();
}, [monitorId, fetchMonitor]);

  // Update monitor
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

     const statusCodes = expectedStatusCodes
  .split(",")
  .map((code) => code.trim())
  .filter(Boolean)
  .map(Number);

if (
  statusCodes.length === 0 ||
  statusCodes.some(
    (code) =>
      !Number.isInteger(code) ||
      code < 200 ||
      code > 599
  )
) {
  throw new Error(
    "Enter valid HTTP status codes between 200 and 599."
  );
}

const uniqueStatusCodes = [...new Set(statusCodes)];

      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          type,
          interval,
          timeout,
         expectedStatusCodes: uniqueStatusCodes,
          enabled,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update monitor");
      }

      router.push(`/monitors/${monitorId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <Loader2 size={22} className="animate-spin" />
        Loading monitor...
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={30} />

        <h2 className="font-semibold text-slate-900">
          Unable to load monitor
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error || "Monitor not found"}
        </p>

        <Link
          href="/monitors"
          className="mt-5 inline-block text-sm text-blue-600 hover:underline"
        >
          Back to Monitors
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <Link
          href={`/monitors/${monitorId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Monitor
        </Link>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Monitor size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Edit Monitor
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update your website or API monitoring configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >

        {/* Monitor Name */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Monitor Name
          </label>

          <input
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production Website"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* URL */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Website / API URL
          </label>

          <div className="relative">
            <Globe
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              required
              type="url"
              maxLength={2048}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Monitor Type */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Monitor Type
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("website")}
              className={`rounded-lg border p-4 text-left ${
                type === "website"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Globe size={21} />
              <p className="mt-2 text-sm font-semibold">Website</p>
            </button>

            <button
              type="button"
              onClick={() => setType("api")}
              className={`rounded-lg border p-4 text-left ${
                type === "api"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Monitor size={21} />
              <p className="mt-2 text-sm font-semibold">API</p>
            </button>
          </div>
        </div>

        {/* Interval */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Check Interval
          </label>

          <select
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            {INTERVAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timeout */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Request Timeout
          </label>

          <select
            value={timeout}
            onChange={(e) => setTimeoutValue(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value={5000}>5 seconds</option>
            <option value={10000}>10 seconds</option>
            <option value={15000}>15 seconds</option>
            <option value={20000}>20 seconds</option>
            <option value={30000}>30 seconds</option>
          </select>
        </div>

        {/* Expected Status Codes */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Expected HTTP Status Codes
          </label>

          <input
            required
            value={expectedStatusCodes}
            onChange={(e) => setExpectedStatusCodes(e.target.value)}
            placeholder="200, 201, 204"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <p className="mt-2 text-xs text-slate-400">
            Separate multiple codes using commas. Example: 200, 201, 204.
          </p>
        </div>

        {/* Enabled */}
        <div className="rounded-lg border border-slate-200 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Enable Monitoring
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Turn monitoring on or off for this endpoint.
              </p>
            </div>

            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-5 w-5 accent-blue-600"
            />
          </label>
        </div>

        {/* Project Information */}
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Associated Project
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-800">
            {typeof monitor.projectId === "object"
              ? monitor.projectId.name
              : "Project information unavailable"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Project association cannot be changed here.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Link
            href={`/monitors/${monitorId}`}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || !name.trim() || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


export default function EditMonitorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      }
    >
      <EditMonitorContent />
    </Suspense>
  );
}