/**
 * axe-core adapter.
 *
 * axe is the established testing engine and its output is the product's
 * evidence for accessibility findings, so this module's only job is faithful
 * translation: real axe rule ids, real severity, real selectors, and no claim
 * beyond what the engine actually reported.
 *
 * Two deliberate limits:
 *  - a violation without a `wcag*` tag is a best-practice failure, not a WCAG
 *    failure, so its severity is capped and no criterion is cited;
 *  - exact colour replacements are NOT invented here. Contrast fixes belong to
 *    the fix-generation stage, which validates them against the contrast engine.
 */

import type { FindingCategoryId, FindingDraft, FindingSeverityId, JsonObject } from "./types";

export interface AxeViolationNode {
  html: string;
  target: string[];
  failureSummary?: string;
  impact?: string | null;
  /**
   * axe's per-check payload. For `color-contrast` this carries the colours it
   * actually measured (`fgColor`, `bgColor`, `contrastRatio`, `fontSize`,
   * `fontWeight`), which is what lets the fix generator propose a replacement
   * rather than guess one.
   */
  any?: { id?: string; data?: unknown }[];
}

export interface AxeViolation {
  id: string;
  impact?: string | null;
  help: string;
  description: string;
  helpUrl?: string;
  tags: string[];
  nodes: AxeViolationNode[];
}

export interface AxeIncompleteRule {
  id: string;
  impact?: string | null;
  nodes: unknown[];
}

export interface AxeResults {
  violations: AxeViolation[];
  incomplete?: AxeIncompleteRule[];
  testEngine?: { name: string; version: string };
}

/** The axe rule tags this product runs: WCAG 2.0/2.1/2.2 A+AA, plus best practice. */
export const AXE_RUN_TAGS: readonly string[] = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
  "best-practice",
] as const;

const IMPACT_SEVERITY: Record<string, FindingSeverityId> = {
  critical: "critical",
  serious: "high",
  moderate: "medium",
  minor: "low",
};

const SEVERITY_ORDER: readonly FindingSeverityId[] = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
];

/** Never let a best-practice rule be reported more strongly than this. */
const BEST_PRACTICE_SEVERITY_CAP: FindingSeverityId = "low";

const LEVEL_TAG = /^wcag(?:2|21|22)(a|aa|aaa)$/;
const CRITERION_TAG = /^wcag(\d{3,4})$/;
const LEVEL_RANK: Record<string, number> = { a: 0, aa: 1, aaa: 2 };
const LEVEL_LABEL: Record<string, string> = { a: "A", aa: "AA", aaa: "AAA" };

export function axeImpactToSeverity(impact: string | null | undefined): FindingSeverityId {
  if (!impact) return "medium";
  return IMPACT_SEVERITY[impact] ?? "medium";
}

/** True when the tags cite an actual WCAG success criterion. */
export function axeTagIsWcag(tags: string[]): boolean {
  return tags.some((tag) => LEVEL_TAG.test(tag) || CRITERION_TAG.test(tag));
}

function capSeverity(severity: FindingSeverityId, cap: FindingSeverityId): FindingSeverityId {
  // SEVERITY_ORDER runs most severe first, so the larger index is the weaker claim.
  return SEVERITY_ORDER.indexOf(cap) > SEVERITY_ORDER.indexOf(severity) ? cap : severity;
}

/**
 * Derive a citation like "WCAG 2.2 SC 1.4.3 (Level AA)" from axe's tags.
 *
 * Several criteria can be tagged on one rule, so the choice is deterministic:
 * the numerically lowest success criterion wins, and the level is the lowest
 * level tagged for that rule (Level A is the most fundamental requirement).
 */
export function axeWcagCriterion(tags: string[]): string | null {
  const criteria: number[][] = [];
  for (const tag of tags) {
    const match = CRITERION_TAG.exec(tag);
    if (!match) continue;
    const digits = match[1];
    // axe encodes 1.4.10 as "1410": the first two digits are principle and
    // guideline, everything after them is the criterion.
    const criterion = [Number(digits[0]), Number(digits[1]), Number(digits.slice(2))];
    if (criterion.some((part) => !Number.isFinite(part))) continue;
    criteria.push(criterion);
  }
  if (criteria.length === 0) return null;

  criteria.sort((left, right) => {
    for (let index = 0; index < 3; index++) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
  });

  const [principle, guideline, criterion] = criteria[0];
  const levels = tags
    .map((tag) => LEVEL_TAG.exec(tag)?.[1])
    .filter((level): level is string => Boolean(level))
    .sort((left, right) => LEVEL_RANK[left] - LEVEL_RANK[right]);

  const citation = `WCAG 2.2 SC ${principle}.${guideline}.${criterion}`;
  return levels.length > 0 ? `${citation} (Level ${LEVEL_LABEL[levels[0]]})` : citation;
}

export function axeCategory(violation: AxeViolation): FindingCategoryId {
  if (violation.id === "color-contrast") return "color_contrast";
  if (violation.tags.some((tag) => tag === "cat.color")) return "color_contrast";
  return "accessibility";
}

/* ------------------------------------------------------------------ */
/* Guidance copy                                                       */
/* ------------------------------------------------------------------ */

interface RuleGuidance {
  whyMatters: string;
  recommendation: string;
  implementation: string;
}

/**
 * Tailored copy for the rules that show up most often in real audits. Anything
 * not listed here still gets substantive guidance generated from the rule's own
 * help text, never a placeholder.
 */
const RULE_GUIDANCE: Record<string, RuleGuidance> = {
  "color-contrast": {
    whyMatters:
      "Insufficient contrast makes text unreadable for people with low vision, in bright sunlight, or on a poor-quality screen — and unlike most barriers it affects everyone on a bad display.",
    recommendation:
      "Raise the contrast between the text and the colour actually behind it until it meets 4.5:1 for normal text, or 3:1 for large text.",
    implementation:
      "Adjust the text colour (preferred) or darken the background until the measured ratio reaches the threshold for that font size.",
  },
  "image-alt": {
    whyMatters:
      "A screen reader announces an image without alternative text as its file name, so a user hears \"hero-2-final.png\" instead of the information the image carries.",
    recommendation:
      'Add alt text that conveys the image\'s purpose, or alt="" when the image is decorative and adds nothing for a screen-reader user.',
    implementation: '<img src="chart.png" alt="Revenue doubled between 2024 and 2026">',
  },
  label: {
    whyMatters:
      "A form field with no associated label gives screen-reader users no idea what to type, and gives voice-control users nothing to say when focusing the field.",
    recommendation:
      "Associate every input with a <label for> or wrap the input in a <label>; use aria-label only when a visible label genuinely is not possible.",
    implementation:
      '<label for="email">Email</label>\n<input id="email" name="email" type="email">',
  },
  "button-name": {
    whyMatters:
      "A button with no accessible name is announced as \"button\" and nothing else, so a screen-reader user cannot tell what it does before activating it.",
    recommendation:
      "Give the button visible text, or an aria-label when the control is icon-only.",
    implementation: '<button type="button" aria-label="Close dialog"><svg …></svg></button>',
  },
  "link-name": {
    whyMatters:
      "Screen-reader users often navigate by pulling up a list of links out of context. Links named \"click here\" or \"read more\" are meaningless in that list.",
    recommendation:
      "Make the link text describe its destination, or add an aria-label that does so in context.",
    implementation: '<a href="/pricing">See pricing and plans</a>',
  },
  "html-has-lang": {
    whyMatters:
      "Screen readers choose pronunciation rules from the document language; without it the page can be read in the wrong language or be unintelligible.",
    recommendation: "Set the page language on the <html> element.",
    implementation: '<html lang="en">',
  },
  "html-lang-valid": {
    whyMatters:
      "An invalid language tag is as unhelpful as a missing one: assistive technology cannot map it to a pronunciation profile.",
    recommendation: "Use a valid BCP 47 language tag.",
    implementation: '<html lang="en-GB">',
  },
  "document-title": {
    whyMatters:
      "The title is how a page is identified in browser tabs, search results and screen-reader page announcements.",
    recommendation: "Give the page a unique, descriptive <title>.",
    implementation: "<title>Checkout — Acme</title>",
  },
  "heading-order": {
    whyMatters:
      "Headings are the page outline that screen-reader users navigate by. Skipping a level makes that outline misleading.",
    recommendation: "Use heading levels in order without skipping (h1 → h2 → h3).",
    implementation: "<h2>Section</h2>\n<h3>Subsection</h3>",
  },
  "landmark-one-main": {
    whyMatters:
      "A <main> landmark is how assistive technology jumps straight to the page content instead of listening through the header on every visit.",
    recommendation: "Wrap the primary page content in a single <main> element.",
    implementation: "<main>\n  …page content…\n</main>",
  },
  region: {
    whyMatters:
      "Content outside any landmark cannot be reached by landmark navigation, so screen-reader users have to read the page linearly to find it.",
    recommendation: "Place every block of content inside a landmark such as <main>, <nav>, <header> or <footer>.",
    implementation: "<nav aria-label=\"Primary\">…</nav>",
  },
  "meta-viewport": {
    whyMatters:
      "Disabling zoom (user-scalable=no, maximum-scale=1) prevents people with low vision from enlarging the page — a barrier that no amount of good typography compensates for.",
    recommendation: "Allow zooming; never cap maximum-scale below 2 and never set user-scalable=no.",
    implementation: '<meta name="viewport" content="width=device-width, initial-scale=1">',
  },
  "frame-title": {
    whyMatters:
      "Each iframe is announced as a frame region; without a title, users cannot tell which frame contains what.",
    recommendation: "Give every iframe a title attribute describing its content.",
    implementation: '<iframe src="/video" title="Product walkthrough"></iframe>',
  },
  "duplicate-id": {
    whyMatters:
      "Duplicate ids break every mechanism that references an element by id, including label associations and aria references.",
    recommendation: "Make every id unique in the document.",
    implementation: '<input id="email-work">',
  },
};

function guidanceFor(violation: AxeViolation): RuleGuidance {
  const tailored = RULE_GUIDANCE[violation.id];
  if (tailored) return tailored;

  const reference = violation.helpUrl ? ` (${violation.helpUrl})` : "";
  return {
    whyMatters: `Automated accessibility testing flags "${violation.help}" as a definite failure. Assistive-technology users hit exactly the barrier this rule describes, and the failing element is recorded in this finding's evidence.`,
    recommendation: `${violation.help}. Work from the rule's own documentation${reference} and fix the element axe identified rather than suppressing the rule.`,
    implementation: `Correct the markup axe flagged under rule "${violation.id}". The evidence below contains the failing element's HTML and the failure summary axe produced for it.`,
  };
}

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function serializeSamples(
  nodes: AxeViolationNode[],
  maxNodes: number,
  maxHtmlLength: number,
): JsonObject[] {
  return nodes.slice(0, maxNodes).map((node) => ({
    html: truncate(node.html, maxHtmlLength),
    selector: node.target.join(" ") || null,
    failureSummary: node.failureSummary ?? null,
  }));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const AXE_FONT_WEIGHT_KEYWORDS: Record<string, number> = {
  normal: 400,
  bold: 700,
  bolder: 700,
  lighter: 300,
};

/**
 * axe's font size, as a pixel value.
 *
 * axe 4.13 reports this as a composite string — `"12.0pt (16px)"`, not
 * `"11px"` — so `parseFloat` reads the *point* number and a 16px element is
 * recorded as 12px (a 26px heading as 19px). That is not cosmetic: the size
 * decides the WCAG size class, and it becomes the fallback requirement whenever
 * axe did not state an expected ratio itself. The pixel value axe computed is
 * preferred; a pt→px conversion covers the older shape where only points are
 * given.
 */
export function parseAxeFontSize(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? round2(value) : null;
  }
  if (typeof value !== "string") return null;

  const pixels = /\(\s*([\d.]+)\s*px\s*\)/i.exec(value) ?? /([\d.]+)\s*px/i.exec(value);
  if (pixels) {
    const px = Number.parseFloat(pixels[1]);
    return Number.isFinite(px) && px > 0 ? round2(px) : null;
  }

  const points = /([\d.]+)\s*pt/i.exec(value);
  if (points) {
    const pt = Number.parseFloat(points[1]);
    // 1pt is 4/3 px in CSS's 96dpi reference pixel.
    return Number.isFinite(pt) && pt > 0 ? round2((pt * 4) / 3) : null;
  }

  const bare = Number.parseFloat(value);
  return Number.isFinite(bare) && bare > 0 ? round2(bare) : null;
}

/**
 * axe's font weight, as a number.
 *
 * axe reports a keyword — `"normal"` or `"bold"` — so `parseInt` produced NaN
 * for every real violation and the weight was dropped entirely: a bold 19px
 * heading was described as body text at weight 400, and a missing expected
 * ratio would have been derived from the wrong weight too.
 */
export function parseAxeFontWeight(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value !== "string") return null;

  const keyword = AXE_FONT_WEIGHT_KEYWORDS[value.trim().toLowerCase()];
  if (keyword !== undefined) return keyword;

  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

/**
 * The colours axe measured for a contrast violation, when it reported them.
 *
 * Kept in the same shape the native contrast rule uses (`color`, `background`,
 * `ratio`, `required`, `fontSizePx`, `fontWeight`), so one fix generator can
 * serve both engines and the report cannot describe two different pairs for the
 * same element.
 */
export function axeContrastValues(violation: AxeViolation): JsonObject | null {
  if (violation.id !== "color-contrast") return null;

  for (const node of violation.nodes ?? []) {
    for (const check of node.any ?? []) {
      const data = check.data;
      if (!data || typeof data !== "object" || Array.isArray(data)) continue;
      const record = data as Record<string, unknown>;
      const fore = typeof record.fgColor === "string" ? record.fgColor : null;
      const back = typeof record.bgColor === "string" ? record.bgColor : null;
      if (!fore || !back) continue;

      const values: JsonObject = { color: fore, background: back };
      const ratio = Number(record.contrastRatio);
      if (Number.isFinite(ratio)) values.ratio = round2(ratio);
      // axe words this as a ratio string ("4.5:1"), so it has to be read as a
      // number rather than coerced — `Number("4.5:1")` is NaN, which would
      // silently drop the bar the finding is judged against.
      const required = Number.parseFloat(String(record.expectedContrastRatio ?? ""));
      if (Number.isFinite(required)) values.required = required;
      const size = parseAxeFontSize(record.fontSize);
      if (size !== null) values.fontSizePx = size;
      const weight = parseAxeFontWeight(record.fontWeight);
      if (weight !== null) values.fontWeight = weight;
      return values;
    }
  }
  return null;
}

/**
 * Map an axe run into findings. One finding per rule, not per element: the
 * report explains the rule once and lists the occurrences as evidence.
 */
export function mapAxeViolations(
  results: AxeResults,
  options: { maxNodesPerRule?: number; maxHtmlLength?: number } = {},
): FindingDraft[] {
  const maxNodes = options.maxNodesPerRule ?? 5;
  const maxHtmlLength = options.maxHtmlLength ?? 200;
  const incompleteById = new Map<string, number>();
  for (const rule of results.incomplete ?? []) {
    incompleteById.set(rule.id, (incompleteById.get(rule.id) ?? 0) + rule.nodes.length);
  }

  return results.violations.map((violation) => {
    const isWcag = axeTagIsWcag(violation.tags);
    const severity = isWcag
      ? axeImpactToSeverity(violation.impact)
      : capSeverity(axeImpactToSeverity(violation.impact), BEST_PRACTICE_SEVERITY_CAP);

    const nodeCount = violation.nodes.length;
    const incompleteNodeCount = incompleteById.get(violation.id) ?? 0;
    const guidance = guidanceFor(violation);
    const contrastValues = axeContrastValues(violation);

    const evidence: JsonObject = {
      ruleId: violation.id,
      impact: violation.impact ?? null,
      tags: violation.tags,
      nodeCount,
      samples: serializeSamples(violation.nodes, maxNodes, maxHtmlLength),
    };
    if (violation.nodes[0]?.failureSummary) {
      evidence.failureSummary = truncate(violation.nodes[0].failureSummary, 1000);
    }
    if (incompleteNodeCount > 0) {
      // axe could not decide these elements — say so rather than hiding them.
      evidence.incompleteNodeCount = incompleteNodeCount;
    }
    if (!isWcag) {
      evidence.note = "Best-practice rule: this is not a WCAG success criterion failure.";
    }

    return {
      ruleId: `axe:${violation.id}`,
      category: axeCategory(violation),
      severity,
      title: violation.help,
      description:
        nodeCount > 0
          ? `${violation.description} axe-core found this on ${nodeCount} element${nodeCount === 1 ? "" : "s"}.`
          : `${violation.description} axe-core reported this rule as violated but named no specific element.`,
      whyMatters: guidance.whyMatters,
      recommendation: guidance.recommendation,
      implementation: guidance.implementation,
      elementSelector: violation.nodes[0]?.target.join(" ") || null,
      originalValues: {
        ruleId: violation.id,
        impact: violation.impact ?? null,
        tags: violation.tags,
        nodeCount,
        ...(contrastValues ?? {}),
      },
      // The validated colour replacement is attached by the fix generator
      // (`fixes.ts`), which re-measures any pair it proposes against the
      // contrast engine — this adapter never invents a colour.
      suggestedValues: null,
      evidence,
      wcagCriterion: isWcag ? axeWcagCriterion(violation.tags) : null,
      detectionMethod: "deterministic",
      confidence: 1,
    };
  });
}
