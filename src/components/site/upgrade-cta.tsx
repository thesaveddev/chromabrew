"use client";

import Link from "next/link";

/**
 * Inline upgrade prompt shown inside gated panels.
 * Purely visual — no auth or plan check required.
 */
export function UpgradeCta({
  feature,
  className,
}: {
  feature: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/40 ${className ?? ""}`}
    >
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {feature}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Available with Pro
      </p>
      <Link
        href="/pricing"
        className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        See plans
      </Link>
    </div>
  );
}

/**
 * Small inline badge + link for pro-locked adapter buttons.
 */
export function ProBadge() {
  return (
    <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
      Pro
    </span>
  );
}
