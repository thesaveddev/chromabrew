/**
 * The website health score.
 *
 * One number for the whole report: start at 100, subtract per finding
 * weighted by severity, floor at zero. Severity weights are a product
 * decision, not a WCAG statement — the report's own limitations note still
 * says this is not a conformance certificate. Pure, so the report, the
 * timeline trend and the ZIP bundle all compute the same number from the
 * same inputs.
 */

import type { FindingCategoryId, FindingSeverityId } from "./types";

/** Points deducted per finding, by severity. Informational never deducts. */
export const SCORE_WEIGHTS: Record<FindingSeverityId, number> = {
  critical: 15,
  high: 8,
  medium: 4,
  low: 1,
  informational: 0,
} as const;

export interface ScoreBand {
  /** Short label shown next to the number. */
  label: string;
  /** One-line reading of what the number means. */
  blurb: string;
}

/**
 * Band for a score. Bands are coarse on purpose: the number is a summary of
 * what the automated rules saw, not a precise measurement of accessibility.
 */
export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return { label: "Excellent", blurb: "The automated checks found little to complain about." };
  if (score >= 70) return { label: "Good", blurb: "Solid overall, with a handful of issues worth fixing." };
  if (score >= 50) return { label: "Fair", blurb: "Real problems to work through, none of them mysterious." };
  if (score >= 25) return { label: "Poor", blurb: "Several significant barriers — start with the critical and high findings." };
  return { label: "Critical", blurb: "The page has serious barriers. Treat the critical findings as launch blockers." };
}

/** Clamp helper: scores live in 0–100. */
function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Score from severity counts (the shape the report DTO already carries).
 * Unknown severities are ignored rather than trusted.
 */
export function scoreFromCounts(
  counts: Partial<Record<FindingSeverityId, number>>,
): number {
  let score = 100;
  for (const [severity, weight] of Object.entries(SCORE_WEIGHTS) as Array<
    [FindingSeverityId, number]
  >) {
    const n = counts[severity] ?? 0;
    if (Number.isFinite(n) && n > 0) score -= n * weight;
  }
  return clamp(score);
}

/** Score from a flat list of severities — what the timeline history carries. */
export function scoreFromSeverities(severities: readonly string[]): number {
  let score = 100;
  for (const severity of severities) {
    const weight = (SCORE_WEIGHTS as Record<string, number>)[severity];
    if (typeof weight === "number") score -= weight;
  }
  return clamp(score);
}

export interface CategoryScore {
  category: FindingCategoryId;
  score: number;
  findings: number;
}

/**
 * Per-category sub-scores from the report's findings. Same weights as the
 * headline score, so a category reads as its own 0–100. Sorted worst first —
 * the report leads with what hurts most.
 */
export function categoryScores(
  findings: ReadonlyArray<{ category: FindingCategoryId; severity: FindingSeverityId }>,
): CategoryScore[] {
  const penalties = new Map<FindingCategoryId, number>();
  const totals = new Map<FindingCategoryId, number>();
  for (const finding of findings) {
    const weight = SCORE_WEIGHTS[finding.severity] ?? 0;
    penalties.set(finding.category, (penalties.get(finding.category) ?? 0) + weight);
    totals.set(finding.category, (totals.get(finding.category) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([category, count]) => ({
      category,
      score: clamp(100 - (penalties.get(category) ?? 0)),
      findings: count,
    }))
    .sort((a, b) => a.score - b.score || b.findings - a.findings);
}
