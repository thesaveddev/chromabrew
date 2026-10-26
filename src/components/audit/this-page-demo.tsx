"use client";

import { useState } from "react";

/**
 * Live demo: runs the in-browser audit bundle against *this* documentation
 * page, so a reader can watch the overlay appear before trusting it on a
 * page that matters. Same file the bookmarklet loads, same code path.
 */
export function ThisPageDemo({ bundleUrl }: { bundleUrl: string }) {
  const [started, setStarted] = useState(false);

  const run = () => {
    if (document.getElementById("chromabrew-audit-overlay")) return;
    const script = document.createElement("script");
    script.src = bundleUrl;
    document.documentElement.appendChild(script);
    setStarted(true);
  };

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={started}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {started ? "Audit running — look for the panel" : "Try it on this page"}
      </button>
      {started ? (
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
          The report panel should have appeared at the top-right of this page.
          Close it and run it again any time.
        </p>
      ) : null}
    </div>
  );
}
