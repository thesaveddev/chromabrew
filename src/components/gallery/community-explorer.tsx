"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PALETTE_STRATEGIES } from "@/lib/design-system/palette/generate";
import {
  filterCommunityEntries,
  type CommunityEntry,
} from "@/lib/gallery";
import { VoteButton } from "./vote-button";

function strategyLabel(id: string): string {
  return PALETTE_STRATEGIES.find((s) => s.id === id)?.label ?? id;
}

export function CommunityExplorer({
  entries,
  votedIds = [],
}: {
  entries: CommunityEntry[];
  /** Entry ids the current reader already up-voted, for first-paint state. */
  votedIds?: string[];
}) {
  const voted = new Set(votedIds);
  const [query, setQuery] = useState("");
  const [strategy, setStrategy] = useState("all");

  const strategies = useMemo(() => {
    const seen = new Set<string>();
    for (const entry of entries) {
      if (entry.strategy) seen.add(entry.strategy);
    }
    return [...seen].sort();
  }, [entries]);

  const results = useMemo(
    () => filterCommunityEntries(entries, { query, strategy }),
    [entries, query, strategy],
  );

  const filtering = query.trim() !== "" || strategy !== "all";

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="gallery-search" className="sr-only">
          Search community palettes
        </label>
        <input
          id="gallery-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, author, or hex — try “ocean” or “4cc9f0”…"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>

      {strategies.length > 0 && (
        <div
          className="mt-3 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by harmony"
        >
          {["all", ...strategies].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStrategy(id)}
              aria-pressed={strategy === id}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                strategy === id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {id === "all" ? "All harmonies" : strategyLabel(id)}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400" role="status">
        {filtering
          ? `${results.length} of ${entries.length} palettes match.`
          : `${entries.length} community ${entries.length === 1 ? "palette" : "palettes"} — search or pick a harmony to narrow it down.`}
      </p>

      {results.length > 0 ? (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((entry) => (
            <li key={entry.id}>
              {/* The indexable entry page, not the share view: this card is
                  the internal path crawlers follow to the community catalog. */}
              <Link
                href={`/gallery/${entry.id}`}
                className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <span className="flex h-24" aria-hidden="true">
                  {entry.colors.map((hex) => (
                    <span
                      key={hex}
                      className="h-full flex-1"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span className="block px-4 py-3">
                  <span className="block truncate text-sm font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                    {entry.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                    by {entry.author}
                    {entry.strategy ? ` · ${strategyLabel(entry.strategy)}` : ""}
                  </span>
                </span>
              </Link>
              <div className="mt-2 flex items-center gap-2 px-1">
                <VoteButton
                  projectId={entry.id}
                  initialVotes={entry.votes}
                  initialVoted={voted.has(entry.id)}
                  compact
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No palettes match{query.trim() ? ` “${query.trim()}”` : " these filters"}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStrategy("all");
            }}
            className="mt-3 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
          >
            Clear search and filters
          </button>
        </div>
      )}
    </div>
  );
}
