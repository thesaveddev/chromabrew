import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/design-system/colour/contrast";
import {
  PROPOSED_FIX_KEY,
  SAMPLE_TEXT_MAX_LENGTH,
  parseProposedFix,
  type ProposedFixData,
} from "./types";

/**
 * A colour fix as it was written to the database, with the fields the badge
 * depends on left open so a test can dictate them.
 */
function storedFix(overrides: Partial<ProposedFixData> = {}): ProposedFixData {
  return {
    kind: "contrast",
    summary: "Keep the background: the text colour becomes #595960.",
    changes: [{ property: "color", before: "#9f9fa9", after: "#595960" }],
    css: "p { color: #595960; }",
    tokens: [{ name: "--text-on-light", value: "#595960" }],
    validation: {
      rule: "WCAG 2.2 SC 1.4.3 Contrast (Minimum), Level AA — 4.5:1 for body text (16px, weight 400)",
      before: "2.62:1",
      after: "4.62:1",
      passed: true,
    },
    contrast: {
      foregroundBefore: "#9f9fa9",
      foregroundAfter: "#595960",
      background: "#ffffff",
      required: 4.5,
      ratioAfter: 4.62,
      fontSizePx: 16,
      fontWeight: 400,
      sampleText: "Buy now",
    },
    ...overrides,
  };
}

/** The one thing the report may call "Verified". */
function measuresAsVerified(fix: ProposedFixData): boolean {
  const pair = fix.contrast!;
  return contrastRatio(pair.foregroundAfter, pair.background) >= pair.required;
}

describe("parseProposedFix", () => {
  it("re-measures a stored pass and keeps it when the colours still clear the bar", () => {
    const fix = parseProposedFix(storedFix());
    expect(fix).not.toBeNull();
    expect(fix!.validation.passed).toBe(true);
    expect(measuresAsVerified(fix!)).toBe(true);
    // What the reader sees is the re-measurement, not the stored figure.
    const raw = contrastRatio("#595960", "#ffffff");
    expect(fix!.validation.after).toBe(`${Math.round(raw * 100) / 100}:1`);
    expect(fix!.contrast!.ratioAfter).toBe(Math.round(raw * 100) / 100);
  });

  it("refuses a stored pass whose colours do not clear the bar", () => {
    // A row written by an older engine, or edited: the swatches above the badge
    // would visibly fail while the badge claimed "Verified".
    const fix = parseProposedFix(
      storedFix({
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "#9f9fa9",
          background: "#ffffff",
          required: 4.5,
          ratioAfter: 4.62,
          fontSizePx: 16,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(fix!.validation.passed).toBe(false);
    expect(fix!.validation.after).toBe("2.62:1");
  });

  it("decides on the raw measurement, not the figure it displays", () => {
    // 2.99839679:1 against a 3:1 bar — a real failure that rounds to 3.00.
    const raw = contrastRatio("#16a34a", "#f4f4f5");
    expect(raw).toBeLessThan(3);
    expect(Math.round(raw * 100) / 100).toBe(3);

    const fix = parseProposedFix(
      storedFix({
        validation: { rule: "SC 1.4.3", before: "1.9:1", after: "3:1", passed: true },
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "#16a34a",
          background: "#f4f4f5",
          required: 3,
          ratioAfter: 3,
          fontSizePx: 26,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(fix!.validation.after).toBe("3:1");
    expect(fix!.validation.passed).toBe(false);
  });

  it("never calls a colour fix verified when its pair cannot be measured", () => {
    const unmeasurable = parseProposedFix(
      storedFix({
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "currentColor",
          background: "#ffffff",
          required: 4.5,
          ratioAfter: 4.62,
          fontSizePx: 16,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(unmeasurable!.validation.passed).toBe(false);

    const missingPair = parseProposedFix(storedFix({ contrast: null }));
    expect(missingPair!.validation.passed).toBe(false);

    const missingBar = parseProposedFix(
      storedFix({
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "#595960",
          background: "#ffffff",
          required: Number.NaN,
          ratioAfter: 4.62,
          fontSizePx: 16,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(missingBar!.validation.passed).toBe(false);
  });

  it("leaves a text-length fix alone, since it makes no colour claim", () => {
    const fix = parseProposedFix(
      storedFix({
        kind: "text_length",
        contrast: null,
        changes: [{ property: "description", before: "long", after: "short" }],
        validation: { rule: "120-155 characters", before: "210", after: "150", passed: true },
      }),
    );
    expect(fix!.validation.passed).toBe(true);
    expect(fix!.validation.after).toBe("150");
  });

  it("still rejects JSON that is not a fix at all", () => {
    expect(parseProposedFix(null)).toBeNull();
    expect(parseProposedFix(undefined)).toBeNull();
    expect(parseProposedFix("fix")).toBeNull();
    expect(parseProposedFix([])).toBeNull();
    expect(parseProposedFix({})).toBeNull();
    expect(parseProposedFix(storedFix({ kind: "other" as never }))).toBeNull();
    expect(parseProposedFix(storedFix({ changes: [] }))).toBeNull();
    expect(parseProposedFix(storedFix({ validation: undefined as never }))).toBeNull();
  });

  it("satisfies the label's contract over the whole stored-value space", () => {
    const forwards = ["#9f9fa9", "#595960", "#16a34a", "#16a34a", "#777777", "#000000"];
    const backgrounds = ["#ffffff", "#f4f4f5", "#18181b", "#000000"];
    const bars = [3, 4.5, 7];

    for (const foregroundAfter of forwards) {
      for (const background of backgrounds) {
        for (const required of bars) {
          // Whatever the stored flag said — including a flat lie — the parsed
          // fix must be labelled verified only when it measures as verified.
          for (const storedPassed of [true, false]) {
            const fix = parseProposedFix(
              storedFix({
                validation: { rule: "SC 1.4.3", before: "1:1", after: "9:1", passed: storedPassed },
                contrast: {
                  foregroundBefore: "#9f9fa9",
                  foregroundAfter,
                  background,
                  required,
                  ratioAfter: 9,
                  fontSizePx: 16,
                  fontWeight: 400,
                  sampleText: null,
                },
              }),
            );
            expect(fix).not.toBeNull();
            expect(fix!.validation.passed, `${foregroundAfter} on ${background} vs ${required}:1`).toBe(
              measuresAsVerified(fix!),
            );
          }
        }
      }
    }
  });

  it("keeps the element's own text across the boundary, cleaned and capped", () => {
    // The report draws the fix on these words, so they must survive storage —
    // and a snippet of a scanned page must not arrive unbounded or as a number.
    expect(parseProposedFix(storedFix())?.contrast?.sampleText).toBe("Buy now");

    const withPair = (sampleText: unknown) =>
      parseProposedFix(
        storedFix({ contrast: { ...storedFix().contrast!, sampleText: sampleText as string } }),
      )?.contrast?.sampleText;

    expect(withPair("  Save\n\t20%  ")).toBe("Save 20%");
    expect(withPair("   ")).toBeNull();
    expect(withPair(undefined)).toBeNull();
    expect(withPair(42)).toBeNull();
    expect(withPair("x".repeat(400))).toHaveLength(SAMPLE_TEXT_MAX_LENGTH);
  });

  it("reads a fix out of the key the writer stores it under", () => {
    expect(PROPOSED_FIX_KEY).toBe("fix");
  });
});
