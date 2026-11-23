
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  FolderKanban,
  Monitor,
  Globe,
  Activity,
  AlertTriangle,
  PauseCircle,
  Clock,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import type {
  Project,
  ProjectMonitor,
  ProjectDetailsResponse,
} from "@/types/project";

interface ProjectStats {
  total: number;
  operational: number;
  down: number;
  paused: number;
}

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [monitors, setMonitors] = useState<ProjectMonitor[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    operational: 0,
    down: 0,
    paused: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch project details
  const fetchProjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/projects/${projectId}`, {
        cache: "no-store",
      });

      const result: ProjectDetailsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load project");
      }

      setProject(result.data.project);
      setMonitors(result.data.monitors);
      setStats(result.data.stats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Delete project
  async function handleDeleteProject() {
    try {
      setDeleting(true);
      setDeleteError("");

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete project");
      }

      setShowDeleteConfirm(false);

      router.push("/projects");
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setDeleting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <Loader2 size={22} className="animate-spin" />
        Loading project details...
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertTriangle
          className="mx-auto mb-3 text-red-500"
          size={30}
        />

        <h2 className="font-semibold text-slate-900">
          Unable to load project
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error || "Project not found"}
        </p>

        <button
          onClick={() => void fetchProjectDetails()}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold !text-white hover:bg-blue-700"
        >
          Try again
        </button>

        <div>
          <Link
            href="/projects"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Statistics cards
  const statCards = [
    {
      title: "Total Monitors",
      value: stats.total,
      icon: Monitor,
      color: "text-blue-600",
      background: "bg-blue-50",
    },
    {
      title: "Operational",
      value: stats.operational,
      icon: Activity,
      color: "text-emerald-600",
      background: "bg-emerald-50",
    },
    {
      title: "Down",
      value: stats.down,
      icon: AlertTriangle,
      color: "text-red-600",
      background: "bg-red-50",
    },
    {
      title: "Paused",
      value: stats.paused,
      icon: PauseCircle,
      color: "text-amber-600",
      background: "bg-amber-50",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Projects
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FolderKanban size={27} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold text-slate-900">
                {project.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {project.slug}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void fetchProjectDetails()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <Link
              href={`/projects/${project._id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
            >
              <Pencil size={16} />
              Edit Project
            </Link>

            <button
              onClick={() => {
                setDeleteError("");
                setShowDeleteConfirm(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete Project
            </button>
          </div>
        </div>
      </div>

      {/* Project Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">
            Project Overview
          </h3>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              project.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {project.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          {project.description || "No project description available."}
        </p>

        <div className="mt-5 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>Project ID: {project._id}</span>

          <span>
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
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

      {/* Monitors */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold text-slate-900">
              Project Monitors
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              All websites and APIs associated with this project.
            </p>
          </div>

          <Link
            href={`/monitors/new?projectId=${project._id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
          >
            <Monitor size={16} />
            Add Monitor
          </Link>
        </div>

        {monitors.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="rounded-full bg-blue-50 p-4 text-blue-600">
              <Monitor size={28} />
            </div>

            <h4 className="mt-4 font-semibold text-slate-900">
              No monitors yet
            </h4>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Add your first website or API monitor to start tracking its uptime.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Monitor</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Interval</th>
                  <th className="px-5 py-4">Response Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {monitors.map((monitor) => (
                  <tr key={monitor._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Globe size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {monitor.name}
                          </p>

                          <p className="max-w-64 truncate text-xs text-slate-500">
                            {monitor.url}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 capitalize text-slate-600">
                      {monitor.type}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          monitor.status === "operational"
                            ? "bg-emerald-50 text-emerald-700"
                            : monitor.status === "down"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {monitor.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} />
                        {monitor.interval / 60} min
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {monitor.lastResponseTime !== null
                        ? `${monitor.lastResponseTime} ms`
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => {
            if (!deleting) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Trash2 size={24} />
              </div>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="delete-project-title"
              className="mt-5 text-xl font-bold text-slate-900"
            >
              Delete Project?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                {project.name}
              </span>
              ? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle size={18} className="shrink-0" />
                <p>{deleteError}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteProject}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Confirm Delete
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
