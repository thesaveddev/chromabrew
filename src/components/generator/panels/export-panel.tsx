"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EXPORT_ADAPTERS } from "@/lib/design-system/exports/registry";
import { adapterRequiresPro } from "@/lib/entitlements";
import type { ExportAdapter } from "@/lib/design-system/exports/adapter";
import type { ExportContext } from "@/lib/design-system/exports/context";
import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";
import { CopyButton, DownloadButton } from "@/components/ui/primitives";
import type { DesignSystem } from "@/lib/design-system/types";

type AdapterGroup = { label: string; adapters: ExportAdapter[] };

const ADAPTER_GROUPS: AdapterGroup[] = [
  {
    label: "Web",
    adapters: EXPORT_ADAPTERS.filter((a) =>
      ["css", "json", "tailwind", "bootstrap", "shadcn", "mui", "antd", "chakra"].includes(a.id),
    ),
  },
  {
    label: "Mobile / Desktop",
    adapters: EXPORT_ADAPTERS.filter((a) =>
      ["react-native", "flutter", "ios-swift", "android"].includes(a.id),
    ),
  },
  {
    label: "Design Tools",
    adapters: EXPORT_ADAPTERS.filter((a) =>
      ["figma", "w3c", "penpot", "zip"].includes(a.id),
    ),
  },
];

const ALL_ADAPTERS = ADAPTER_GROUPS.flatMap((g) => g.adapters);

const ADAPTER_EVENT: Record<string, AnalyticsEvent> = {
  css: "css_exported",
  json: "json_exported",
  tailwind: "tailwind_exported",
  shadcn: "shadcn_exported",
  bootstrap: "bootstrap_exported",
  mui: "mui_exported",
  antd: "antd_exported",
  chakra: "chakra_exported",
  figma: "figma_exported",
  w3c: "w3c_exported",
  penpot: "penpot_exported",
  zip: "design_system_zip_exported",
  "react-native": "react_native_exported",
  flutter: "flutter_exported",
  "ios-swift": "ios_exported",
  android: "android_exported",
};

export function ExportPanel({
  system,
  projectName,
}: {
  system: DesignSystem;
  /** Saved project name, when the generator has one loaded — prefilled, editable. */
  projectName?: string;
}) {
  const [adapterId, setAdapterId] = useState(ALL_ADAPTERS[0].id);
  // Client-ready packaging. Prefilled from the saved project when there is
  // one, but always editable: the deliverable is named for what the reader
  // types, not for what the tool guessed.
  // Signed-out visitors read as free; the plan only ever locks chrome —
  // generation itself stays client-side and ungated until a server export
  // API exists to enforce against.
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/billing/plan")
      .then((res) => (res.ok ? res.json() : { plan: "free" as const }))
      .then((data) => {
        if (live) setIsPro(data.plan === "pro");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const [packProject, setPackProject] = useState(projectName ?? "");
  const [packClient, setPackClient] = useState("");
  const [packVersion, setPackVersion] = useState("v1");
  // The saved name arrives after the project fetch; adopt it only while the
  // reader has not typed their own, so a late fetch never clobbers input.
  useEffect(() => {
    if (projectName) setPackProject((prev) => prev || projectName);
  }, [projectName]);
  const packContext = useMemo<ExportContext>(
    () => ({
      projectName: packProject.trim() || undefined,
      clientName: packClient.trim() || undefined,
      versionLabel: packVersion.trim() || undefined,
    }),
    [packProject, packClient, packVersion],
  );
  const adapter = ALL_ADAPTERS.find((a) => a.id === adapterId) ?? ALL_ADAPTERS[0];
  const result = useMemo(
    () => adapter.generate(system, packContext),
    [adapter, system, packContext],
  );
  const locked = !isPro && adapterRequiresPro(adapter.id);

  return (
    <section aria-labelledby="export-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="export-heading" className="panel-title">
          Export
        </h2>
        <div className="flex items-center gap-2">
          {!locked && !result.binary && (
            <CopyButton
              value={result.code}
              label={`Copy ${adapter.name}`}
              onCopied={() => {
                track(ADAPTER_EVENT[adapter.id]);
                track("code_copied_or_exported", { adapter: adapter.id });
              }}
              className="px-2.5 py-1 text-xs"
            />
          )}
          {!locked && (
            <DownloadButton
              filename={result.suggestedFilename}
              content={result.code}
              binary={result.binary}
              mimeType={result.mimeType ?? "text/plain;charset=utf-8"}
              className="px-2.5 py-1 text-xs"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        {ADAPTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {group.adapters.map((a) => {
                const pro = adapterRequiresPro(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAdapterId(a.id)}
                    aria-label={pro && !isPro ? `${a.name} (Pro)` : a.name}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      adapterId === a.id
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                    }`}
                  >
                    {pro && !isPro ? `🔒 ${a.name}` : a.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">{adapter.description}</p>

      {adapter.id === "zip" && !locked && (
        <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Client-ready packaging
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Project name
              </span>
              <input
                type="text"
                value={packProject}
                onChange={(e) => setPackProject(e.target.value)}
                placeholder="Acme Dashboard"
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Prepared for
              </span>
              <input
                type="text"
                value={packClient}
                onChange={(e) => setPackClient(e.target.value)}
                placeholder="Acme Inc (optional)"
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Version
              </span>
              <input
                type="text"
                value={packVersion}
                onChange={(e) => setPackVersion(e.target.value)}
                placeholder="v1"
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-zinc-500 dark:text-zinc-500">
            Names every file for the project, stamps each header with the version
            {packClient.trim() ? " and client" : ""}, and adds a README
            presenting the bundle.
          </p>
        </fieldset>
      )}

      {locked ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {adapter.name} export is a Pro feature
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Upgrade for {adapter.name} plus every other adapter, unlimited
            projects, and unlimited history.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            See Pro plans
          </Link>
        </div>
      ) : result.binary ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800/40">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <span className="font-medium">{adapter.name}</span> — one download
            containing every format, ready to share with your team.
          </p>
          <DownloadButton
            filename={result.suggestedFilename}
            content={result.code}
            binary
            mimeType="application/zip"
            className="shrink-0 px-3 py-1.5 text-xs"
            label="Download .zip"
          />
        </div>
      ) : (
        <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-4 text-[11px] leading-5 text-zinc-100">
          <code>{result.code}</code>
        </pre>
      )}
    </section>
  );
}
