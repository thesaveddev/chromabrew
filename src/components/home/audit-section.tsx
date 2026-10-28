"use client";

import Image from "next/image";
import Link from "next/link";

import { LinkButton } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";

const INLINE_LINK =
  "underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";

/**
 * The website audit's home-page proof: real capture, five honest steps,
 * fix-it links. Rendered to static markup in a test so a reworded sentence
 * that outruns what the engine does fails there rather than shipping.
 * The image is a real capture of a real run; `scripts/capture-audit-report.mjs`
 * records how it was taken and how to retake it.
 */
export function AuditSection() {
  return (
    <section
      aria-labelledby="audit-heading"
      className="border-y border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Free website audit
          </p>
          <h2
            id="audit-heading"
            className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
          >
            Audit a live website. Find what needs improving.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Paste a public URL. ChromaBrew renders the page, measures
            contrast from computed styles, and runs axe-core 4.13 plus
            structural checks — every finding ships with its selector and a
            fix you can apply. Nothing is changed on your site, and a clean
            report is not a conformance certificate.
          </p>
        </div>

        <ol className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Enter a public website URL", "Paste any public page — no account, nothing to install."],
            ["Scan and inspect the rendered page", "Headless Chromium at desktop (1280×720) or mobile (390×844), screenshot included."],
            ["Review measured findings", "Contrast from computed styles, axe-core 4.13 plus ten structural rules — selector and values attached."],
            ["Inspect recommended improvements", "Where a fix exists, it is shown next to the failing values it replaces — CSS or token guidance you apply."],
            ["Re-scan to validate fixes", "Re-run the audit on the updated page to confirm the finding clears."],
          ].map(([title, body], i) => (
            <li key={title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Step {i + 1}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {body}
              </p>
            </li>
          ))}
        </ol>

        <figure className="mt-10">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800">
            <Image
              src="/audit-media/audit-report.png"
              alt="A real audit report: the scanned design-system page, the 1280×720 viewport screenshot the scanner captured, and a findings summary reading 2 critical, 7 high, 1 low and 1 informational issue."
              width={1152}
              height={1119}
              sizes="(min-width: 1280px) 1024px, 100vw"
              loading="lazy"
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mt-3 max-w-3xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            A real report, not a mockup: this site&apos;s own design-system generator page, rendered
            at 1280×720. The run found 11 issues — 2 of them rated critical — grouped one duplicate
            report, and proposed a fix for 9 of them, each recalculated against the measured ratio
            before it was shown.
          </figcaption>
        </figure>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <LinkButton
            href="/audit"
            onClick={() => track("hero_audit_clicked", { location: "audit-section" })}
          >
            Explore Website Audit
          </LinkButton>
          <Link
            href="/tools/contrast-checker"
            className="text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
          >
            or check one colour pair first
          </Link>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Fix what it finds with the tools you already have here: grade two colours in the{" "}
          <Link href="/tools/contrast-checker" className={INLINE_LINK}>
            contrast checker
          </Link>
          , grade a whole palette at once in the{" "}
          <Link href="/tools/wcag-palette-checker" className={INLINE_LINK}>
            WCAG palette checker
          </Link>
          , rebuild a failing scale in the{" "}
          <Link href="/tools/shade-generator" className={INLINE_LINK}>
            shade generator
          </Link>
          , or generate an accessible dark theme with the{" "}
          <Link href="/tools/dark-mode-generator" className={INLINE_LINK}>
            dark mode generator
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
