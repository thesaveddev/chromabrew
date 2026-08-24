"use client";

import type { HistoryEntry } from "../use-palette-history";

/** Strip of recent generations — click to restore a full config. */
export function HistoryPanel({
  history,
  onRestore,
  onClear,
}: {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}) {
  if (history.length === 0) return null;

  return (
    <section aria-labelledby="history-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="history-heading" className="panel-title">
          Recent palettes
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Clear
        </button>
      </div>
      <ul className="space-y-1.5">
        {history.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onRestore(entry)}
              title={`Restore palette from ${new Date(entry.ts).toLocaleTimeString()}`}
              className="group flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 px-2.5 py-2 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
            >
              <span className="flex -space-x-0.5" aria-hidden>
                {(
                  [
                    entry.config.primary,
                    entry.config.secondary,
                    entry.config.accent,
                  ] as const
                ).map((hex, i) => (
                  <span
                    key={i}
                    className="h-4 w-4 rounded-full ring-1 ring-white dark:ring-zinc-900"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </span>
              <span className="font-mono text-[11px] uppercase text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                {entry.config.primary}
              </span>
              <span className="ml-auto truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                {entry.config.paletteStrategy}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
