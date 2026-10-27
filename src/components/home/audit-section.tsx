import Link from "next/link";

import { LinkButton } from "@/components/ui/primitives";

/**
 * The website audit's home-page section — deliberately quiet.
 *
 * The full story (rendered Chromium, measured contrast, axe-core rules,
 * limitations) lives on /audit. Here: what it is, what you get, one door in.
 * Rendered to static markup in a test so a reworded sentence that outruns
 * what the engine does fails there rather than shipping.
 */
export function AuditSection() {
  return (
    <section
      aria-labelledby="audit-heading"
      className="border-y border-zinc-200 bg-zinc-50 py-14 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Free website audit
          </p>
          <h2
            id="audit-heading"
            className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
          >
            Audit a live website. Find what needs improving.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Paste a public URL. ChromaBrew renders the page, measures
            contrast from computed styles, and runs axe-core 4.13 plus
            structural checks — every finding ships with its selector and a
            fix you can apply. Nothing is changed on your site.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <LinkButton href="/audit" variant="primary" className="w-full md:w-auto">
            Explore Website Audit
          </LinkButton>
          <Link
            href="/tools/contrast-checker"
            className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            or check one color pair first
          </Link>
        </div>
      </div>
    </section>
  );
}
