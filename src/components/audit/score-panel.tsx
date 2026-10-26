/**
 * The website health summary: score ring, severity donut, category bars.
 *
 * Pure and server-rendered — the same numbers appear in the owner's view,
 * the shared link, the ZIP bundle and print. All charts are inline SVG or
 * CSS, so there is nothing to load and nothing that can fail to render.
 */

import { categoryScores, scoreBand, scoreFromCounts } from "@/lib/audit/score";
import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  type FindingDto,
  type ScanResultsDto,
} from "@/lib/audit/types";

/** Bar/segment colours per severity (hex, readable in light + dark). */
const SEVERITY_HEX: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#0284c7",
  informational: "#71717a",
};

function scoreStroke(score: number): string {
  if (score >= 70) return "#059669";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  return (
    <div className="flex items-center gap-5">
      <svg
        width="132"
        height="132"
        viewBox="0 0 132 132"
        role="img"
        aria-label={`Website health score ${score} out of 100, rated ${label}`}
        className="shrink-0"
      >
        <circle cx="66" cy="66" r={radius} fill="none" strokeWidth="12" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          fill="none"
          stroke={scoreStroke(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform="rotate(-90 66 66)"
        />
        <text
          x="66"
          y="62"
          textAnchor="middle"
          className="fill-zinc-900 dark:fill-zinc-100"
          fontSize="30"
          fontWeight="700"
        >
          {score}
        </text>
        <text
          x="66"
          y="82"
          textAnchor="middle"
          className="fill-zinc-500 dark:fill-zinc-400"
          fontSize="11"
        >
          / 100
        </text>
      </svg>
      <div>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
        <p className="mt-1 max-w-xs text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {scoreBand(score).blurb}
        </p>
      </div>
    </div>
  );
}

function SeverityDonut({
  counts,
}: {
  counts: ScanResultsDto["counts"];
}) {
  const total = counts.total;
  if (total === 0) return null;
  const radius = 15.9155; // circumference exactly 100
  let offset = 25; // start at the top
  return (
    <figure className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 42 42" role="img" aria-label="Findings by severity">
        <circle cx="21" cy="21" r={radius} fill="none" strokeWidth="7" className="stroke-zinc-200 dark:stroke-zinc-800" />
        {SEVERITY_ORDER.filter((severity) => counts[severity] > 0).map((severity) => {
          const fraction = (counts[severity] / total) * 100;
          const segment = (
            <circle
              key={severity}
              cx="21"
              cy="21"
              r={radius}
              fill="none"
              stroke={SEVERITY_HEX[severity]}
              strokeWidth="7"
              strokeDasharray={`${fraction} ${100 - fraction}`}
              strokeDashoffset={offset}
            />
          );
          offset -= fraction;
          return segment;
        })}
      </svg>
      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {SEVERITY_ORDER.filter((severity) => counts[severity] > 0).map((severity) => (
          <li key={severity} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: SEVERITY_HEX[severity] }}
            />
            {SEVERITY_LABELS[severity]} · {counts[severity]}
          </li>
        ))}
      </ul>
    </figure>
  );
}

function CategoryBars({ findings }: { findings: FindingDto[] }) {
  const scores = categoryScores(findings);
  if (scores.length === 0) return null;
  return (
    <ul className="mt-5 space-y-3" aria-label="Health by category">
      {scores.map(({ category, score, findings: count }) => (
        <li key={category}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">{CATEGORY_LABELS[category]}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {score} · {count} {count === 1 ? "issue" : "issues"}
            </span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            role="img"
            aria-label={`${CATEGORY_LABELS[category]} score ${score} out of 100`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${score}%`, backgroundColor: scoreStroke(score) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ScorePanel({ results }: { results: ScanResultsDto }) {
  const score = scoreFromCounts(results.counts);
  const band = scoreBand(score);
  return (
    <section
      aria-label="Website health score"
      className="audit-report-score rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Website health
      </h2>
      <div className="mt-4 flex flex-wrap items-start gap-x-10 gap-y-6">
        <ScoreRing score={score} label={band.label} />
        <SeverityDonut counts={results.counts} />
      </div>
      <CategoryBars findings={results.findings} />
      <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Scored from {results.counts.total} {results.counts.total === 1 ? "issue" : "issues"} across{" "}
        {results.pages.length} {results.pages.length === 1 ? "page" : "pages"}. Critical issues
        weigh heaviest; informational notes never lower the score.
      </p>
    </section>
  );
}
