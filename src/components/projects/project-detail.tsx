"use client";

import { useState } from "react";
import { VersionsPanel } from "./versions-panel";
import { ProjectSettings } from "./project-settings";
import { ShareButton } from "./share-button";

type Project = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
};

type Props = {
  project: Project;
};

export function ProjectDetail({ project: initial }: Props) {
  const [project, setProject] = useState(initial);
  const [tab, setTab] = useState<"versions" | "settings">("versions");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {project.name}
        </h1>
        {project.description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {project.description}
          </p>
        )}
        <div className="mt-3">
          <ShareButton
            projectId={project.id}
            visibility={project.visibility}
          />
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {(["versions", "settings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            }`}
          >
            {t === "versions" ? "Version history" : "Settings"}
          </button>
        ))}
      </div>

      {tab === "versions" ? (
        <VersionsPanel
          projectId={project.id}
          isOwner={true}
          onRestore={(config) => {
            // Config was restored — could navigate to generator or refresh
            void config;
          }}
        />
      ) : (
        <ProjectSettings
          project={project}
          onUpdate={(updated) =>
            setProject((prev) => ({ ...prev, ...updated }))
          }
        />
      )}
    </div>
  );
}
