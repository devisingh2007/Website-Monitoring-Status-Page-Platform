
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";

import type { Project, ProjectsApiResponse } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/projects", {
        cache: "no-store",
      });

      const result: ProjectsApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Unable to fetch projects");
      }

      setProjects(result.data);
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
    void fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();

    return (
      project.name.toLowerCase().includes(query) ||
      project.slug.toLowerCase().includes(query) ||
      (project.description ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            WORKSPACE / PROJECTS
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Manage Projects
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Organize and manage your website and API monitoring projects.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold !text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Project
        </Link>
      </div>

      {/* Search and Project Count */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredProjects.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900">
            {projects.length}
          </span>{" "}
          projects
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={() => void fetchProjects()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-slate-500">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty State */
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-5 text-center">
          <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
            <FolderKanban size={30} />
          </div>

          <h3 className="text-lg font-semibold text-slate-900">
            {search ? "No projects found" : "No projects yet"}
          </h3>

          <p className="mt-2 max-w-sm text-sm text-slate-500">
            {search
              ? "Try another search term."
              : "Create your first project to start monitoring websites and APIs."}
          </p>

          {!search && (
            <Link
              href="/projects/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold !text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Create your first project
            </Link>
          )}
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article
              key={project._id}
              className="flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-lg bg-blue-50 p-3 text-blue-600">
                    <FolderKanban size={22} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">
                      {project.name}
                    </h3>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {project.slug}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    project.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {project.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Description */}
              <p className="mt-5 min-h-10 text-sm leading-5 text-slate-500">
                {project.description || "No description provided."}
              </p>

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">
                  Created{" "}
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>

                <Link
                  href={`/projects/${project._id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                >
                  View details
                  <ExternalLink size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
