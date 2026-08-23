"use client";

import { useMemo, useState } from "react";
import {
  cssAdapter,
  jsonAdapter,
  tailwindAdapter,
  shadcnAdapter,
} from "@/lib/design-system/exports/registry";
import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";
import { CopyButton, DownloadButton, TabList } from "@/components/ui/primitives";
import type { DesignSystem } from "@/lib/design-system/types";

const ADAPTERS = [cssAdapter, jsonAdapter, tailwindAdapter, shadcnAdapter];

const ADAPTER_EVENT: Record<string, AnalyticsEvent> = {
  css: "css_exported",
  json: "json_exported",
  tailwind: "tailwind_exported",
  shadcn: "shadcn_exported",
};

const EXPORT_EVENT = ADAPTER_EVENT;

export function ExportPanel({ system }: { system: DesignSystem }) {
  const [adapterId, setAdapterId] = useState(ADAPTERS[0].id);
  const adapter = ADAPTERS.find((a) => a.id === adapterId) ?? ADAPTERS[0];
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
            onCopied={() => track(EXPORT_EVENT[adapter.id])}
            className="px-2.5 py-1 text-xs"
          />
          <DownloadButton
            filename={result.suggestedFilename}
            content={result.code}
            className="px-2.5 py-1 text-xs"
          />
        </div>
      </div>

      <TabList
        label="Export format"
        size="sm"
        options={ADAPTERS.map((a) => ({ id: a.id, label: a.name }))}
        value={adapterId}
        onChange={(id) => {
          setAdapterId(id);
          track(EXPORT_EVENT[id]);
        }}
      />
      <p className="text-xs text-zinc-500">{adapter.description}</p>

      <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-[11px] leading-5 text-zinc-100">
        <code>{result.code}</code>
      </pre>
    </section>
  );
}
