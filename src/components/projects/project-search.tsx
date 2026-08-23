"use client";

import { useState, useCallback, useEffect } from "react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
};

type Props = {
  onResults: (projects: Project[]) => void;
  onLoading: (loading: boolean) => void;
};

const VISIBILITY_OPTIONS = [
  { value: "", label: "All" },
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
] as const;

export function ProjectSearch({ onResults, onLoading }: Props) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchProjects = useCallback(
    async (q: string, vis: string) => {
      onLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (vis) params.set("visibility", vis);

        const res = await fetch(`/api/projects?${params}`);
        if (res.ok) {
          onResults(await res.json());
        }
      } finally {
        onLoading(false);
      }
    },
    [onResults, onLoading],
  );

  useEffect(() => {
    void fetchProjects(debouncedQuery, visibility);
  }, [debouncedQuery, visibility, fetchProjects]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
        />
      </div>

      <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setVisibility(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              visibility === opt.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
