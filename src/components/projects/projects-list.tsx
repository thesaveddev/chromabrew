"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ProjectSearch } from "@/components/projects/project-search";

type Project = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialProjects: Project[];
};

export function ProjectsList({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState(false);

  const handleResults = useCallback((results: Project[]) => {
    setProjects(results);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            My projects
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {loading
              ? "Searching…"
              : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link
          href="/design-system"
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          New project
        </Link>
      </div>

      <ProjectSearch onResults={handleResults} onLoading={setLoading} />

      {projects.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No projects found.
          </p>
          <Link
            href="/design-system"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 hover:no-underline dark:text-zinc-100"
          >
            Create your first design system →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="group block rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-4 dark:text-zinc-100">
                      {project.name}
                    </h2>
                    {project.description && (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {project.visibility}
                  </span>
                </div>
                <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
