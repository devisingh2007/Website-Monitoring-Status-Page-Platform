
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Monitor,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Project {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface ProjectsApiResponse {
  success: boolean;
  data: Project[];
  message?: string;
}

const INTERVAL_OPTIONS = [
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "20 minutes", value: 1200 },
  { label: "25 minutes", value: 1500 },
  { label: "30 minutes", value: 1800 },
];

export default function NewMonitorPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"website" | "api">("website");
  const [interval, setInterval] = useState(300);
  const [timeout, setTimeoutValue] = useState(10000);
  const [expectedStatusCodes, setExpectedStatusCodes] =
    useState("200");

  // Read optional projectId from the URL query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedProjectId = params.get("projectId");

    if (selectedProjectId) {
      setProjectId(selectedProjectId);
    }
  }, []);

  // Fetch active projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoadingProjects(true);

        const response = await fetch("/api/projects", {
          cache: "no-store",
        });

        const result: ProjectsApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load projects");
        }

        const activeProjects = result.data.filter(
          (project) => project.isActive
        );

        setProjects(activeProjects);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load projects"
        );
      } finally {
        setLoadingProjects(false);
      }
    }

    void fetchProjects();
  }, []);

  // Create monitor
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const statusCodes = expectedStatusCodes
        .split(",")
        .map((code) => Number(code.trim()));

      if (
        statusCodes.length === 0 ||
        statusCodes.some(
          (code) =>
            !Number.isInteger(code) || code < 200 || code > 599
        )
      ) {
        throw new Error(
          "Enter valid HTTP status codes between 200 and 599."
        );
      }

      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          name,
          url,
          type,
          interval,
          timeout,
          expectedStatusCodes: [...new Set(statusCodes)],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create monitor");
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/monitors"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Monitors
        </Link>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Monitor size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Monitor
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Add a website or API endpoint to monitor.
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
        {/* Project */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select Project
          </label>

          <select
            required
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={loadingProjects}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
          >
            <option value="">
              {loadingProjects
                ? "Loading projects..."
                : "Choose a project"}
            </option>

            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>

          {!loadingProjects && projects.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              No active projects found. Create an active project first.
            </p>
          )}
        </div>

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
            placeholder="e.g. Production Website"
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

          <p className="mt-2 text-xs text-slate-400">
            Only HTTP and HTTPS URLs are supported.
          </p>
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
              className={`rounded-lg border p-4 text-left transition ${
                type === "website"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Globe size={21} />
              <p className="mt-2 text-sm font-semibold">Website</p>
              <p className="mt-1 text-xs opacity-75">
                Monitor a website URL
              </p>
            </button>

            <button
              type="button"
              onClick={() => setType("api")}
              className={`rounded-lg border p-4 text-left transition ${
                type === "api"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Monitor size={21} />
              <p className="mt-2 text-sm font-semibold">API</p>
              <p className="mt-1 text-xs opacity-75">
                Monitor an API endpoint
              </p>
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

          <p className="mt-2 text-xs text-slate-400">
            How frequently the monitor should check the endpoint.
          </p>
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
            Separate multiple status codes with commas. Example: 200, 201, 204.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Link
            href="/projects"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting ||
              loadingProjects ||
              projects.length === 0 ||
              !projectId
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={17} />
                Create Monitor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
