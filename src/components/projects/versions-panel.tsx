"use client";

import { useState, useEffect, useCallback } from "react";

type Version = {
  id: string;
  label: string | null;
  config: unknown;
  createdAt: string;
};

type Props = {
  projectId: string;
  isOwner: boolean;
  onRestore?: (config: unknown) => void;
};

export function VersionsPanel({ projectId, isOwner, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/versions`);
    if (res.ok) {
      setVersions(await res.json());
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadVersions(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetching on mount
  }, [loadVersions]);

  const handleRestore = async (version: Version) => {
    if (!isOwner) return;
    setRestoring(version.id);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/versions/${version.id}`,
        { method: "PATCH" },
      );
      if (res.ok) {
        const data = await res.json();
        onRestore?.(data.config);
        await loadVersions();
      }
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!isOwner) return;
    const res = await fetch(
      `/api/projects/${projectId}/versions/${versionId}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs text-zinc-400">Loading versions…</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700">
        <p className="text-xs text-zinc-400">
          No versions saved yet. Save a snapshot from the generator toolbar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Version history
        </h3>
        <p className="text-[11px] text-zinc-400">
          {versions.length} snapshot{versions.length !== 1 ? "s" : ""}
        </p>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {versions.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                {v.label ?? "Untitled version"}
              </p>
              <p className="text-[11px] text-zinc-400">
                {new Date(v.createdAt).toLocaleString()}
              </p>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRestore(v)}
                  disabled={restoring === v.id}
                  className="rounded-md bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {restoring === v.id ? "…" : "Restore"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(v.id)}
                  className="rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
