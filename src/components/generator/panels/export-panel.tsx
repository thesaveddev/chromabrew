"use client";

import { useMemo, useState } from "react";
import { EXPORT_ADAPTERS } from "@/lib/design-system/exports/registry";
import type { ExportAdapter } from "@/lib/design-system/exports/adapter";
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
    adapters: EXPORT_ADAPTERS.filter((a) => ["figma"].includes(a.id)),
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
  "react-native": "react_native_exported",
  flutter: "flutter_exported",
  "ios-swift": "ios_exported",
  android: "android_exported",
};

export function ExportPanel({ system }: { system: DesignSystem }) {
  const [adapterId, setAdapterId] = useState(ALL_ADAPTERS[0].id);
  const adapter = ALL_ADAPTERS.find((a) => a.id === adapterId) ?? ALL_ADAPTERS[0];
  const result = useMemo(() => adapter.generate(system), [adapter, system]);

  return (
    <section aria-labelledby="export-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="export-heading" className="panel-title">
          Export
        </h2>
        <div className="flex items-center gap-2">
          <CopyButton
            value={result.code}
            label={`Copy ${adapter.name}`}
            onCopied={() => track(ADAPTER_EVENT[adapter.id])}
            className="px-2.5 py-1 text-xs"
          />
          <DownloadButton
            filename={result.suggestedFilename}
            content={result.code}
            className="px-2.5 py-1 text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        {ADAPTER_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {group.adapters.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAdapterId(a.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    adapterId === a.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">{adapter.description}</p>

      <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-4 text-[11px] leading-5 text-zinc-100">
        <code>{result.code}</code>
      </pre>
    </section>
  );
}
