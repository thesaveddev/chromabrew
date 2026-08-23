"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | "public";
};

type Props = {
  project: Project;
  onUpdate?: (project: Project) => void;
};

export function ProjectSettings({ project, onUpdate }: Props) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [visibility, setVisibility] = useState(project.visibility);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || project.name,
          description: description.trim() || null,
          visibility,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate?.({
          id: updated.id,
          name: updated.name,
          description: updated.description,
          visibility: updated.visibility,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/projects");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Project settings
      </h3>

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="project-name"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
        </div>

        <div>
          <label
            htmlFor="project-desc"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Description
          </label>
          <textarea
            id="project-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Visibility
          </label>
          <div className="mt-1 flex gap-3">
            {(["private", "public"] as const).map((v) => (
              <label
                key={v}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  visibility === v
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                  className="sr-only"
                />
                {v}
              </label>
            ))}
          </div>
          {visibility === "public" && (
            <p className="mt-1.5 text-[11px] text-zinc-400">
              Anyone with the link can view this project.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (name === project.name && description === (project.description ?? "") && visibility === project.visibility)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <h4 className="text-xs font-medium text-red-600 dark:text-red-400">
          Danger zone
        </h4>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete project
          </button>
        ) : (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <p className="text-sm text-red-700 dark:text-red-300">
              This will permanently delete &ldquo;{project.name}&rdquo; and all
              its versions. This action cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
