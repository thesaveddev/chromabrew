import type { Metadata } from "next";
import Link from "next/link";

import { SCANNER_USER_AGENT } from "@/lib/audit/analyzer";
import {
  SCANNER_ACCEPT_LANGUAGE,
  SCANNER_BROWSER_UA,
} from "@/lib/audit/scanner-identity";

export const metadata: Metadata = {
  title: "Allowlist the audit scanner",
  description:
    "Why the ChromaBrew website audit can be stopped by Cloudflare bot verification, and exactly how to let it through on your own site.",
  alternates: { canonical: "/audit/scanner" },
};

/**
 * The site-owner side of the bot-challenge story.
 *
 * The scanner's report links here the moment a scan is blocked by bot
 * verification, so this page owes the reader one thing: a straight answer to
 * "what do I change, and where". It also states plainly what the scanner sends
 * and what it will not do — the allowlisting path is the honest one, and the
 * page should make that obvious rather than hiding it in fine print.
 */
const WAF_RULE_EXPRESSION = `(ip.src eq 203.0.113.10)`;

export default function ScannerAllowlistPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Website audit
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Let the audit scanner past your bot protection
        </h1>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          If a scan of your site came back with{" "}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
            “Blocked by Cloudflare bot verification”
          </strong>{" "}
          instead of findings, your firewall did its job — it just could not
          tell our scanner from a bot. This page explains what the scanner
          sends and how to allowlist it in a few clicks.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          What happened
        </h2>
        <p className="leading-7 text-zinc-600 dark:text-zinc-400">
          Cloudflare protects sites by challenging visitors it scores as
          automated. The challenge is a short verification page (“Just a
          moment…”), and the scanner refuses to pretend it is your site: an
          audit of the verification screen would read like a report on your
          pages. So it stops, records exactly which signals identified the
          block, and tells you — which is why you are here.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          What the scanner sends
        </h2>
        <p className="leading-7 text-zinc-600 dark:text-zinc-400">
          Page requests come from a real headless Chromium browser, presenting
          as one. On the wire that means:
        </p>
        <ul className="list-disc space-y-2 pl-6 leading-7 text-zinc-600 dark:text-zinc-400">
          <li>
            A standard browser user-agent:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] dark:bg-zinc-800">
              {SCANNER_BROWSER_UA}
            </code>
          </li>
          <li>
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] dark:bg-zinc-800">
              Accept-Language: {SCANNER_ACCEPT_LANGUAGE}
            </code>{" "}
            and normal browser headers
          </li>
          <li>
            Requests from a single server address, at a polite rate — one page
            at a time, never a burst
          </li>
        </ul>
        <p className="leading-7 text-zinc-600 dark:text-zinc-400">
          Scan records also store an honest identification string for your own
          logs and support requests:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] dark:bg-zinc-800">
            {SCANNER_USER_AGENT}
          </code>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Allowlisting in Cloudflare
        </h2>
        <ol className="list-decimal space-y-3 pl-6 leading-7 text-zinc-600 dark:text-zinc-400">
          <li>
            Find the scanner&apos;s address: open{" "}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
              Security → Events
            </strong>{" "}
            in the Cloudflare dashboard and look for the challenged request
            from when the scan ran (the one whose service is our audit). The{" "}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
              IP address
            </strong>{" "}
            shown there is where the scan came from.
          </li>
          <li>
            Go to{" "}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
              Security → WAF → Custom rules
            </strong>{" "}
            and create a rule:
            <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-[13px] leading-5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {`Expression:  ${WAF_RULE_EXPRESSION}
Action:     Skip
             ✓ All remaining custom rules
             ✓ Super Bot Fight Mode (if enabled)`}
            </pre>
            Replace <code>203.0.113.10</code> with the address from step 1. If
            you use IP lists, adding it to an existing list the rule references
            works the same.
          </li>
          <li>
            Run the scan again. The audit starts immediately; the previous
            blocked attempt stays in your history with its evidence.
          </li>
        </ol>
        <p className="leading-7 text-zinc-600 dark:text-zinc-400">
          Two honest caveats. Cloudflare&apos;s free{" "}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
            Bot Fight Mode
          </strong>{" "}
          cannot be skipped per-IP by custom rules — if it is on and blocking
          scans, it has to be disabled (or replaced by Super Bot Fight Mode,
          which the rule above can skip). And if our hosting address ever
          changes, the newest challenged event will show the new one.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Using a different firewall?
        </h2>
        <p className="leading-7 text-zinc-600 dark:text-zinc-400">
          The principle is the same everywhere: allowlist the address the
          blocked scan came from. The report for a blocked scan always names
          the protection that stopped it, so you know which console to open.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          What we will not do
        </h2>
        <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-400">
          The scanner never solves CAPTCHAs, never disguises itself to defeat a
          protection that has identified it, and never distributes requests
          across proxies. When a site says no, the scan reports that it said
          no. Allowlisting is the only way through we support — it is also the
          only one that keeps your protection meaningful for everyone else.
        </p>
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Ready? Head back to the{" "}
        <Link
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          href="/audit"
        >
          website audit
        </Link>{" "}
        and run the scan again.
      </p>
    </main>
  );
}
