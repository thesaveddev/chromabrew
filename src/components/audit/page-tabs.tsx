"use client";

import { useState } from "react";

import { AnnotatedScreenshot } from "@/components/audit/annotated-screenshot";
import { BrandFitPanel } from "@/components/audit/brand-fit-panel";
import { FindingsList } from "@/components/audit/findings-list";
import type { FindingDto, ScannedPageDto } from "@/lib/audit/types";

/** Tab label: the page title, or the hostname when there is no title. */
function pageLabel(page: ScannedPageDto): string {
  if (page.title) return page.title;
  try {
    return new URL(page.url).hostname;
  } catch {
    return page.url;
  }
}

/**
 * One tab per audited page. A five-page scan with thirty issues was a single
 * scrolling wall; now each page gets its own screenshot, status line and
 * findings, and the reader switches instead of scrolling.
 *
 * Single-page scans render the panel directly with no tab bar, so the common
 * case looks exactly as it did before. Findings that name no page (older rows
 * predate page attribution) fall into the first tab rather than vanishing.
 */
export function PageTabs({
  pages,
  findings,
  viewportWidth,
  viewportHeight,
}: {
  pages: ScannedPageDto[];
  findings: FindingDto[];
  viewportWidth: number;
  viewportHeight: number;
}) {
  const [activeId, setActiveId] = useState(pages[0]?.id ?? "");
  const active = pages.find((page) => page.id === activeId) ?? pages[0];

  if (!active) return null;

  const findingsFor = (page: ScannedPageDto, fallbackFirst: boolean) =>
    findings.filter((finding) =>
      finding.pageUrl ? finding.pageUrl === page.url : fallbackFirst && page.id === pages[0]?.id,
    );

  return (
    <div>
      {pages.length > 1 ? (
        <div
          role="tablist"
          aria-label="Audited pages"
          className="flex flex-wrap gap-2"
        >
          {pages.map((page) => {
            const count = findingsFor(page, true).length;
            const selected = page.id === active.id;
            return (
              <button
                key={page.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`page-panel-${page.id}`}
                id={`page-tab-${page.id}`}
                onClick={() => setActiveId(page.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500"
                }`}
              >
                <span
                  aria-hidden="true"
                  title={page.statusCode === null ? "not analysed" : `HTTP ${page.statusCode}`}
                  className={`inline-block h-2 w-2 rounded-full ${
                    page.statusCode === null
                      ? "bg-zinc-400"
                      : page.statusCode < 400
                        ? "bg-emerald-500"
                        : "bg-red-500"
                  }`}
                />
                <span className="max-w-44 truncate">{pageLabel(page)}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] ${
                    selected
                      ? "bg-white/20 text-white dark:bg-zinc-900/10 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        key={active.id}
        role={pages.length > 1 ? "tabpanel" : undefined}
        id={pages.length > 1 ? `page-panel-${active.id}` : undefined}
        aria-labelledby={pages.length > 1 ? `page-tab-${active.id}` : undefined}
        className={pages.length > 1 ? "mt-4 space-y-6" : "space-y-6"}
      >
        <PagePanel
          page={active}
          findings={findingsFor(active, true)}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
        />
      </div>
    </div>
  );
}

function PagePanel({
  page,
  findings,
  viewportWidth,
  viewportHeight,
}: {
  page: ScannedPageDto;
  findings: FindingDto[];
  viewportWidth: number;
  viewportHeight: number;
}) {
  return (
    <>
      {page.screenshotUrl ? (
        <AnnotatedScreenshot
          page={page}
          findings={findings.filter((finding) => finding.pageUrl === page.url)}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
          {page.statusCode === null
            ? (page.errorMessage ?? "This page could not be analysed, so there is no screenshot.")
            : "No screenshot was captured for this page — usually because the page blocked rendering or the capture failed. The findings below stand on their own measurements."}
        </p>
      )}

      <BrandFitPanel page={page} />

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Findings on this page
          <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            {findings.length} {findings.length === 1 ? "issue" : "issues"}
          </span>
        </h2>
        <p className="mt-1 break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {page.url}
          {page.statusCode !== null ? ` · HTTP ${page.statusCode}` : ""}
          {page.loadTimeMs !== null ? ` · responded in ${(page.loadTimeMs / 1000).toFixed(2)}s` : ""}
        </p>
        <div className="mt-4">
          <FindingsList findings={findings} />
        </div>
      </section>
    </>
  );
}
