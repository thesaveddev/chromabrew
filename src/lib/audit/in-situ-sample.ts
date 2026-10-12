/**
 * Rendering a proposed colour fix on the element it was measured on.
 *
 * A before/after swatch that reads "Aa" proves a ratio and nothing else. What a
 * reader actually has to judge is their own words, at their own size, in their
 * own weight, on their own surface — the combination is what decides whether a
 * 4.6:1 pair looks acceptable. This module recovers the text a finding recorded
 * and turns a fix into the numbers that render it.
 *
 * Client-safe: it imports the shared vocabulary and nothing else, so the report
 * UI can use it directly.
 */
import { normalizeSampleText, type JsonObject, type ProposedFixData } from "./types";

/** A sample is drawn at the measured size, clamped into a range that still fits a card. */
export const IN_SITU_MIN_PX = 10;
export const IN_SITU_MAX_PX = 32;

const FALLBACK_FONT_SIZE_PX = 16;
const FALLBACK_FONT_WEIGHT = 400;

/**
 * What is drawn when the element's own text was not captured.
 *
 * Deliberately a label rather than invented copy: the sample still shows the
 * real size, weight and colours, and `textKnown: false` makes the UI say the
 * text is representative instead of quoting words the page may never have had.
 */
export const FALLBACK_SAMPLE_TEXT = "Aa";

/** Named and numeric entities a stored snippet is likely to contain. */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  times: "×",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const code = entity.startsWith("#x") || entity.startsWith("#X")
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
      // An out-of-range or malformed code point is left as written rather than
      // turned into a replacement character the page never displayed.
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * The visible text of a stored markup snippet, or "".
 *
 * Records from the axe adapter keep the failing element as HTML rather than as
 * text, so the words have to be recovered. Script and style bodies are dropped
 * before tags are stripped, because their contents are code that was never on
 * screen and would otherwise become the sample.
 */
export function textFromMarkup(markup: string): string {
  if (typeof markup !== "string" || !markup) return "";
  const withoutCode = markup
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const withoutTags = withoutCode.replace(/<[^>]*>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

/**
 * The element text a finding recorded, from whichever engine produced it.
 *
 * Native contrast findings store the text directly; axe findings store the
 * element's HTML. Both are read here rather than at the call site so the two
 * engines stay behind one shape.
 */
export function sampleTextFromEvidence(evidence: JsonObject | null): string | null {
  if (!evidence) return null;

  const texts = evidence.textSamples;
  if (Array.isArray(texts)) {
    for (const value of texts) {
      const normalized = normalizeSampleText(value);
      if (normalized) return normalized;
    }
  }

  const samples = evidence.samples;
  if (Array.isArray(samples)) {
    for (const sample of samples) {
      if (!sample || typeof sample !== "object" || Array.isArray(sample)) continue;
      const html = (sample as Record<string, unknown>).html;
      const recovered = typeof html === "string" ? textFromMarkup(html) : "";
      const normalized = normalizeSampleText(recovered);
      if (normalized) return normalized;
    }
  }

  return null;
}

/** Everything the report needs to draw a fix on the element it came from. */
export interface InSituSample {
  /** The words to draw — the element's own text, or `FALLBACK_SAMPLE_TEXT`. */
  text: string;
  /** False when `text` is a stand-in rather than what the page actually showed. */
  textKnown: boolean;
  /** The size the scan measured, before any clamping. */
  measuredFontSizePx: number;
  /** The size the sample is actually drawn at. */
  fontSizePx: number;
  /** True when the sample is not at the measured size, so the caption can say so. */
  clamped: boolean;
  fontWeight: number;
  before: string;
  after: string;
  background: string;
}

/**
 * The render model for a fix, or null when it is not a colour fix.
 *
 * Every value is checked rather than trusted: this reaches the UI through stored
 * JSON, so a malformed size must degrade to a readable sample instead of an
 * invalid style.
 */
export function inSituSample(fix: ProposedFixData): InSituSample | null {
  if (fix.kind !== "contrast") return null;
  const pair = fix.contrast;
  if (!pair) return null;
  if (
    typeof pair.background !== "string" ||
    typeof pair.foregroundBefore !== "string" ||
    typeof pair.foregroundAfter !== "string"
  ) {
    return null;
  }

  const measured =
    typeof pair.fontSizePx === "number" && Number.isFinite(pair.fontSizePx) && pair.fontSizePx > 0
      ? pair.fontSizePx
      : FALLBACK_FONT_SIZE_PX;
  const fontSizePx = Math.min(IN_SITU_MAX_PX, Math.max(IN_SITU_MIN_PX, measured));

  const fontWeight =
    typeof pair.fontWeight === "number" && Number.isFinite(pair.fontWeight) &&
    pair.fontWeight >= 100 && pair.fontWeight <= 900
      ? Math.round(pair.fontWeight)
      : FALLBACK_FONT_WEIGHT;

  const text = normalizeSampleText(pair.sampleText);
  return {
    text: text ?? FALLBACK_SAMPLE_TEXT,
    textKnown: text !== null,
    measuredFontSizePx: measured,
    fontSizePx,
    clamped: fontSizePx !== measured,
    fontWeight,
    before: pair.foregroundBefore,
    after: pair.foregroundAfter,
    background: pair.background,
  };
}
