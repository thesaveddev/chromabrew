"use client";

import { useMemo, useState } from "react";
import { generateScale } from "@/lib/design-system/colour/scale";
import { buildDesignSystem } from "@/lib/design-system";
import {
  shadcnAdapter,
  jsonAdapter,
} from "@/lib/design-system/exports/registry";
import { DEFAULT_CONFIG } from "@/lib/design-system/share";
import { CopyButton } from "@/components/ui/primitives";
import { SingleColourForm } from "./shared-tool-ui";

function CodeResult({ code, filename }: { code: string; filename: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">{filename}</p>
        <CopyButton value={code} label="Copy code" className="px-2.5 py-1 text-xs" />
      </div>
      <pre className="max-h-96 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-4 text-[11px] leading-5 text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Tailwind colour generator: scale + @theme output for one colour. */
export function TailwindColourTool({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [primary, setPrimary] = useState(initial);
  const scale = useMemo(() => generateScale(primary), [primary]);

  const code = useMemo(() => {
    const vars = scale
      .map((s) => `  --color-brand-${s.step}: ${s.hex};`)
      .join("\n");
    return `@theme {\n${vars}\n}\n`;
  }, [scale]);

  return (
    <div className="space-y-5">
      <SingleColourForm
        id="tailwind-tool-colour"
        raw={raw}
        onRawChange={setRaw}
        primary={primary}
        onPrimaryChange={setPrimary}
        submitLabel="Generate Tailwind colours"
      />
      <div className="flex flex-wrap gap-1.5">
        {scale.map((step) => (
          <span
            key={step.step}
            title={`${step.step}: ${step.hex}`}
            aria-hidden
            className="h-8 w-8 rounded"
            style={{ backgroundColor: step.hex }}
          />
        ))}
      </div>
      <CodeResult code={code} filename="tailwind-brand.css" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Need semantic tokens too?{" "}
        <a href={`/design-system?primary=${primary.replace("#", "")}`} className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
          Open the full generator
        </a>{" "}
        for background/primary/status roles and dark mode.
      </p>
    </div>
  );
}

/** shadcn/ui theme generator: current-convention oklch variables. */
export function ShadcnThemeTool({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [primary, setPrimary] = useState(initial);
  const system = useMemo(
    () =>
      buildDesignSystem({
        ...DEFAULT_CONFIG,
        primary,
      }),
    [primary],
  );

  return (
    <div className="space-y-5">
      <SingleColourForm
        id="shadcn-tool-colour"
        raw={raw}
        onRawChange={setRaw}
        primary={primary}
        onPrimaryChange={setPrimary}
        submitLabel="Generate shadcn theme"
      />
      <CodeResult
        code={shadcnAdapter.generate(system).code}
        filename={shadcnAdapter.generate(system).suggestedFilename}
      />
    </div>
  );
}

/** Dark mode generator: dark-theme token table + CSS. */
export function DarkModeTool({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [primary, setPrimary] = useState(initial);
  const system = useMemo(
    () =>
      buildDesignSystem({
        ...DEFAULT_CONFIG,
        primary,
      }),
    [primary],
  );

  const css = useMemo(() => {
    const lines = Object.entries(system.themes.dark).map(([k, v]) => `  --${k}: ${v};`);
    return `.dark {\n${lines.join("\n")}\n}\n`;
  }, [system]);

  return (
    <div className="space-y-5">
      <SingleColourForm
        id="dark-tool-colour"
        raw={raw}
        onRawChange={setRaw}
        primary={primary}
        onPrimaryChange={setPrimary}
        submitLabel="Generate dark theme"
      />
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Values below are constructed for dark surfaces â€” lighter primaries and
        tinted neutrals with verified contrast â€” not an inversion of a light
        theme.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(system.themes.dark).map(([token, hex]) => (
          <div key={token} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-2">
            <span
              aria-hidden
              className="h-6 w-6 shrink-0 rounded border border-zinc-300 dark:border-zinc-700"
              style={{ backgroundColor: hex }}
            />
            <span className="min-w-0">
              <code className="block truncate font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{hex}</code>
              <span className="block truncate text-[10px] text-zinc-400">--{token}</span>
            </span>
          </div>
        ))}
      </div>
      <CodeResult code={css} filename="dark-theme.css" />
    </div>
  );
}

/** Design token generator: DTCG-style JSON output. */
export function DesignTokenTool({ initial = "#47003a" }: { initial?: string }) {
  const [raw, setRaw] = useState(initial);
  const [primary, setPrimary] = useState(initial);
  const system = useMemo(
    () =>
      buildDesignSystem({
        ...DEFAULT_CONFIG,
        primary,
        paletteStrategy: "analogous",
      }),
    [primary],
  );

  return (
    <div className="space-y-5">
      <SingleColourForm
        id="tokens-tool-colour"
        raw={raw}
        onRawChange={setRaw}
        primary={primary}
        onPrimaryChange={setPrimary}
        submitLabel="Generate tokens"
      />
      <CodeResult
        code={jsonAdapter.generate(system).code}
        filename={jsonAdapter.generate(system).suggestedFilename}
      />
    </div>
  );
}
