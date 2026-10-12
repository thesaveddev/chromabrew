/**
 * Measured text contrast.
 *
 * The samples come from the rendered DOM (see dom-extract in the browser
 * runner): each one is a run of text with its resolved foreground colour, the
 * solid colour behind it, and the computed font metrics. The ratio itself is
 * computed by the design-system engine (`src/lib/design-system/colour/`), not
 * reimplemented here — ChromaBrew already has a reference-tested WCAG 2.x
 * implementation and this rule must agree with the free tools exactly.
 *
 * The guiding rule for this module: never turn "I could not measure this" into
 * "this is a failure". Text over an image, a gradient, or a translucent
 * ancestor is counted as unmeasurable and reported as nothing at all.
 */

import { AA_LARGE, AA_NORMAL, contrastRatio } from "@/lib/design-system/colour/contrast";
import {
  SEVERITY_ORDER,
  type FindingDraft,
  type FindingSeverityId,
  type TextSample,
} from "./types";

export const CONTRAST_RULE_ID = "contrast-text";

/** WCAG 2.2 large text: 18pt (24px), or 14pt (18.66px) when bold. */
export const LARGE_TEXT_PX = 24;
export const LARGE_BOLD_TEXT_PX = 18.66;
const BOLD_FONT_WEIGHT = 700;

const WCAG_CRITERION = "WCAG 2.2 SC 1.4.3 Contrast (Minimum) (Level AA)";
const DEFAULT_MAX_FINDINGS = 20;
const MAX_SAMPLE_SELECTORS = 5;
const MAX_TEXT_SAMPLES = 3;
const MAX_TEXT_LENGTH = 120;

export interface ContrastSummary {
  /** Samples that reduced to a solid foreground/background pair and were measured. */
  measurable: number;
  /** Samples that could not be measured (image or gradient behind, opacity, empty text). */
  unmeasurable: number;
  /** Measurable samples whose ratio is below the ratio their text size requires. */
  failing: number;
}

export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  if (!Number.isFinite(fontSizePx)) return false;
  if (fontSizePx >= LARGE_TEXT_PX) return true;
  return fontWeight >= BOLD_FONT_WEIGHT && fontSizePx >= LARGE_BOLD_TEXT_PX;
}

/** The AA minimum this text size has to reach: 3:1 for large text, else 4.5:1. */
export function requiredRatio(fontSizePx: number, fontWeight: number): number {
  return isLargeText(fontSizePx, fontWeight) ? AA_LARGE : AA_NORMAL;
}

/**
 * A sample is measurable only when it is a solid foreground on a solid
 * background and there is actually text to look at.
 */
function isMeasurable(sample: TextSample): boolean {
  if (sample.background === null) return false;
  if (sample.backgroundSource === "unmeasurable") return false;
  return sample.text.trim().length > 0;
}

/** Contrast ratio, or null when the colours cannot be resolved to finite numbers. */
function safeRatio(color: string, background: string): number | null {
  try {
    const ratio = contrastRatio(color, background);
    return Number.isFinite(ratio) ? ratio : null;
  } catch {
    // A malformed colour from the page must degrade to "not measured", not throw.
    return null;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function truncate(value: string, max: number): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, max - 1)}…`;
}

/**
 * Severity from measurement alone: failing the lenient large-text minimum (3:1)
 * is worse than failing only the body-text minimum (4.5:1). There is no
 * "medium" here — this is arithmetic, not an opinion.
 */
function severityFor(ratio: number): FindingSeverityId {
  return ratio < AA_LARGE ? "critical" : "high";
}

/** Per-sample counts, so the report can state what it did and did not check. */
export function measureContrast(samples: TextSample[]): ContrastSummary {
  let measurable = 0;
  let unmeasurable = 0;
  let failing = 0;

  for (const sample of samples) {
    if (!isMeasurable(sample)) {
      unmeasurable += 1;
      continue;
    }
    const ratio = safeRatio(sample.color, sample.background as string);
    if (ratio === null) {
      unmeasurable += 1;
      continue;
    }
    measurable += 1;
    if (ratio < requiredRatio(sample.fontSizePx, sample.fontWeight)) failing += 1;
  }

  return { measurable, unmeasurable, failing };
}

interface ContrastGroup {
  color: string;
  background: string;
  large: boolean;
  ratio: number;
  required: number;
  occurrences: number;
  selectors: string[];
  texts: string[];
  fontSizePx: number;
  fontWeight: number;
  backgroundSource: TextSample["backgroundSource"];
}

function groupKey(sample: TextSample, large: boolean): string {
  return `${sample.color}|${sample.background}|${large ? "large" : "normal"}`;
}

function toDraft(group: ContrastGroup): FindingDraft {
  const ratio = round2(group.ratio);
  const required = group.required;
  const sizeClass = group.large ? "large" : "body";
  const plural = group.occurrences === 1;

  const title = plural
    ? `Text contrast is ${ratio}:1 (needs ${required}:1)`
    : `${group.occurrences} text elements have ${ratio}:1 contrast (needs ${required}:1)`;

  const description = plural
    ? `Text in ${group.selectors[0]} is ${group.color} on ${group.background} — a measured contrast ratio of ${ratio}:1. WCAG AA requires ${required}:1 for ${sizeClass} text at this size (${round2(group.fontSizePx)}px, weight ${group.fontWeight}).`
    : `${group.occurrences} elements share the colour pair ${group.color} on ${group.background}, at a measured contrast ratio of ${ratio}:1. WCAG AA requires ${required}:1 for ${sizeClass} text.`;

  const whyMatters =
    `Below the AA minimum, text stops being comfortably readable for anyone with reduced contrast sensitivity — and also for everyone on a dim or glare-affected screen, which is most people some of the time. ` +
    `WCAG 2.2 SC 1.4.3 sets the minimum at ${AA_NORMAL}:1 for body text and ${AA_LARGE}:1 for large text; this pair measures ${ratio}:1 against a ${required}:1 requirement.`;

  const recommendation =
    `Move the text colour, the background, or both until the measured ratio reaches at least ${required}:1. Changing the background is often the cheaper fix when the text colour is a brand colour, and lightening a dark text colour is usually cheaper than the reverse. ` +
    `This finding carries an exact replacement when one could be computed — the nearest accessible shade of the same colour, re-measured against the same background — and carries none when it could not.`;

  const implementation = [
    `${group.selectors[0]} {`,
    `  color: ${group.color}; /* on ${group.background} — ${ratio}:1, needs ${required}:1 */`,
    `}`,
  ].join("\n");

  return {
    ruleId: CONTRAST_RULE_ID,
    category: "color_contrast",
    severity: severityFor(group.ratio),
    title,
    description,
    whyMatters,
    recommendation,
    implementation,
    elementSelector: group.selectors[0] ?? null,
    // Left empty on purpose: the replacement colour is attached after
    // deduplication by the fix generator (fixes.ts), which re-measures whatever
    // it proposes. A guess here would be worse than a number.
    suggestedValues: null,
    originalValues: {
      color: group.color,
      background: group.background,
      ratio,
      required,
      fontSizePx: round2(group.fontSizePx),
      fontWeight: group.fontWeight,
      large: group.large,
      occurrences: group.occurrences,
    },
    evidence: {
      occurrences: group.occurrences,
      sampleSelectors: group.selectors.slice(0, MAX_SAMPLE_SELECTORS),
      backgroundSource: group.backgroundSource,
      textSamples: group.texts.slice(0, MAX_TEXT_SAMPLES),
      measured: true,
    },
    wcagCriterion: WCAG_CRITERION,
    detectionMethod: "deterministic",
    confidence: 1,
  };
}

/**
 * Turn rendered text samples into contrast findings.
 *
 * Repeated occurrences of one colour pair collapse into a single finding that
 * reports how many elements it affects — a page with 40 instances of one
 * too-light grey is one problem, not forty.
 */
export function buildContrastFindings(
  samples: TextSample[],
  options: { maxFindings?: number } = {},
): FindingDraft[] {
  const maxFindings = options.maxFindings ?? DEFAULT_MAX_FINDINGS;
  const groups = new Map<string, ContrastGroup>();

  for (const sample of samples) {
    if (!isMeasurable(sample)) continue;

    const background = sample.background as string;
    const ratio = safeRatio(sample.color, background);
    if (ratio === null) continue;

    const large = isLargeText(sample.fontSizePx, sample.fontWeight);
    const required = requiredRatio(sample.fontSizePx, sample.fontWeight);
    if (ratio >= required) continue;

    const key = groupKey(sample, large);
    const existing = groups.get(key);
    if (existing) {
      existing.occurrences += 1;
      existing.selectors.push(sample.selector);
      if (existing.texts.length < MAX_TEXT_SAMPLES) {
        existing.texts.push(truncate(sample.text, MAX_TEXT_LENGTH));
      }
      // Keep the largest type size in the group: it is the most representative
      // of what a reader actually sees, and the ratio is identical anyway.
      if (sample.fontSizePx > existing.fontSizePx) {
        existing.fontSizePx = sample.fontSizePx;
        existing.fontWeight = sample.fontWeight;
      }
      continue;
    }

    groups.set(key, {
      color: sample.color,
      background,
      large,
      ratio,
      required,
      occurrences: 1,
      selectors: [sample.selector],
      texts: [truncate(sample.text, MAX_TEXT_LENGTH)],
      fontSizePx: sample.fontSizePx,
      fontWeight: sample.fontWeight,
      backgroundSource: sample.backgroundSource,
    });
  }

  return [...groups.values()]
    .map(toDraft)
    .sort((a, b) => {
      const bySeverity =
        SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
      if (bySeverity !== 0) return bySeverity;
      const ratioA = Number(a.originalValues?.ratio ?? 0);
      const ratioB = Number(b.originalValues?.ratio ?? 0);
      if (ratioA !== ratioB) return ratioA - ratioB;
      return (a.elementSelector ?? "").localeCompare(b.elementSelector ?? "");
    })
    .slice(0, Math.max(0, maxFindings));
}
