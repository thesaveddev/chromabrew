"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SharedProject = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | "public";
  colors: [string, string, string, string, string] | null;
  updatedAt: string;
  ownerName: string | null;
  role: "viewer" | "editor";
};

/**
 * Projects other people shared with the signed-in user. Rendered below the
 * owned list by the projects page; fetches client-side so the owned list
 * keeps its server-rendered search behaviour untouched.
 */
export function SharedProjects() {
  const [projects, setProjects] = useState<SharedProject[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/projects?scope=shared")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (live) setProjects(data);
      })
      .catch(() => {
        if (live) setProjects([]);
      });
    return () => {
      live = false;
    };
  }, []);

  if (projects === null || projects.length === 0) return null;

  return (
    <section aria-labelledby="shared-heading" className="mt-10">
      <h2
        id="shared-heading"
        className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
      >
        Shared with me
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {projects.length} project{projects.length !== 1 ? "s" : ""} other people
        invited you to
      </p>
      <ul className="mt-4 space-y-3">
        {projects.map((project) => (
          <li
            key={project.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            {project.colors ? (
              <div className="flex h-12 gap-1" aria-hidden>
                {project.colors.map((hex) => (
                  <span
                    key={hex}
                    className="h-full flex-1 rounded-md"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-12 items-center justify-center rounded-md bg-zinc-100 text-[11px] text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                No palette preview
              </div>
            )}
            <div className="mt-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-semibold text-zinc-900 hover:underline hover:underline-offset-4 dark:text-zinc-100"
                >
                  {project.name}
                </Link>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Shared by {project.ownerName ?? "someone"}
                  {project.description ? ` · ${project.description}` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {project.role === "editor" ? "can edit" : "can view"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
