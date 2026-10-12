"use client";

import { useEffect, useState } from "react";

import { CopyButton } from "@/components/ui/primitives";
import { inSituSample, type InSituSample } from "@/lib/audit/in-situ-sample";
import {
  CATEGORY_LABELS,
  DETECTION_LABELS,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  SEVERITY_STYLES,
  type FindingDto,
  type FindingSeverityId,
  type ProposedFixData,
  type ScanResultsDto,
} from "@/lib/audit/types";

function SeverityPill({ severity }: { severity: FindingSeverityId }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[severity]}`}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function SeveritySummary({
  counts,
}: {
  counts: Record<FindingSeverityId, number> & { total: number };
}) {
  if (counts.total === 0) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
        Every rule that ran passed on this page. That is a good result — it is
        not a statement that the page conforms to WCAG, only that these
        specific checks found nothing.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Findings by severity">
      {SEVERITY_ORDER.filter((severity) => counts[severity] > 0).map((severity) => (
        <li key={severity}>
          <SeverityPill severity={severity} />
          <span className="ml-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            {counts[severity]}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ConfidenceNote({ finding }: { finding: FindingDto }) {
  const confidence = finding.confidence;
  const isGuidance = confidence !== null && confidence < 1;
  return (
    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
      {DETECTION_LABELS[finding.detectionMethod]}
      {confidence !== null ? ` · confidence ${Math.round(confidence * 100)}%` : ""}
      {isGuidance ? " — guidance rather than a hard failure" : ""}
    </p>
  );
}

/**
 * The fix drawn on the element it was measured on.
 *
 * A swatch reading "Aa" proves a ratio and nothing else. Whether 4.6:1 looks
 * acceptable depends on the reader's own words, at their own size and weight,
 * on their own surface — so the sample uses all three, and each side is a named
 * graphic so assistive technology hears the state, the text and the colours once
 * instead of reading the sample out of context without them.
 *
 * The caption sits outside the coloured block on purpose: a caption painted on
 * the very background being judged could itself be unreadable, and an audit
 * report is the last place to demonstrate the problem it is describing.
 */
function InSituPreview({ sample }: { sample: InSituSample }) {
  const measurement = sample.clamped
    ? `measured at ${sample.measuredFontSizePx}px, shown at ${sample.fontSizePx}px`
    : `measured at ${sample.fontSizePx}px`;

  return (
    <figure className="mt-3">
      <figcaption className="text-xs text-zinc-500">
        {sample.textKnown
          ? "Drawn on the element's own text"
          : "The element's text was not captured, so this is a stand-in"}{" "}
        — {measurement}, weight {sample.fontWeight}.
      </figcaption>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        {[
          { label: "Before", colour: sample.before },
          { label: "After", colour: sample.after },
        ].map(({ label, colour }) => (
          <div key={label} className="flex-1">
            <div
              role="img"
              aria-label={`${label}: "${sample.text}" in ${colour} on ${sample.background}, at ${sample.fontSizePx}px weight ${sample.fontWeight}`}
              className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
              style={{ backgroundColor: sample.background }}
            >
              <p
                aria-hidden="true"
                className="line-clamp-2 px-3 py-3"
                style={{
                  color: colour,
                  fontSize: `${sample.fontSizePx}px`,
                  fontWeight: sample.fontWeight,
                  lineHeight: 1.35,
                }}
              >
                {sample.text}
              </p>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {label} · <span className="tabular-nums">{colour}</span> on {sample.background}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}

/**
 * A replacement the scan generated and then re-measured.
 *
 * Nothing here is asserted beyond what `validation` carries: when the proposed
 * values did not clear the requirement, the badge says so.
 */
function ProposedFix({ fix }: { fix: ProposedFixData }) {
  const passes = fix.validation.passed;
  const requirement = fix.contrast ? ` (needs ${fix.contrast.required}:1)` : "";
  // Null only for a fix that carries no usable colour pair, in which case the
  // measured ratios above already state everything there is to show.
  const inSitu = inSituSample(fix);

  return (
    <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Proposed fix
        </h4>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            passes
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          }`}
        >
          {passes ? "Verified" : "Not verified"}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{fix.summary}</p>

      <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
        {passes ? "Re-measured" : "Measured before and after"}{" "}
        <span className="font-medium tabular-nums">
          {fix.validation.before} → {fix.validation.after}
        </span>
        {requirement}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">{fix.validation.rule}</p>

      {inSitu ? <InSituPreview sample={inSitu} /> : null}

      <dl className="mt-4 space-y-1.5 text-xs">
        {fix.changes.map((change) => (
          <div key={change.property} className="flex flex-wrap items-center gap-1.5">
            <dt className="font-medium text-zinc-600 dark:text-zinc-300">{change.property}:</dt>
            <dd className="flex flex-wrap items-center gap-1.5">
              <code className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-zinc-600 line-through dark:bg-zinc-800 dark:text-zinc-400">
                {change.before}
              </code>
              <span aria-hidden="true" className="text-zinc-400">
                →
              </span>
              <code className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                {change.after}
              </code>
            </dd>
          </div>
        ))}
      </dl>

      {fix.css ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">CSS</h5>
            <CopyButton value={fix.css} label="Copy CSS" variant="ghost" />
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 text-xs leading-5 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            <code>{fix.css}</code>
          </pre>
        </div>
      ) : null}

      {fix.tokens.length > 0 ? (
        <div className="mt-4">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Tokens</h5>
          <ul className="mt-1.5 space-y-1 text-xs">
            {fix.tokens.map((token) => (
              <li key={token.name} className="text-zinc-700 dark:text-zinc-300">
                {token.name}: {token.value};
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function FindingCard({ finding }: { finding: FindingDto }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityPill severity={finding.severity} />
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {CATEGORY_LABELS[finding.category]}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {finding.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {finding.description}
      </p>

      {finding.whyMatters ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Why it matters
          </h4>
          <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {finding.whyMatters}
          </p>
        </div>
      ) : null}

      {finding.recommendation ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            What to do
          </h4>
          <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {finding.recommendation}
          </p>
        </div>
      ) : null}

      {finding.fix ? <ProposedFix fix={finding.fix} /> : null}

      {finding.implementation ? (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Example
            </h4>
            <CopyButton value={finding.implementation} label="Copy" variant="ghost" />
          </div>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <code>{finding.implementation}</code>
          </pre>
        </div>
      ) : null}

      {finding.elementSelector || finding.wcagCriterion || finding.pageUrl ? (
        <dl className="mt-4 space-y-1.5 border-t border-zinc-200 pt-4 text-xs dark:border-zinc-800">
          {finding.pageUrl ? (
            <div className="flex flex-wrap gap-1.5">
              <dt className="text-zinc-500">Page:</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">
                <a
                  href={finding.pageUrl}
                  className="underline underline-offset-4"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {finding.pageUrl}
                </a>
              </dd>
            </div>
          ) : null}
          {finding.elementSelector ? (
            <div className="flex flex-wrap gap-1.5">
              <dt className="text-zinc-500">Element:</dt>
              <dd>
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                  {finding.elementSelector}
                </code>
              </dd>
            </div>
          ) : null}
          {finding.wcagCriterion ? (
            <div className="flex flex-wrap gap-1.5">
              <dt className="text-zinc-500">Requirement:</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">{finding.wcagCriterion}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <ConfidenceNote finding={finding} />
    </article>
  );
}

/**
 * The findings themselves.
 *
 * Callers that already hold the results pass them in; the scan page passes an
 * id instead and this component fetches them once. Both shapes are supported
 * because both routes exist — but only one request is ever made per mount.
 */
export function FindingsList({
  findings,
  scanId,
}: {
  findings?: FindingDto[];
  scanId?: string;
}) {
  const [fetched, setFetched] = useState<FindingDto[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (findings || !scanId) return;

    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/audit/scan/${scanId}/results`);
        if (!response.ok) throw new Error(`Request failed with ${response.status}`);
        const data = (await response.json()) as ScanResultsDto;
        if (!cancelled) setFetched(data.findings);
      } catch {
        // A failed request must not read as "no findings": the panel says so.
        if (!cancelled) setFailed(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [findings, scanId]);

  const list = findings ?? fetched;

  if (list === undefined || list === null) {
    if (!failed) return null;
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        The findings for this scan could not be loaded. Reload the page to try again.
      </p>
    );
  }

  if (list.length === 0) {
    if (findings) return null;
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        No findings yet. The scan may still be running.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {list.map((finding) => (
        <li key={finding.id}>
          <FindingCard finding={finding} />
        </li>
      ))}
    </ul>
  );
}
