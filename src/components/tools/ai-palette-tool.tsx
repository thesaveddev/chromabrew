"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { generatePalette } from "@/lib/design-system/palette/generate";
import type { PaletteStrategyId } from "@/lib/design-system/types";

type Suggestion = {
  name: string;
  description: string;
  primary: string;
  strategy: string;
  rationale: string;
  matchedKeywords: string[];
};

const STRATEGY_LABELS: Record<string, string> = {
  complementary: "Complementary",
  analogous: "Analogous",
  triadic: "Triadic",
  "split-complementary": "Split-complementary",
  monochromatic: "Monochromatic",
};

const EXAMPLE_BRIEFS = [
  "A fitness app for runners",
  "Luxury coffee brand",
  "Calm fintech dashboard",
  "Playful kids learning app",
];

function generatorHref(suggestion: Suggestion): string {
  const params = new URLSearchParams({
    primary: suggestion.primary.replace("#", ""),
    strategy: suggestion.strategy,
  });
  return `/design-system?${params.toString()}`;
}

function SuggestionCard({ suggestion: s }: { suggestion: Suggestion }) {
  const palette = useMemo(
    () => generatePalette(s.primary, s.strategy as PaletteStrategyId),
    [s.primary, s.strategy],
  );
  return (
    <li className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {/* Full derived palette, not just the seed: the exact swatches the
          generator will build from this primary + strategy. */}
      <div className="flex h-28" aria-label={`${s.name} palette preview`}>
        {palette.map((swatch) => (
          <div
            key={swatch.index}
            className="flex min-w-0 flex-1 items-end justify-center p-1.5"
            style={{ backgroundColor: swatch.hex }}
            title={`${swatch.role}: ${swatch.hex}`}
          >
            <span className="truncate rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[10px] uppercase text-white opacity-0 transition-opacity group-hover:opacity-100">
              {swatch.hex}
            </span>
          </div>
        ))}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {s.name}
          </p>
          <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {STRATEGY_LABELS[s.strategy] ?? s.strategy}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {s.description}
        </p>
        <div className="mt-3 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-3 dark:from-violet-950/60 dark:to-fuchsia-950/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            Why this works
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
            {s.rationale}
          </p>
          {s.matchedKeywords.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1.5">
              {s.matchedKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-violet-200 bg-white px-2 py-0.5 font-mono text-[11px] text-violet-800 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-200"
                >
                  “{keyword}”
                </span>
              ))}
            </p>
          )}
        </div>
        <Link
          href={generatorHref(s)}
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-md"
        >
          Preview in generator →
        </Link>
      </div>
    </li>
  );
}

export function AiPaletteTool() {
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (brief: string = description) => {
      if (!brief.trim() || loading) return;
      setLoading(true);
      setError("");
      setSuggestions([]);

      try {
        const res = await fetch("/api/ai/palette-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: brief.trim() }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Something went wrong");
          return;
        }

        const data = await res.json();
        setSuggestions(data.suggestions);
        track("ai_palette_suggested");
      } catch {
        setError("Network error — try again");
      } finally {
        setLoading(false);
      }
    },
    [description, loading],
  );

  return (
    <div className="space-y-6">
      {/* Gradient entry panel — the page's moment of color. */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 p-6 shadow-lg sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
          Palette ideas · Free, no sign-up
        </p>
        <h2 className="mt-2 max-w-xl text-xl font-bold tracking-tight text-white sm:text-2xl">
          Describe the vibe. Get five palettes.
        </h2>
        <form
          className="mt-4 flex flex-col gap-2.5 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <label htmlFor="ai-palette-brief" className="sr-only">
            Describe your brand
          </label>
          <input
            id="ai-palette-brief"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A fitness app for runners…"
            className="h-12 flex-1 rounded-xl border-0 bg-white/95 px-4 text-sm text-zinc-900 shadow-inner placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            disabled={!description.trim() || loading}
            className="h-12 shrink-0 rounded-xl bg-zinc-950 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Thinking…
              </span>
            ) : (
              "Suggest palettes"
            )}
          </button>
        </form>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/85">
          <span className="font-medium">Try:</span>
          {EXAMPLE_BRIEFS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setDescription(example);
                void handleSubmit(example);
              }}
              className="rounded-full border border-white/40 bg-white/15 px-3 py-1.5 font-medium text-white backdrop-blur transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {example}
            </button>
          ))}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {loading && (
        <ul aria-hidden className="grid animate-pulse gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex h-28">
                {["#e9d5ff", "#f5d0fe", "#fed7aa", "#fecdd3", "#ddd6fe"].map(
                  (hex) => (
                    <span
                      key={hex}
                      className="flex-1"
                      style={{ backgroundColor: hex }}
                    />
                  ),
                )}
              </div>
              <div className="space-y-2 p-5">
                <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2">
          {suggestions.map((s) => (
            <SuggestionCard key={s.name} suggestion={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
