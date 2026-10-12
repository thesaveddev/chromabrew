/**
 * Fix generation.
 *
 * A finding says what is wrong; this module says what to write instead — and
 * then checks its own suggestion the same way the finding was checked. Two
 * rules hold it together.
 *
 *   1. Nothing is invented. A colour comes from the design system's own
 *      `fixContrast` engine, which binary-searches the OKLCH lightness axis for
 *      the nearest accessible colour, and a text fix is only ever a *prefix* of
 *      the text that already exists. No copy is written on the user's behalf.
 *   2. Nothing is claimed that was not re-measured. The proposed colour is put
 *      back through the same contrast maths as the failure; if it does not clear
 *      the requirement, no fix is returned at all. A finding without a fix is
 *      honest — a fix that does not pass is worse than nothing.
 *
 * The proposal is stored on the finding as `suggestedValues.fix` (see
 * `PROPOSED_FIX_KEY`), which is the one column the Finding table already has for
 * "what the value should be". `CSS` and tokens travel inside that object rather
 * than in `cssSuggestion`/`tokenSuggestion` so the proposal cannot drift into
 * two half-populated representations.
 */

import {
  AA_NORMAL,
  contrastRatio,
  fixContrast,
  relativeLuminance,
} from "@/lib/design-system/colour/contrast";
import {
  CONTRAST_RULE_ID,
  isLargeText,
  requiredRatio,
} from "./contrast-rules";
import { sampleTextFromEvidence } from "./in-situ-sample";
import {
  META_DESCRIPTION_TARGET_LENGTH,
  META_TITLE_MAX_LENGTH,
  META_TITLE_MIN_LENGTH,
  META_TITLE_TARGET_LENGTH,
  PROPOSED_FIX_KEY,
  normalizeSampleText,
  type FindingDraft,
  type JsonObject,
  type JsonValue,
  type ProposedFixData,
} from "./types";

/** axe's own contrast rule, once the adapter has attached its measured colours. */
export const AXE_CONTRAST_RULE_ID = "axe:color-contrast";

export const META_TITLE_LENGTH_RULE_ID = "meta-title-length";
export const META_DESCRIPTION_LENGTH_RULE_ID = "meta-description-length";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function stringValue(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function numberValue(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * The measured ratio, unrounded. Contrast maths must never throw on a value that
 * came from a web page.
 *
 * Every decision in this module is taken on this number, and `round2` is applied
 * only to what is shown. Rounding first is not a display detail, it changes the
 * verdict: a pair measuring 2.9984:1 reads as "3:1", so a real 3:1 failure was
 * dismissed as "already passing" and never got a fix — while the rule that
 * raised the finding had compared the raw value and called it a failure. The
 * same rounding in the other direction would label a proposal as passing when it
 * measures just under the bar, which is the one claim this module must never
 * make.
 */
function safeRatio(foreground: string, background: string): number | null {
  try {
    const ratio = contrastRatio(foreground, background);
    return Number.isFinite(ratio) ? ratio : null;
  } catch {
    return null;
  }
}

function safeLuminance(hex: string): number | null {
  try {
    const value = relativeLuminance(hex);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Contrast                                                            */
/* ------------------------------------------------------------------ */

export interface ContrastFixInput {
  /** The measured foreground colour, as #rrggbb. */
  color: string;
  /** The measured background colour, as #rrggbb. */
  background: string;
  /** The ratio the pair has to reach: 3:1 for large text, else 4.5:1. */
  required: number;
  fontSizePx: number;
  fontWeight: number;
  /** Best-effort selector, when the finding has one. */
  selector?: string | null;
  /**
   * The element's own text, so the report can draw the before and after on the
   * words the reader sees rather than on a stand-in.
   */
  sampleText?: string | null;
}

/**
 * The nearest accessible text colour, re-measured before it is offered.
 *
 * Keeping the background is the deliberate default: it is usually a brand or
 * surface colour shared by many elements, while a muted text colour is the
 * cheapest thing to move.
 */
export function proposeContrastFix(input: ContrastFixInput): ProposedFixData | null {
  const { color, background, required, fontSizePx, fontWeight } = input;

  const beforeRatio = safeRatio(color, background);
  if (beforeRatio === null) return null;
  if (!(required > 0)) return null;
  // A pair that already meets the requirement is not a finding; proposing a
  // colour change for it would be noise.
  if (beforeRatio >= required) return null;

  const fixed = fixContrast(color, background, required);
  if (fixed.unachievable || !fixed.changed) return null;

  const afterColor = fixed.hex;
  if (afterColor.toLowerCase() === color.toLowerCase()) return null;

  // The claim and the check come from the same engine, but the check is run
  // again on the value that will actually be handed to the user.
  const afterRatio = safeRatio(afterColor, background);
  if (afterRatio === null || afterRatio < required) return null;

  const large = isLargeText(fontSizePx, fontWeight);
  const sizeClass = large ? "large" : "body";
  const selector = input.selector?.trim() ? input.selector.trim() : null;

  // Rounded for reading only: the pass/fail decision above was taken on the raw
  // values, and `after` is the same number the reader sees.
  const before = round2(beforeRatio);
  const after = round2(afterRatio);

  const rationale = `was ${color} — ${before}:1; now ${after}:1 against ${background}`;
  const declaration = `  color: ${afterColor}; /* ${rationale} */`;
  const css = selector
    ? [`${selector} {`, declaration, `}`].join("\n")
    : [`color: ${afterColor}; /* ${rationale} */`].join("\n");

  // The token is named for the role the colour plays, which is the one thing
  // this measurement genuinely knows about it: it is text, and the surface
  // behind it is light or dark.
  const luminance = safeLuminance(background);
  const onLight = luminance === null ? true : luminance > 0.5;

  return {
    kind: "contrast",
    summary:
      `Keep the background: the text colour becomes ${afterColor}, the nearest shade to ${color} that reaches ` +
      `${required}:1 on ${background}.`,
    changes: [{ property: "color", before: color, after: afterColor }],
    css,
    tokens: [{ name: onLight ? "--text-on-light" : "--text-on-dark", value: afterColor }],
    validation: {
      rule:
        `WCAG 2.2 SC 1.4.3 Contrast (Minimum), Level AA — ${required}:1 for ${sizeClass} text ` +
        `(${round2(fontSizePx)}px, weight ${fontWeight})`,
      before: `${before}:1`,
      after: `${after}:1`,
      // Decided on the raw measurement, not on the rounded figure displayed.
      passed: afterRatio >= required,
    },
    contrast: {
      foregroundBefore: color,
      foregroundAfter: afterColor,
      background,
      required,
      ratioAfter: after,
      fontSizePx: round2(fontSizePx),
      fontWeight,
      // Carried so the report can render the pair on the element's own words.
      sampleText: normalizeSampleText(input.sampleText),
    },
  };
}

/** Read a measured colour pair out of a finding and propose a fix for it. */
export function proposeContrastFixForFinding(finding: FindingDraft): ProposedFixData | null {
  const original = finding.originalValues;
  if (!original) return null;

  const color = stringValue(original.color);
  const background = stringValue(original.background);
  if (!color || !background) return null;

  const fontSizePx = numberValue(original.fontSizePx);
  const fontWeight = numberValue(original.fontWeight);
  // The ratio's bar is derived from the text size unless the rule that produced
  // the finding stated its own — so the fix is checked against the same bar the
  // finding was judged by.
  const required =
    numberValue(original.required) ??
    (fontSizePx !== null && fontWeight !== null ? requiredRatio(fontSizePx, fontWeight) : AA_NORMAL);

  return proposeContrastFix({
    color,
    background,
    required,
    fontSizePx: fontSizePx ?? 16,
    fontWeight: fontWeight ?? 400,
    selector: finding.elementSelector,
    // The finding is the only place the scanned text exists, so the fix borrows
    // it here: the report then needs no knowledge of how either engine stores it.
    sampleText: sampleTextFromEvidence(finding.evidence),
  });
}

/* ------------------------------------------------------------------ */
/* Metadata text length                                                */
/* ------------------------------------------------------------------ */

/**
 * Word-boundary trim: the result is always a prefix of the original words.
 *
 * Only separator punctuation is dropped. A sentence-ending `.` stays, because a
 * description that ends in a complete sentence reads as written, and because
 * removing it would make the result stop being a prefix of the original (the
 * check below would then reject the fix and offer the user nothing).
 */
function trimToWordBoundary(text: string, max: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  const window = collapsed.slice(0, max + 1);
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace > 0 ? window.slice(0, lastSpace) : collapsed.slice(0, max);
  return cut.replace(/[\s,;:\-–—]+$/, "");
}

/**
 * True when `candidate` is the opening words of `original`, unchanged.
 *
 * The candidate's final word may have had trailing separator punctuation
 * stripped by the trim, so that one word is compared without it — everything
 * before it must match exactly, which is what makes "no words were invented"
 * checkable rather than merely asserted.
 */
function isWordPrefixOf(original: string, candidate: string): boolean {
  const originalWords = original.replace(/\s+/g, " ").trim().split(" ");
  const candidateWords = candidate.split(" ");
  if (candidateWords.length === 0 || candidateWords.length > originalWords.length) return false;
  return candidateWords.every((word, index) => {
    const source = originalWords[index];
    if (index < candidateWords.length - 1) return word === source;
    return word === source || word === source.replace(/[\s,;:\-–—]+$/, "");
  });
}

function proposeTextLengthFix(input: {
  property: string;
  original: string;
  max: number;
  rule: string;
  context: string;
}): ProposedFixData | null {
  const original = input.original.replace(/\s+/g, " ").trim();
  if (original.length <= input.max) return null;

  const trimmed = trimToWordBoundary(original, input.max);
  // A trim that produced almost nothing, or that dropped or reordered a word,
  // is not a fix — so it is not offered.
  if (trimmed.length === 0 || trimmed.length >= original.length) return null;
  if (trimmed.split(" ").length < 3) return null;
  if (!isWordPrefixOf(original, trimmed)) return null;
  if (trimmed.length > input.max) return null;

  return {
    kind: "text_length",
    summary:
      `${input.context} The ${input.property} is shortened to ${trimmed.length} characters by dropping the ` +
      `trailing clause — every remaining word is unchanged.`,
    changes: [{ property: input.property, before: original, after: trimmed }],
    css: null,
    tokens: [],
    validation: {
      rule: input.rule,
      before: `${original.length} characters`,
      after: `${trimmed.length} characters`,
      passed: true,
    },
    contrast: null,
  };
}

export function proposeTitleFix(finding: FindingDraft): ProposedFixData | null {
  const title = stringValue(finding.originalValues?.title);
  if (!title) return null;
  return proposeTextLengthFix({
    property: "meta title",
    original: title,
    max: META_TITLE_TARGET_LENGTH,
    rule: `Title length ${META_TITLE_MIN_LENGTH}–${META_TITLE_MAX_LENGTH} characters, around ${META_TITLE_TARGET_LENGTH} before search results truncate it`,
    context:
      "This is craft guidance, not a failure: the title still has to describe the page on its own.",
  });
}

export function proposeDescriptionFix(finding: FindingDraft): ProposedFixData | null {
  const description = stringValue(finding.originalValues?.description);
  if (!description) return null;
  return proposeTextLengthFix({
    property: "meta description",
    original: description,
    max: META_DESCRIPTION_TARGET_LENGTH,
    rule: `Meta description length at most ${META_DESCRIPTION_TARGET_LENGTH} characters, where search engines truncate it`,
    context: "The first sentence is what search results show, so nothing is invented to replace it.",
  });
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                            */
/* ------------------------------------------------------------------ */

/**
 * A validated fix for this finding, or null.
 *
 * Null is a normal outcome: a rule whose content would have to be written by
 * someone (a missing title, a missing description) gets none, because the audit
 * does not write copy.
 */
export function proposeFixFor(finding: FindingDraft): ProposedFixData | null {
  if (finding.ruleId === CONTRAST_RULE_ID || finding.ruleId === AXE_CONTRAST_RULE_ID) {
    return proposeContrastFixForFinding(finding);
  }
  if (finding.ruleId === META_TITLE_LENGTH_RULE_ID) return proposeTitleFix(finding);
  if (finding.ruleId === META_DESCRIPTION_LENGTH_RULE_ID) return proposeDescriptionFix(finding);
  return null;
}

/**
 * Attach a validated fix to every finding that can have one.
 *
 * Run once, after the engines have been merged and deduplicated, so a finding
 * that survived deduplication is the one that gets fixed. Findings that already
 * carry a fix (from a rule that produced its own) are left alone.
 */
export function applyProposedFixes(findings: FindingDraft[]): FindingDraft[] {
  return findings.map((finding) => {
    if (finding.suggestedValues?.[PROPOSED_FIX_KEY]) return finding;
    const fix = proposeFixFor(finding);
    if (!fix) return finding;
    return {
      ...finding,
      suggestedValues: {
        ...(finding.suggestedValues ?? {}),
        // The object is plain JSON by construction; the cast is only needed
        // because an interface is not an index-signature type.
        [PROPOSED_FIX_KEY]: fix as unknown as JsonValue,
      } as JsonObject,
    };
  });
}
