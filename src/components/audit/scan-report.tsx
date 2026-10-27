import { CoveragePanel } from "@/components/audit/coverage-panel";
import { PageTabs } from "@/components/audit/page-tabs";
import { ScorePanel } from "@/components/audit/score-panel";
import {
  RENDER_MODE_LABELS,
  RENDER_MODE_NOTES,
  type ScanResultsDto,
  type ScanStatusDto,
} from "@/lib/audit/types";

/**
 * The finished report, as a pure function of its DTO.
 *
 * This is the one implementation of "what a report looks like", used by the
 * owner's scan page and by the shared `/r/[token]` link. Both need the same
 * screenshot, the same findings and the same coverage panel; keeping two copies
 * would let a shared report drift from the report the owner reviewed, which is
 * exactly the thing a share link must not do.
 *
 * It takes no hooks and does no fetching, so it renders on the server for the
 * shared route and inside the client-side scan flow alike.
 */

function ResultSummary({ scan }: { scan: ScanStatusDto }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Scanned URL
        </dt>
        <dd className="mt-1 break-all text-sm text-zinc-800 dark:text-zinc-200">
          {scan.normalizedUrl}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Viewport
        </dt>
        <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
          {scan.viewportWidth} × {scan.viewportHeight}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Pages
        </dt>
        <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
          {scan.pagesScanned} of {scan.pagesTotal} scanned
          {scan.pagesFailed > 0 ? ` · ${scan.pagesFailed} failed` : ""}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Duration
        </dt>
        <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
          {scan.durationMs === null ? "—" : `${(scan.durationMs / 1000).toFixed(1)}s`}
        </dd>
      </div>
    </dl>
  );
}

export function ScanReport({ results }: { results: ScanResultsDto }) {
  const page = results.pages[0];

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {page?.title ?? results.scan.normalizedUrl}
        </h2>
        {results.scan.status === "partially_completed" ? (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
            {results.scan.errorMessage ??
              "Part of this audit could not be completed; findings describe what was reachable."}
          </p>
        ) : null}
        <div className="mt-5">
          <ResultSummary scan={results.scan} />
        </div>
        {page ? (
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            HTTP {page.statusCode ?? "—"}
            {page.loadTimeMs !== null
              ? ` · responded in ${(page.loadTimeMs / 1000).toFixed(2)}s`
              : ""}
            {` · ${results.scan.ruleCount} rules ran`}
          </p>
        ) : null}

        {/* How the page was analysed. A fetch-only result is missing whole
            categories of measurement, so it must never read as a clean bill. */}
        {results.scan.renderMode ? (
          <p
            className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-5 ${
              results.scan.renderMode === "fetch"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400"
            }`}
          >
            <span className="font-medium">{RENDER_MODE_LABELS[results.scan.renderMode]}.</span>{" "}
            {RENDER_MODE_NOTES[results.scan.renderMode]}
          </p>
        ) : null}
      </div>

      <ScorePanel results={results} />

      {/* One tab per audited page: its screenshot, its status and its own
          findings. The score above stays global; everything below is scoped
          to the selected page, so a five-page scan reads as five short
          reports instead of one long wall. */}
      <PageTabs
        pages={results.pages}
        findings={results.findings}
        viewportWidth={results.scan.viewportWidth}
        viewportHeight={results.scan.viewportHeight}
      />

      {results.duplicatesGrouped > 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {results.duplicatesGrouped} duplicate{" "}
          {results.duplicatesGrouped === 1 ? "report" : "reports"} grouped —
          repeated instances of the same problem are counted once above.
        </p>
      ) : null}

      <CoveragePanel coverage={results.coverage} />

      <p className="border-t border-zinc-200 pt-5 text-xs leading-5 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Limitations: the automated rules cover a subset of WCAG 2.2 and this report is not a
        certificate of conformance. Where the page was rendered, JavaScript-built content and
        computed styles are included; text over an image, a gradient or a translucent layer cannot
        be measured and is reported above as not measured rather than guessed at. Only the pages
        listed in this report were checked, at one viewport — interactive states such as menus,
        hover and focus, content behind a login, other breakpoints and multi-page journeys are
        outside this stage. Each suggested fix has been recalculated before it is shown, but none
        of them has been applied to the audited site, and before-and-after previews do not exist
        yet.
      </p>
    </section>
  );
}
