import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { UrlForm } from "@/components/audit/url-form";

export const metadata: Metadata = {
  // Bare title: the root layout's template appends " · ChromaBrew". Spelling the
  // brand here as well rendered it twice and in the wrong casing ("Chromabrew").
  // Bare title budget: ≤47 chars, so the layout's 13-char brand suffix keeps
  // the rendered title inside the ~60-character SERP truncation point.
  title: "Website Audit — WCAG & Contrast Scanner",
  description:
    "Free website audit: WCAG contrast failures, accessibility violations, metadata and heading problems — one page or up to five, with screenshots and re-measured fixes.",
  // Without this the page inherits the layout's canonical ("/") and tells search
  // engines it is a duplicate of the home page, which no sitemap entry can undo.
  alternates: { canonical: "/audit" },
  robots: { index: true },
};

/** Inline text link, matching the site chrome's focus treatment. */
const INLINE_LINK =
  "underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";

/** Tools that resolve what an audit reports, in the order findings arrive. */
const FIX_WITH = [
  {
    href: "/tools/contrast-checker",
    label: "WCAG contrast checker",
    blurb: "Grade any two colours and fix the pair in one step.",
  },
  {
    href: "/tools/wcag-palette-checker",
    label: "WCAG palette checker",
    blurb: "Grade every foreground/background pair in a palette at once.",
  },
  {
    href: "/tools/shade-generator",
    label: "Shade generator",
    blurb: "Rebuild a failing colour as a perceptually even 50–950 scale.",
  },
  {
    href: "/tools/dark-mode-generator",
    label: "Dark mode generator",
    blurb: "Generate a dark theme whose text pairs are checked, not inverted.",
  },
];

export default function AuditPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Free · no account
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
            Website audit
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Paste a public URL and get a measured report: the page rendered in a real browser, every
            run of text graded against the colour behind it, axe-core and ten structural rules, a
            screenshot of what the scanner saw, and a replacement it re-measured before offering it.
          </p>
        </header>

        <div className="mt-10">
          <UrlForm />
        </div>

        <figure className="mt-14">
          <figcaption className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            A real report, not a mockup
          </figcaption>
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800">
            <Image
              src="/audit-media/audit-report.png"
              alt="A real audit report: the scanned design-system page, the 1280×720 viewport screenshot the scanner captured, and a findings summary reading 2 critical, 7 high, 1 low and 1 informational issue."
              width={1152}
              height={1119}
              sizes="(min-width: 768px) 768px, 100vw"

              className="block h-auto w-full"
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            This site&apos;s own design-system generator page, rendered at 1280×720: 11 issues found,
            2 of them rated critical, one duplicate report grouped, and a fix proposed for 9 of them.
            Each finding below that summary carries its selector, the measured values, the WCAG
            criterion it touches and whether the replacement cleared the required ratio.
          </p>
        </figure>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          <section aria-labelledby="audit-contents">
            <h2
              id="audit-contents"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              What the report contains
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>
                Contrast failures measured from computed styles, with the ratio, the requirement and
                the element selector.
              </li>
              <li>
                axe-core violations against WCAG 2.0–2.2 A and AA and best-practice rules, alongside
                ten native structural rules.
              </li>
              <li>
                Metadata and indexability: page title and description, viewport meta, document
                language, image alt text, heading structure, the HTTP status.
              </li>
              <li>
                A viewport screenshot per page, and — on the whole-site scope — the site&apos;s own
                links followed from your URL, shallowest pages first.
              </li>
              <li>
                A coverage panel stating which engines ran, and which text could not be measured.
              </li>
            </ul>
          </section>

          <section aria-labelledby="audit-limits">
            <h2 id="audit-limits" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Before you start
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              <li>
                Up to five pages per audit on the whole-site scope, same origin only — it follows
                your site&apos;s links, not someone else&apos;s, and stops at the budget.
              </li>
              <li>
                Public pages only, and only pages you are allowed to scan. The scanner fetches the
                page server-side and says so in its user agent. Behind Cloudflare, a login or an
                allowlist?{" "}
                <Link href="/audit/this-page" className={INLINE_LINK}>
                  Audit the page in your own browser
                </Link>{" "}
                instead.
              </li>
              <li>
                A clean report is not a WCAG conformance certificate: the automated rules cover a
                subset, and interactive states, logins and other breakpoints are outside it.
              </li>
              <li>
                Nothing is changed on your site. Each proposed fix is a value you apply yourself.
              </li>
            </ul>
          </section>
        </div>

        <section
          aria-labelledby="audit-fix"
          className="mt-14 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 id="audit-fix" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Then fix what it finds
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Every failure the audit reports has a tool here that resolves it — no account, nothing
            uploaded.
          </p>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {FIX_WITH.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className={`text-sm font-medium text-zinc-900 dark:text-zinc-100 ${INLINE_LINK}`}
                >
                  {tool.label}
                </Link>
                <span className="mt-0.5 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                  {tool.blurb}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Starting from a colour rather than a finished page? The{" "}
            <Link href="/design-system" className={INLINE_LINK}>
              design system generator
            </Link>{" "}
            builds accessible palettes and checked text pairs before you ship, and{" "}
            <Link href="/tools" className={INLINE_LINK}>
              the rest of the tools
            </Link>{" "}
            cover conversion, extraction and export.
          </p>
        </section>
      </div>
    </div>
  );
}
