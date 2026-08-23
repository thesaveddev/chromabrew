"use client";

import { TOKEN_GROUPS } from "@/lib/design-system/exports/css";
import type { ThemeMode, ThemeTokens } from "@/lib/design-system/types";
import { CopyButton, copyToClipboard } from "@/components/ui/primitives";
import { useState } from "react";

const GROUP_TITLES: Record<string, string> = {
  Page: "Page",
  Surfaces: "Surfaces",
  "Primary & secondary": "Primary & secondary",
  Accent: "Accent",
  "Borders & inputs": "Borders & inputs",
  Status: "Status",
};

/** Semantic token table with side-by-side light/dark values. */
export function TokensPanel({
  themes,
}: {
  themes: Record<ThemeMode, ThemeTokens>;
}) {
  return (
    <section aria-labelledby="tokens-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="tokens-heading" className="panel-title">
          Semantic tokens
        </h2>
        <CopyButton
          value={cssSnippet(themes)}
          label="Copy CSS"
          className="px-2 py-1 text-xs"
        />
      </div>

      {TOKEN_GROUPS.map((group) => (
        <div key={group.title} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">{GROUP_TITLES[group.title]} tokens</caption>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[11px] uppercase tracking-wide text-zinc-500">
                <th scope="col" className="px-3 py-2 font-medium">Token</th>
                <th scope="col" className="px-3 py-2 font-medium">Light</th>
                <th scope="col" className="px-3 py-2 font-medium">Dark</th>
              </tr>
            </thead>
            <tbody>
              {group.tokens.map((id) => (
                <tr key={id} className="border-b border-zinc-100 dark:border-zinc-800/70 last:border-0">
                  <td className="px-3 py-1.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                    --{id}
                  </td>
                  <td className="px-3 py-1.5">
                    <TokenCell hex={themes.light[id as keyof ThemeTokens]} />
                  </td>
                  <td className="px-3 py-1.5">
                    <TokenCell hex={themes.dark[id as keyof ThemeTokens]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

function TokenCell({ hex }: { hex: string | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!hex) return null;
  return (
    <button
      type="button"
      onClick={() => {
        void copyToClipboard(hex.toUpperCase());
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      title={`Copy ${hex}`}
      className="flex w-full items-center gap-2 rounded-md p-0.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:bg-zinc-900/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
    >
      <span
        aria-hidden
        className="h-5 w-5 shrink-0 rounded border border-zinc-300 dark:border-zinc-700"
        style={{ backgroundColor: hex }}
      />
      <span className="font-mono text-[11px] uppercase text-zinc-700 dark:text-zinc-300">
        {copied ? "Copied" : hex}
      </span>
    </button>
  );
}

function cssSnippet(themes: Record<ThemeMode, ThemeTokens>): string {
  const block = (mode: ThemeMode, selector: string) => {
    const lines = Object.entries(themes[mode]).map(([k, v]) => `  --${k}: ${v};`);
    return `${selector} {\n${lines.join("\n")}\n}`;
  };
  return `${block("light", ":root")}\n\n${block("dark", ".dark")}\n`;
}
