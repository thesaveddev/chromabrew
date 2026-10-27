import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ScanReport } from "@/components/audit/scan-report";
import { getSharedReport } from "@/lib/audit/share";

export const dynamic = "force-dynamic";

/**
 * A shared audit report, readable by anyone holding the link.
 *
 * The token is the whole authorisation: there is no session, and nothing about
 * the scan is reachable from an id here. Everything that is not a live shared
 * report — an unknown token, a revoked one, a scan that is not in a shareable
 * state — is a 404, so a revoked link is indistinguishable from one that never
 * existed.
 *
 * These pages are `noindex, nofollow`: a report is a customer's site being
 * judged, and it should not turn up in search results because a link was pasted
 * somewhere public.
 */

const loadReport = cache(getSharedReport);

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const report = await loadReport(token);
  if (!report) return { title: "Report not found", robots: { index: false, follow: false } };
  return {
    title: `Audit report: ${report.scan.normalizedUrl} · ChromaBrew`,
    description: `A shared ChromaBrew audit of ${report.scan.normalizedUrl} — findings, the rendered screenshot and what the analysis actually measured.`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedReportPage({ params }: Props) {
  const { token } = await params;
  const report = await loadReport(token);
  if (!report) notFound();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex w-full max-w-none flex-wrap items-center gap-3 px-4 py-4 sm:px-8 lg:px-12">
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Shared report
          </span>
          <Link href="/audit" className="ml-auto text-sm font-medium underline underline-offset-2">
            Audit your own site
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-none">
          <header className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Audit of {report.scan.normalizedUrl}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              This is a snapshot of one audit, shared by the person who ran it. It is not a
              certificate of conformance, the audited site has not been changed, and nothing here
              has been verified against the live site since the scan ran.
              {report.scan.completedAt
                ? ` Completed ${new Date(report.scan.completedAt).toISOString().slice(0, 10)}.`
                : ""}
            </p>
          </header>

          <div className="mt-6">
            <ScanReport results={report.results} />
          </div>
        </div>
      </div>
    </div>
  );
}
