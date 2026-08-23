"use client";

import { useState, useCallback } from "react";
import { track } from "@/lib/analytics";

type Suggestion = {
  name: string;
  description: string;
  primary: string;
  strategy: string;
};

type Props = {
  onApply: (hex: string) => void;
};

export function AiPaletteSuggestion({ onApply }: Props) {
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
    <section aria-labelledby="ai-heading" className="space-y-3">
      <div>
        <h2 id="ai-heading" className="panel-title">
          {"AI Palette Suggestion"}
        </h2>
        <p className="text-xs text-zinc-500">
          Describe your brand and get 5 smart palette options
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder='"A fitness app for runners" or "luxury coffee brand"'
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!description.trim() || loading}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Thinking
            </span>
          ) : (
            "Suggest"
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => onApply(s.primary)}
              className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-500"
            >
              <div
                className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700"
                style={{ backgroundColor: s.primary }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {s.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.description}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-700 dark:text-zinc-400 dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900">
                Use
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
