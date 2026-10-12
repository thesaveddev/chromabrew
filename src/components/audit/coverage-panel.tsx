import {
  UNMEASURABLE_REASON_LABELS,
  type ScanCoverageDto,
  type UnmeasurableReasonId,
} from "@/lib/audit/types";

const REASON_ORDER: readonly UnmeasurableReasonId[] = [
  "background_image",
  "altered_rendering",
  "unsupported_colour",
];

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-1.5">
      <dt className="text-zinc-500">{term}:</dt>
      <dd className="text-zinc-700 dark:text-zinc-300">{children}</dd>
    </div>
  );
}

function listReasons(reasons: Partial<Record<UnmeasurableReasonId, number>>): string | null {
  const parts = REASON_ORDER.filter((reason) => (reasons[reason] ?? 0) > 0).map(
    (reason) => `${reasons[reason]} ${UNMEASURABLE_REASON_LABELS[reason]}`,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * What the engines actually did on this scan.
 *
 * This panel exists because an empty findings list is ambiguous: it can mean
 * "the page is fine" or it can mean "the engine never ran". Every claim here
 * comes from a recorded fact about the scan, and anything that did not happen
 * is stated rather than left to be inferred.
 */
export function CoveragePanel({ coverage }: { coverage: ScanCoverageDto }) {
  const reasons = listReasons(coverage.unmeasurableReasons);
  const linksKnown = coverage.linksFound !== null;

  return (
    <section
      aria-labelledby="audit-coverage-heading"
      className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2
        id="audit-coverage-heading"
        className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
      >
        What ran on this page
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Analysis coverage, recorded from the scan itself. Anything marked as not measured was not
        checked — it is not a pass.
      </p>

      <dl className="mt-4 space-y-2 text-xs leading-5">
        <Fact term="Rules">
          {coverage.rulesRun} native rules
          {coverage.nativeFindings > 0 ? ` · ${coverage.nativeFindings} finding` : ""}
          {coverage.nativeFindings === 1 ? "" : "s"}
          {coverage.renderMode === "browser" ? " on the rendered document" : ""}
        </Fact>

        <Fact term="Accessibility engine">
          {coverage.axeRan ? (
            <>
              axe-core {coverage.axeVersion ?? "unknown version"} ran
              {coverage.axeFindings > 0 ? ` · ${coverage.axeFindings} violations` : " · no violations"}
            </>
          ) : (
            <span className="text-amber-800 dark:text-amber-300">
              Did not run
              {coverage.axeError ? ` — ${coverage.axeError}` : " — no reason was recorded"}, so
              accessibility rules outside the native catalogue were not checked
            </span>
          )}
        </Fact>

        <Fact term="Contrast">
          {coverage.renderMode === "browser" ? (
            <>
              {coverage.textSamplesMeasured} text samples measured
              {coverage.textElementsUnmeasurable > 0 ? (
                <>
                  {" "}
                  · {coverage.textElementsUnmeasurable} text elements could not be measured
                  {reasons ? ` (${reasons})` : ""}
                </>
              ) : (
                " · every text element resolved to a solid colour pair"
              )}
            </>
          ) : (
            <span className="text-amber-800 dark:text-amber-300">
              Not measured — the page was fetched, not rendered
            </span>
          )}
        </Fact>

        <Fact term="Links">
          {linksKnown ? (
            <>
              {coverage.linksFound} distinct links
              {coverage.linksExternal !== null && coverage.linksExternal > 0
                ? ` · ${coverage.linksExternal} point off this site`
                : ""}
            </>
          ) : (
            <span className="text-zinc-500">
              Not collected — link discovery needs a rendered document
            </span>
          )}
        </Fact>

        {coverage.blockedRequests > 0 ? (
          <Fact term="Safety policy">
            {coverage.blockedRequests} subresource
            {coverage.blockedRequests === 1 ? " request was" : " requests were"} refused by the
            scanner&rsquo;s request guard; they were not loaded and their content is not in this
            report
          </Fact>
        ) : null}
      </dl>
    </section>
  );
}
