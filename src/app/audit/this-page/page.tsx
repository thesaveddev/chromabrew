import type { Metadata } from "next";
import Link from "next/link";

import { ThisPageDemo } from "@/components/audit/this-page-demo";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Audit this page — in your browser",
  description:
    "When Cloudflare, a login wall or an IP allowlist stops the server scanner, run the same axe-core, contrast and structure checks in your own tab — with your session, nothing uploaded.",
  alternates: { canonical: "/audit/this-page" },
  robots: { index: true },
};

const INLINE_LINK =
  "underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";

/** The drag-to-bookmarks-bar link. Runs on the *target* site, so the bundle URL is absolute. */
function bookmarkletHref(bundleUrl: string): string {
  return (
    "javascript:(function(){" +
    "if(document.getElementById('chromabrew-audit-overlay'))return;" +
    "var s=document.createElement('script');" +
    `s.src='${bundleUrl}';` +
    "document.documentElement.appendChild(s);" +
    "})()"
  );
}

export default function ThisPageAuditPage() {
  const bundleUrl = `${siteUrl}/in-browser/in-browser-audit.js`;

  return (
    <div className="flex flex-1 flex-col px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Website audit · for protected pages
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
            Audit the page you can already see
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            The server scanner fetches pages with its own identity, so Cloudflare bot
            verification, a login wall or an IP allowlist answers it with a challenge
            instead of your page. You already passed that challenge in your browser —
            so run the checks there: axe-core plus the contrast and structure analysis,
            against the live page in your own tab, with your session, cookies and IP.
            Nothing leaves your machine.
          </p>
        </header>

        <div className="mt-10">
          <ThisPageDemo bundleUrl="/in-browser/in-browser-audit.js" />
        </div>

        <section aria-labelledby="this-page-options" className="mt-14">
          <h2
            id="this-page-options"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Two ways to run it, one code path
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                1 · Extension button
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Load the ChromaBrew extension unpacked, open the protected page, clear
                its challenge yourself, then click{" "}
                <strong className="font-semibold">Audit this page</strong> in the side
                panel. The report lands on the page.
              </p>
              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
                Setup takes a minute:{" "}
                <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                  chrome://extensions → Developer mode → Load unpacked →
                  chrome-extension/
                </code>
                . The audit bundle ships inside that folder — rebuild it with{" "}
                <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                  npm run audit:bundle
                </code>{" "}
                after changing any audit engine.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                2 · Bookmarklet
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                No install. Drag this link to your bookmarks bar, open the protected
                page, pass its challenge, then click the bookmark:
              </p>
              <p className="mt-3">
                <a
                  href={bookmarkletHref(bundleUrl)}
                  className="inline-block rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  Audit this page
                </a>
              </p>
              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
                It loads one script from this site and runs it in your tab. Some
                pages with a strict content-security-policy block injected scripts —
                the extension button works there instead.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="this-page-checks" className="mt-14">
          <h2
            id="this-page-checks"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            What it checks
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <li>
              axe-core against WCAG 2.0–2.2 A and AA plus best-practice rules — the
              same rule set and tags as the server pipeline.
            </li>
            <li>
              Measured text contrast from computed styles, with the measured ratio,
              the requirement and the element selector — the same collector the
              server serialises into scanned pages.
            </li>
            <li>
              The ten structural rules over the rendered markup: title, description,
              viewport, language, image alt text, headings, indexability.
            </li>
            <li>
              Proposed fixes are attached where one could be computed and re-measured
              — same as a server report.
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="this-page-privacy"
          className="mt-14 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2
            id="this-page-privacy"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            What it will not do
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <li>
              Nothing is uploaded: the audit reads your DOM and reports in an overlay
              on the page. Copying results as JSON is an explicit button, not a
              default.
            </li>
            <li>
              This audits one page you can see — it does not crawl a site, capture a
              screenshot for sharing, or save a report to your history. For public
              pages, the{" "}
              <Link href="/audit" className={INLINE_LINK}>
                server audit
              </Link>{" "}
              still does all of that.
            </li>
            <li>
              A clean result is not a WCAG conformance certificate: automated rules
              cover a subset, and the report says which engines ran.
            </li>
          </ul>
        </section>

        <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
          Own the site and prefer server scans?{" "}
          <Link href="/audit/scanner" className={INLINE_LINK}>
            Allowlist the scanner
          </Link>{" "}
          so the full crawl reaches it too.
        </p>
      </div>
    </div>
  );
}
