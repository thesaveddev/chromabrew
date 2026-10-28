"use client";

export interface DiscoveredPageChoice {
  url: string;
  /** Visible link text; empty when the anchor had none. */
  text: string;
  checked: boolean;
}

export type DiscoveryState = "idle" | "loading" | "ready";

interface DiscoveredPagesPickerProps {
  state: DiscoveryState;
  pages: DiscoveredPageChoice[];
  error: string;
  canBrowse: boolean;
  onBrowse: () => void;
  onToggle: (url: string) => void;
  onSelectAll: (select: boolean) => void;
  onAdd: () => void;
}

/**
 * The selected-pages picker's checklist: browse the address's own links,
 * tick the pages to audit, add them to the list. Presentational — the form
 * owns the data and the fetching, this only renders the four states (idle,
 * loading, empty, list) plus errors.
 */
export function DiscoveredPagesPicker({
  state,
  pages,
  error,
  canBrowse,
  onBrowse,
  onToggle,
  onSelectAll,
  onAdd,
}: DiscoveredPagesPickerProps) {
  const checkedCount = pages.filter((page) => page.checked).length;
  const allChecked = pages.length > 0 && checkedCount === pages.length;

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBrowse}
          disabled={!canBrowse || state === "loading"}
          className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-800 transition-colors hover:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-500"
        >
          {state === "loading" ? "Reading pages…" : "Browse this site's pages"}
        </button>
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">
          Lists the pages a crawl would visit from the address above — tick the
          ones to audit instead of typing them.
        </p>
      </div>

      {state === "loading" ? (
        <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Reading the page&apos;s links…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {state === "ready" && !error ? (
        pages.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No followable pages found on that address — it may render its links
            with JavaScript or block the scanner. Type page addresses manually
            instead.
          </p>
        ) : (
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectAll(!allChecked)}
                className="text-xs font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                {allChecked ? "Clear all" : "Select all"}
              </button>
              <p className="text-xs text-zinc-500 dark:text-zinc-500" role="status">
                {checkedCount} of {pages.length} selected
              </p>
            </div>
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1">
              {pages.map((page) => (
                <li key={page.url}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/70">
                    <input
                      type="checkbox"
                      checked={page.checked}
                      onChange={() => onToggle(page.url)}
                      className="mt-1 h-3.5 w-3.5 shrink-0 accent-zinc-900 dark:accent-zinc-100"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {page.text || page.url}
                      </span>
                      {page.text ? (
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-500">
                          {page.url}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onAdd}
              disabled={checkedCount === 0}
              className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Add {checkedCount} selected {checkedCount === 1 ? "page" : "pages"}
            </button>
          </div>
        )
      ) : null}

      {/* Fetch-only discovery cannot see JavaScript-rendered links, so a short
          list is a limitation of the reader — never evidence the site has no
          more pages. Stated here rather than only in the empty state. */}
      {state === "ready" && !error && pages.length > 0 ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
          Only links present in the served HTML are listed; pages built entirely
          by JavaScript won&apos;t appear — type those manually.
        </p>
      ) : null}
    </div>
  );
}
