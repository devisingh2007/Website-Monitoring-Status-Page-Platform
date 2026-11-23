
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  Loader2,
  Save,
} from "lucide-react";

export default function CreateProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create project");
      }

      router.push("/projects");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Projects
        </Link>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <FolderKanban size={25} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Create Project
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new project to your monitoring workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >

        {/* Project Name */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-slate-700"
          >
            Project Name <span className="text-red-500">*</span>
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. My Website Monitoring"
            minLength={2}
            maxLength={100}
            required
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="text-xs text-slate-400">
            Choose a recognizable name for your project.
          </p>
        </div>

        {/* Project Slug */}
        <div className="space-y-2">
          <label
            htmlFor="slug"
            className="block text-sm font-semibold text-slate-700"
          >
            Project Slug <span className="text-red-500">*</span>
          </label>

          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(generateSlug(e.target.value));
            }}
            placeholder="my-website-monitoring"
            required
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="text-xs text-slate-400">
            Automatically generated from project name. You can edit it.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-slate-700"
          >
            Description
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this project monitors..."
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="text-right text-xs text-slate-400">
            {description.length}/500 characters
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Link
            href="/projects"
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={17} />
                Create Project
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
