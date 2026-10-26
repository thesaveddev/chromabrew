"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";

type Suggestion = {
  name: string;
  description: string;
  primary: string;
  strategy: string;
};

const STRATEGY_LABELS: Record<string, string> = {
  complementary: "Complementary",
  analogous: "Analogous",
  triadic: "Triadic",
  "split-complementary": "Split-complementary",
  monochromatic: "Monochromatic",
};

function generatorHref(suggestion: Suggestion): string {
  const params = new URLSearchParams({
    primary: suggestion.primary.replace("#", ""),
    strategy: suggestion.strategy,
  });
  return `/design-system?${params.toString()}`;
}

export function AiPaletteTool() {
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!description.trim() || loading) return;
    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const res = await fetch("/api/ai/palette-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
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
  }, [description, loading]);

  return (
    <div className="space-y-5">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="flex-1">
          <label
            htmlFor="ai-palette-brief"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Describe your brand
          </label>
          <input
            id="ai-palette-brief"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='"A fitness app for runners" or "luxury coffee brand"'
            className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
        </div>
        <button
          type="submit"
          disabled={!description.trim() || loading}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 sm:mt-7 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Thinking
            </span>
          ) : (
            "Suggest palettes"
          )}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {suggestions.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {suggestions.map((s) => (
            <li
              key={s.name}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className="flex h-24 items-end justify-between p-3"
                style={{ backgroundColor: s.primary }}
              >
                <span className="rounded-md bg-black/30 px-2 py-0.5 font-mono text-xs uppercase text-white">
                  {s.primary}
                </span>
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  {STRATEGY_LABELS[s.strategy] ?? s.strategy}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {s.name}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {s.description}
                </p>
                <Link
                  href={generatorHref(s)}
                  className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Preview in generator
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Five suggestions appear here — each opens directly in the design
          system generator, where the strategy is pre-selected and every
          token, theme and export derives from that color.
        </p>
      )}
    </div>
  );
}
