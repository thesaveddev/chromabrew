import { describe, expect, it } from "vitest";
import { AA_LARGE, AA_NORMAL, contrastRatio } from "@/lib/design-system/colour/contrast";
import {
  buildContrastFindings,
  CONTRAST_RULE_ID,
  isLargeText,
  LARGE_BOLD_TEXT_PX,
  LARGE_TEXT_PX,
  measureContrast,
  requiredRatio,
} from "./contrast-rules";
import { SEVERITY_ORDER, type TextSample } from "./types";

function sample(overrides: Partial<TextSample> = {}): TextSample {
  return {
    selector: "p.lead",
    text: "Some readable body copy",
    color: "#777777",
    background: "#ffffff",
    backgroundSource: "element",
    fontSizePx: 16,
    fontWeight: 400,
    ...overrides,
  };
}

describe("WCAG large-text classification", () => {
  it("treats 24px and above as large regardless of weight", () => {
    expect(LARGE_TEXT_PX).toBe(24);
    expect(isLargeText(24, 400)).toBe(true);
    expect(isLargeText(48, 400)).toBe(true);
    expect(isLargeText(23.9, 400)).toBe(false);
  });

  it("treats 18.66px and above as large only when bold", () => {
    expect(LARGE_BOLD_TEXT_PX).toBe(18.66);
    expect(isLargeText(18.66, 700)).toBe(true);
    expect(isLargeText(18.65, 700)).toBe(false);
    expect(isLargeText(20, 700)).toBe(true);
    expect(isLargeText(20, 400)).toBe(false);
    // 600 is semibold, not the 14pt "bold" the guideline means.
    expect(isLargeText(18.66, 600)).toBe(false);
  });

  it("treats unmeasurable sizes as body text rather than guessing", () => {
    expect(isLargeText(Number.NaN, 400)).toBe(false);
    expect(requiredRatio(Number.NaN, 400)).toBe(AA_NORMAL);
  });

  it("requires 3:1 for large text and 4.5:1 otherwise", () => {
    expect(requiredRatio(16, 400)).toBe(AA_NORMAL);
    expect(requiredRatio(16, 400)).toBe(4.5);
    expect(requiredRatio(24, 400)).toBe(AA_LARGE);
    expect(requiredRatio(24, 400)).toBe(3);
    expect(requiredRatio(20, 700)).toBe(3);
  });
});

describe("measured contrast against the engine's reference values", () => {
  it("passes a pair that meets AA (#767676 on white is about 4.54:1)", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(buildContrastFindings([sample({ color: "#767676" })])).toEqual([]);
  });

  it("flags #777777 on white, which falls just short at about 4.48:1", () => {
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);

    const findings = buildContrastFindings([sample({ color: "#777777" })]);
    expect(findings).toHaveLength(1);

    const [finding] = findings;
    expect(finding.ruleId).toBe(CONTRAST_RULE_ID);
    expect(finding.category).toBe("color_contrast");
    // Measured, not judged: failing 4.5:1 by a hair is still a definite "high".
    expect(finding.severity).toBe("high");
    expect(finding.wcagCriterion).toContain("1.4.3");
    expect(finding.detectionMethod).toBe("deterministic");
    expect(finding.confidence).toBe(1);
    expect(finding.originalValues).toMatchObject({
      color: "#777777",
      background: "#ffffff",
      ratio: 4.48,
      required: 4.5,
      large: false,
      occurrences: 1,
    });
    // Colour suggestions belong to the fix stage, so nothing is invented here.
    expect(finding.suggestedValues).toBeNull();
  });

  it("passes black on white at the 21:1 extreme", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(buildContrastFindings([sample({ color: "#000000" })])).toEqual([]);
  });

  it("reports the engine's number rather than a rounded helper's", () => {
    const colour = "#8f8f8f";
    const [finding] = buildContrastFindings([sample({ color: colour })]);
    // Stored to 2dp for the report; the assertion allows for that rounding.
    expect(finding.originalValues?.ratio).toBeCloseTo(contrastRatio(colour, "#ffffff"), 1);
  });
});

describe("large text is judged against the lower threshold", () => {
  it("fails a large heading as critical when it drops below 3:1", () => {
    // #999999 on white is about 2.85:1 — below even the lenient minimum.
    expect(contrastRatio("#999999", "#ffffff")).toBeLessThan(AA_LARGE);

    const findings = buildContrastFindings([
      sample({ color: "#999999", fontSizePx: 32, fontWeight: 400, selector: "h2.section" }),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("critical");
    expect(findings[0].originalValues).toMatchObject({ required: 3, large: true });
  });

  it("passes at 3.5:1 when the text is bold and 20px, but fails when it is not bold", () => {
    const colour = "#898989";
    const ratio = contrastRatio(colour, "#ffffff");
    expect(ratio).toBeGreaterThan(AA_LARGE);
    expect(ratio).toBeLessThan(AA_NORMAL);
    expect(ratio).toBeCloseTo(3.5, 1);

    expect(
      buildContrastFindings([sample({ color: colour, fontSizePx: 20, fontWeight: 700 })]),
    ).toEqual([]);

    const findings = buildContrastFindings([
      sample({ color: colour, fontSizePx: 20, fontWeight: 400 }),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("high");
    expect(findings[0].originalValues).toMatchObject({ required: 4.5, large: false });
  });
});

describe("unmeasurable text is never reported as a failure", () => {
  it("skips text sitting on an undetermined background", () => {
    const findings = buildContrastFindings([
      sample({ background: null, backgroundSource: "unmeasurable" }),
    ]);
    expect(findings).toEqual([]);
  });

  it("skips a sample the extractor flagged as unmeasurable even if it carries a colour", () => {
    const findings = buildContrastFindings([
      sample({ background: "#ffffff", backgroundSource: "unmeasurable" }),
    ]);
    expect(findings).toEqual([]);
  });

  it("skips empty text, which has no contrast to measure", () => {
    expect(buildContrastFindings([sample({ text: "   " })])).toEqual([]);
  });

  it("skips colours that cannot be resolved instead of throwing", () => {
    const findings = buildContrastFindings([
      sample({ color: "not-a-colour" }),
      sample({ background: "oklch(0.5 0.2 20)" }),
    ]);
    expect(findings).toEqual([]);
  });

  it("counts what was and was not measured", () => {
    const summary = measureContrast([
      sample({ color: "#777777" }),
      sample({ color: "#767676" }),
      sample({ background: null, backgroundSource: "unmeasurable" }),
      sample({ text: "" }),
    ]);
    expect(summary).toEqual({ measurable: 2, unmeasurable: 2, failing: 1 });
  });
});

describe("repeated occurrences are grouped", () => {
  it("collapses one colour pair into a single finding that reports its count", () => {
    const findings = buildContrastFindings([
      sample({ selector: "p.one" }),
      sample({ selector: "p.two" }),
      sample({ selector: "p.three" }),
    ]);

    expect(findings).toHaveLength(1);
    expect(findings[0].originalValues).toMatchObject({ occurrences: 3 });
    expect(findings[0].elementSelector).toBe("p.one");
    expect(findings[0].title).toContain("3 text elements");
    expect(findings[0].evidence?.sampleSelectors).toEqual(["p.one", "p.two", "p.three"]);
    expect(findings[0].evidence?.backgroundSource).toBe("element");
  });

  it("caps the selector and text samples stored as evidence", () => {
    const many = Array.from({ length: 9 }, (_, index) => sample({ selector: `p.n${index}` }));
    const [finding] = buildContrastFindings(many);
    expect(finding.evidence?.sampleSelectors).toHaveLength(5);
    const texts = finding.evidence?.textSamples;
    expect(Array.isArray(texts)).toBe(true);
    expect((texts as unknown[]).length).toBeLessThanOrEqual(3);
  });

  it("keeps body and large text apart even for the same colours", () => {
    // 2.85:1 on white fails both thresholds, so the only thing separating these
    // two findings is the text-size class.
    const findings = buildContrastFindings([
      sample({ color: "#999999", fontSizePx: 16, fontWeight: 400 }),
      sample({ color: "#999999", fontSizePx: 24, fontWeight: 400 }),
    ]);
    expect(findings).toHaveLength(2);
    const classes = findings.map((finding) => finding.originalValues?.large).sort();
    expect(classes).toEqual([false, true]);
  });

  it("keeps different colour pairs apart", () => {
    const findings = buildContrastFindings([
      sample({ color: "#777777" }),
      sample({ color: "#888888" }),
    ]);
    expect(findings).toHaveLength(2);
  });
});

describe("output is deterministic and capped", () => {
  // 25 distinct greys, running from 4.48:1 down to about 2.4:1 on white, so the
  // set spans both the critical (below 3:1) and high (3-4.5:1) bands.
  const greys = Array.from({ length: 25 }, (_, index) => {
    const value = (0x77 + index * 2).toString(16).padStart(2, "0");
    return sample({ color: `#${value}${value}${value}`, selector: `p.g${index}` });
  });

  it("returns an identical result for identical input", () => {
    expect(buildContrastFindings(greys)).toEqual(buildContrastFindings(greys));
  });

  it("orders by severity, then by the worst ratio", () => {
    const findings = buildContrastFindings(greys);
    const severities = findings.map((finding) => SEVERITY_ORDER.indexOf(finding.severity));
    expect(severities).toEqual([...severities].sort((a, b) => a - b));

    const ratios = findings.map((finding) => Number(finding.originalValues?.ratio));
    expect(ratios).toEqual([...ratios].sort((a, b) => a - b));
    expect(findings[0].severity).toBe("critical");
  });

  it("respects the finding cap", () => {
    expect(buildContrastFindings(greys, { maxFindings: 5 })).toHaveLength(5);
    expect(buildContrastFindings(greys)).toHaveLength(20);
    expect(buildContrastFindings(greys, { maxFindings: 0 })).toEqual([]);
  });
});

describe("every finding carries usable copy", () => {
  it("fills every field the report renders", () => {
    const findings = buildContrastFindings([
      sample({ color: "#777777" }),
      sample({ color: "#999999", fontSizePx: 30, selector: "h1" }),
    ]);

    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      for (const field of [
        finding.title,
        finding.description,
        finding.whyMatters,
        finding.recommendation,
        finding.implementation,
      ]) {
        expect(field.trim().length).toBeGreaterThan(0);
      }
      expect(finding.elementSelector).toBeTruthy();
      expect(finding.implementation).toContain(finding.originalValues?.color as string);
      expect(finding.detectionMethod).toBe("deterministic");
      expect(finding.confidence).toBe(1);
    }
  });
});
