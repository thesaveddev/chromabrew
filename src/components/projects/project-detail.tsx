"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { VersionsPanel } from "./versions-panel";
import { ProjectSettings } from "./project-settings";
import { ShareButton } from "./share-button";
import { TeamPanel } from "./team-panel";
import type { ProjectAccess } from "@/lib/projects/access";

type Project = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | "public";
  listedInGallery: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  project: Project;
  /** The signed-in user's access level; settings stay owner-only. */
  access: ProjectAccess;
  userId: string;
};

type Tab = "versions" | "settings" | "team";

export function ProjectDetail({ project: initial, access, userId }: Props) {
  const [project, setProject] = useState(initial);
  const isOwner = access === "owner";
  const canEdit = access === "owner" || access === "editor";
  // Deep-links from the projects list (?tab=settings) land directly on
  // the tab holding visibility and the gallery opt-in — owners only, so a
  // member following such a link lands on versions instead of a 403 form.
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    requestedTab === "team"
      ? "team"
      : requestedTab === "settings" && isOwner
        ? "settings"
        : "versions",
  );

  const tabs: Tab[] = isOwner ? ["versions", "team", "settings"] : ["versions", "team"];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {project.name}
          </h1>
          {!isOwner && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              shared with you · {access}
            </span>
          )}
        </div>
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
        {tabs.map((t) => (
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
            {t === "versions" ? "Version history" : t === "team" ? "Team" : "Settings"}
          </button>
        ))}
      </div>

      {tab === "versions" ? (
        <VersionsPanel
          projectId={project.id}
          canEdit={canEdit}
          onRestore={(config) => {
            // Config was restored — could navigate to generator or refresh
            void config;
          }}
        />
      ) : tab === "team" ? (
        <TeamPanel
          projectId={project.id}
          projectName={project.name}
          userId={userId}
          isOwner={isOwner}
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
