import { describe, expect, it } from "vitest";
import {
  FALLBACK_SAMPLE_TEXT,
  IN_SITU_MAX_PX,
  IN_SITU_MIN_PX,
  inSituSample,
  sampleTextFromEvidence,
  textFromMarkup,
} from "./in-situ-sample";
import type { ProposedFixData } from "./types";

function fix(overrides: {
  fontSizePx?: number;
  fontWeight?: number;
  sampleText?: string | null;
  kind?: ProposedFixData["kind"];
  contrast?: ProposedFixData["contrast"];
} = {}): ProposedFixData {
  return {
    kind: overrides.kind ?? "contrast",
    summary: "Keep the background: the text colour becomes #595960.",
    changes: [{ property: "color", before: "#9f9fa9", after: "#595960" }],
    css: null,
    tokens: [],
    validation: { rule: "SC 1.4.3", before: "2.62:1", after: "4.62:1", passed: true },
    contrast:
      overrides.contrast === undefined
        ? {
            foregroundBefore: "#9f9fa9",
            foregroundAfter: "#595960",
            background: "#ffffff",
            required: 4.5,
            ratioAfter: 4.62,
            fontSizePx: overrides.fontSizePx ?? 16,
            fontWeight: overrides.fontWeight ?? 400,
            sampleText: overrides.sampleText === undefined ? "Buy now" : overrides.sampleText,
          }
        : overrides.contrast,
  };
}

describe("textFromMarkup", () => {
  it("recovers the words from an element's HTML", () => {
    expect(textFromMarkup('<p class="lede">Hello world</p>')).toBe("Hello world");
    expect(textFromMarkup("<span>Save</span> <b>20%</b>")).toBe("Save 20%");
  });

  it("drops script and style bodies, which were never on screen", () => {
    expect(textFromMarkup('<style>.a{color:red}</style><p>Real text</p>')).toBe("Real text");
    expect(textFromMarkup('<script>var x = "not copy";</script>Buy')).toBe("Buy");
    expect(textFromMarkup("<!-- a comment -->Visible")).toBe("Visible");
  });

  it("decodes the entities a page actually emits", () => {
    expect(textFromMarkup("<p>Tom &amp; Jerry</p>")).toBe("Tom & Jerry");
    expect(textFromMarkup("<p>a&nbsp;b</p>")).toBe("a b");
    expect(textFromMarkup("<p>&#39;quoted&#39;</p>")).toBe("'quoted'");
    expect(textFromMarkup("<p>&#x27;hex&#x27;</p>")).toBe("'hex'");
    // An entity this module does not know is left exactly as written.
    expect(textFromMarkup("<p>&weird;</p>")).toBe("&weird;");
  });

  it("collapses whitespace and returns empty rather than junk", () => {
    expect(textFromMarkup("<p>\n  spaced   out\n</p>")).toBe("spaced out");
    expect(textFromMarkup("<img src=x>")).toBe("");
    expect(textFromMarkup("")).toBe("");
  });
});

describe("sampleTextFromEvidence", () => {
  it("reads the text the native contrast rule recorded", () => {
    expect(sampleTextFromEvidence({ textSamples: ["Buy now", "Sign up"], measured: true })).toBe("Buy now");
  });

  it("skips empty samples rather than returning an unusable first entry", () => {
    expect(sampleTextFromEvidence({ textSamples: ["   ", "", "Third"] })).toBe("Third");
  });

  it("falls back to the HTML the axe adapter recorded", () => {
    const evidence = { samples: [{ html: '<p class="lede">Hello</p>', selector: "p.lede" }] };
    expect(sampleTextFromEvidence(evidence)).toBe("Hello");
  });

  it("prefers recorded text over recovered HTML", () => {
    const evidence = { textSamples: ["Direct"], samples: [{ html: "<p>Indirect</p>" }] };
    expect(sampleTextFromEvidence(evidence)).toBe("Direct");
  });

  it("returns null when a finding recorded no text at all", () => {
    expect(sampleTextFromEvidence(null)).toBeNull();
    expect(sampleTextFromEvidence({ measured: true })).toBeNull();
    expect(sampleTextFromEvidence({ samples: [{ html: "<img src=x>" }] })).toBeNull();
    expect(sampleTextFromEvidence({ samples: ["not an object"] })).toBeNull();
  });
});

describe("inSituSample", () => {
  it("draws the element's own words at the size and weight that were measured", () => {
    const sample = inSituSample(fix({ fontSizePx: 19, fontWeight: 700 }))!;
    expect(sample.text).toBe("Buy now");
    expect(sample.textKnown).toBe(true);
    expect(sample.fontSizePx).toBe(19);
    expect(sample.fontWeight).toBe(700);
    expect(sample.clamped).toBe(false);
  });

  it("carries both colours and the surface they were measured on", () => {
    const sample = inSituSample(fix())!;
    expect(sample.before).toBe("#9f9fa9");
    expect(sample.after).toBe("#595960");
    expect(sample.background).toBe("#ffffff");
  });

  it("says so when the element text was not captured", () => {
    const sample = inSituSample(fix({ sampleText: null }))!;
    expect(sample.text).toBe(FALLBACK_SAMPLE_TEXT);
    expect(sample.textKnown).toBe(false);
    // The measurement is still real even when the words are not.
    expect(sample.fontSizePx).toBe(16);
  });

  it("clamps a size that would not fit the card, and reports the measurement", () => {
    const huge = inSituSample(fix({ fontSizePx: 72 }))!;
    expect(huge.fontSizePx).toBe(IN_SITU_MAX_PX);
    expect(huge.measuredFontSizePx).toBe(72);
    expect(huge.clamped).toBe(true);

    const tiny = inSituSample(fix({ fontSizePx: 6 }))!;
    expect(tiny.fontSizePx).toBe(IN_SITU_MIN_PX);
    expect(tiny.measuredFontSizePx).toBe(6);
    expect(tiny.clamped).toBe(true);
  });

  it("falls back to a readable sample rather than emitting an invalid style", () => {
    const broken = inSituSample(
      fix({
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "#595960",
          background: "#ffffff",
          required: 4.5,
          ratioAfter: 4.62,
          fontSizePx: Number.NaN,
          fontWeight: 5000,
          sampleText: "Buy now",
        },
      }),
    )!;
    expect(broken.fontSizePx).toBe(16);
    expect(broken.clamped).toBe(false);
    expect(broken.fontWeight).toBe(400);
  });

  it("declines anything that is not a colour fix", () => {
    expect(inSituSample(fix({ kind: "text_length" }))).toBeNull();
    expect(inSituSample(fix({ contrast: null }))).toBeNull();
    expect(
      inSituSample(
        fix({
          contrast: {
            foregroundBefore: 1 as never,
            foregroundAfter: "#595960",
            background: "#ffffff",
            required: 4.5,
            ratioAfter: 4.62,
            fontSizePx: 16,
            fontWeight: 400,
            sampleText: "x",
          },
        }),
      ),
    ).toBeNull();
  });

  it("collapses a multi-line snippet into one drawn run", () => {
    const sample = inSituSample(fix({ sampleText: "  Buy\n  now  " }))!;
    expect(sample.text).toBe("Buy now");
  });
});
