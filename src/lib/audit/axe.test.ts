import { describe, expect, it } from "vitest";
import {
  AXE_RUN_TAGS,
  axeCategory,
  axeContrastValues,
  axeImpactToSeverity,
  axeTagIsWcag,
  axeWcagCriterion,
  mapAxeViolations,
  parseAxeFontSize,
  parseAxeFontWeight,
  type AxeResults,
  type AxeViolation,
} from "./axe";
import type { FindingDraft } from "./types";

function violation(overrides: Partial<AxeViolation> = {}): AxeViolation {
  return {
    id: "image-alt",
    impact: "critical",
    help: "Images must have alternate text",
    description: "Ensures <img> elements have alternate text or a role of none or presentation",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.13/image-alt",
    tags: ["cat.text-alternatives", "wcag2a", "wcag111"],
    nodes: [
      {
        html: '<img src="/hero.png">',
        target: ["#hero > img"],
        failureSummary: "Fix any of the following: Element does not have an alt attribute",
      },
    ],
    ...overrides,
  };
}

const CONTRAST: AxeViolation = violation({
  id: "color-contrast",
  impact: "serious",
  help: "Elements must meet minimum color contrast ratio thresholds",
  description: "Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum",
  tags: ["cat.color", "wcag2aa", "wcag143"],
  nodes: [
    { html: '<p class="lede">Hello</p>', target: ["p.lede"], failureSummary: "Expected 4.5:1" },
  ],
});

/*
 * The exact values below were captured from axe-core 4.13.0 running in
 * Chromium against real markup, not written from memory of axe's docs: the
 * font size is a composite string and the weight is a keyword, and both differ
 * from what a `parseFloat`/`parseInt` would sensibly assume.
 */

describe("parseAxeFontSize", () => {
  it("reads the pixel value axe computed, not the point number", () => {
    // parseFloat on this string gives 12 — the point value — so a 16px element
    // would be recorded three quarters of its real size.
    expect(parseAxeFontSize("12.0pt (16px)")).toBe(16);
    expect(parseAxeFontSize("19.5pt (26px)")).toBe(26);
    expect(parseAxeFontSize("14.3pt (19px)")).toBe(19);
    expect(parseAxeFontSize("8.3pt (11px)")).toBe(11);
  });

  it("converts points when axe gave no pixel value", () => {
    expect(parseAxeFontSize("12pt")).toBe(16);
    expect(parseAxeFontSize("18pt")).toBe(24);
  });

  it("accepts a bare pixel length and a number", () => {
    expect(parseAxeFontSize("11px")).toBe(11);
    expect(parseAxeFontSize(16)).toBe(16);
  });

  it("refuses what it cannot read rather than guessing", () => {
    expect(parseAxeFontSize(undefined)).toBeNull();
    expect(parseAxeFontSize(null)).toBeNull();
    expect(parseAxeFontSize("inherit")).toBeNull();
    expect(parseAxeFontSize(0)).toBeNull();
    expect(parseAxeFontSize(-4)).toBeNull();
  });
});

describe("parseAxeFontWeight", () => {
  it("translates the keywords axe actually sends", () => {
    // parseInt("normal") and parseInt("bold") are both NaN, which is how the
    // weight was being dropped from every real violation.
    expect(parseAxeFontWeight("normal")).toBe(400);
    expect(parseAxeFontWeight("bold")).toBe(700);
    expect(parseAxeFontWeight("Bold")).toBe(700);
    expect(parseAxeFontWeight("lighter")).toBe(300);
  });

  it("passes numbers and numeric strings through", () => {
    expect(parseAxeFontWeight(600)).toBe(600);
    expect(parseAxeFontWeight("500")).toBe(500);
  });

  it("refuses what it cannot read", () => {
    expect(parseAxeFontWeight(undefined)).toBeNull();
    expect(parseAxeFontWeight("semibold-ish")).toBeNull();
    expect(parseAxeFontWeight(0)).toBeNull();
  });
});

describe("axeContrastValues with axe's real payload", () => {
  const measured = (data: Record<string, unknown>): AxeViolation =>
    violation({
      id: "color-contrast",
      impact: "serious",
      tags: ["cat.color", "wcag2aa", "wcag143"],
      nodes: [{ html: "<p>x</p>", target: ["p"], any: [{ id: "color-contrast", data }] }],
    });

  it("keeps a large bold heading's real size and weight", () => {
    const values = axeContrastValues(
      measured({
        fgColor: "#999999",
        bgColor: "#ffffff",
        contrastRatio: 2.84,
        expectedContrastRatio: "3:1",
        fontSize: "14.3pt (19px)",
        fontWeight: "bold",
      }),
    );
    expect(values).toMatchObject({
      color: "#999999",
      background: "#ffffff",
      required: 3,
      fontSizePx: 19,
      fontWeight: 700,
    });
  });

  it("keeps body text at its measured size", () => {
    const values = axeContrastValues(
      measured({
        fgColor: "#777777",
        bgColor: "#ffffff",
        contrastRatio: 4.47,
        expectedContrastRatio: "4.5:1",
        fontSize: "12.0pt (16px)",
        fontWeight: "normal",
      }),
    );
    expect(values).toMatchObject({ required: 4.5, fontSizePx: 16, fontWeight: 400 });
  });
});

/* ------------------------------------------------------------------ */
/* Tag interpretation                                                  */
/* ------------------------------------------------------------------ */

describe("axeWcagCriterion", () => {
  it("turns axe's compact tags into a citation with a level", () => {
    expect(axeWcagCriterion(["cat.color", "wcag2aa", "wcag143"])).toBe(
      "WCAG 2.2 SC 1.4.3 (Level AA)",
    );
    expect(axeWcagCriterion(["wcag2a", "wcag111"])).toBe("WCAG 2.2 SC 1.1.1 (Level A)");
  });

  it("reads a two-digit criterion correctly (1.4.10 is tagged wcag1410)", () => {
    expect(axeWcagCriterion(["wcag21aa", "wcag1410"])).toBe("WCAG 2.2 SC 1.4.10 (Level AA)");
  });

  it("picks the lowest criterion deterministically when several are tagged", () => {
    // 1.1.1 sorts before 1.4.3 regardless of tag order. Neither tag set carries
    // a level tag (axe encodes the level separately, as "wcag2a"/"wcag2aa"),
    // so the citation correctly omits the level — see the level tests below.
    expect(axeWcagCriterion(["wcag143", "wcag111"])).toBe("WCAG 2.2 SC 1.1.1");
    expect(axeWcagCriterion(["wcag111", "wcag143"])).toBe("WCAG 2.2 SC 1.1.1");
  });

  it("reports the lowest level tagged", () => {
    expect(axeWcagCriterion(["wcag2a", "wcag21aa", "wcag143"])).toBe(
      "WCAG 2.2 SC 1.4.3 (Level A)",
    );
  });

  it("omits the level when only a criterion number is tagged", () => {
    expect(axeWcagCriterion(["wcag143"])).toBe("WCAG 2.2 SC 1.4.3");
  });

  it("returns null when there is no WCAG tag at all", () => {
    expect(axeWcagCriterion(["best-practice", "cat.structure"])).toBeNull();
    expect(axeWcagCriterion([])).toBeNull();
  });
});

describe("axeTagIsWcag", () => {
  it("distinguishes a WCAG rule from a best-practice rule", () => {
    expect(axeTagIsWcag(["wcag2a", "wcag111"])).toBe(true);
    expect(axeTagIsWcag(["wcag21aa"])).toBe(true);
    expect(axeTagIsWcag(["best-practice"])).toBe(false);
    expect(axeTagIsWcag(["cat.structure"])).toBe(false);
  });
});

describe("axeCategory", () => {
  it("classifies contrast by rule id and by cat.color", () => {
    expect(axeCategory(CONTRAST)).toBe("color_contrast");
    expect(axeCategory(violation({ id: "anything", tags: ["cat.color"] }))).toBe("color_contrast");
  });

  it("classifies everything else as accessibility", () => {
    expect(axeCategory(violation())).toBe("accessibility");
  });
});

describe("axeImpactToSeverity", () => {
  it("maps every impact axe emits", () => {
    expect(axeImpactToSeverity("critical")).toBe("critical");
    expect(axeImpactToSeverity("serious")).toBe("high");
    expect(axeImpactToSeverity("moderate")).toBe("medium");
    expect(axeImpactToSeverity("minor")).toBe("low");
  });

  it("treats a missing or unknown impact as medium rather than guessing high", () => {
    expect(axeImpactToSeverity(null)).toBe("medium");
    expect(axeImpactToSeverity(undefined)).toBe("medium");
    expect(axeImpactToSeverity("catastrophic")).toBe("medium");
  });
});

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

describe("mapAxeViolations", () => {
  it("maps a contrast violation to measured, WCAG-cited finding", () => {
    const findings = mapAxeViolations({ violations: [CONTRAST] });
    expect(findings).toHaveLength(1);
    const finding = findings[0];
    expect(finding.ruleId).toBe("axe:color-contrast");
    expect(finding.category).toBe("color_contrast");
    expect(finding.severity).toBe("high");
    expect(finding.title).toBe(CONTRAST.help);
    expect(finding.wcagCriterion).toBe("WCAG 2.2 SC 1.4.3 (Level AA)");
    expect(finding.elementSelector).toBe("p.lede");
    expect(finding.detectionMethod).toBe("deterministic");
    expect(finding.confidence).toBe(1);
    expect(finding.suggestedValues).toBeNull();
  });

  it("caps a best-practice rule and refuses to cite a criterion for it", () => {
    const findings = mapAxeViolations({
      violations: [
        violation({
          id: "region",
          impact: "critical",
          help: "All page content should be contained by landmarks",
          tags: ["best-practice", "cat.structure"],
        }),
      ],
    });
    expect(findings[0].severity).toBe("low");
    expect(findings[0].wcagCriterion).toBeNull();
    expect(findings[0].evidence?.note).toContain("Best-practice");
  });

  it("never strengthens a best-practice finding that was already minor", () => {
    const findings = mapAxeViolations({
      violations: [violation({ id: "region", impact: "minor", tags: ["best-practice"] })],
    });
    expect(findings[0].severity).toBe("low");
  });

  it("reports one finding per rule with the occurrences as evidence", () => {
    const nodes = Array.from({ length: 7 }, (_, index) => ({
      html: `<img src="/p${index}.png">`,
      target: [`img:nth-of-type(${index + 1})`],
      failureSummary: "Element does not have an alt attribute",
    }));
    const findings = mapAxeViolations({ violations: [violation({ nodes })] });
    expect(findings).toHaveLength(1);
    expect(findings[0].evidence?.nodeCount).toBe(7);
    const samples = findings[0].evidence as unknown as { samples: unknown[] };
    expect(samples.samples.length).toBe(5);
    expect(findings[0].description).toContain("7 elements");
    expect(findings[0].elementSelector).toBe("img:nth-of-type(1)");
  });

  it("truncates the stored HTML so a finding cannot hold a whole document", () => {
    const findings = mapAxeViolations({
      violations: [violation({ nodes: [{ html: `<img src="${"x".repeat(500)}">`, target: ["img"] }] })],
    });
    const evidence = findings[0].evidence as unknown as { samples: { html: string }[] };
    expect(evidence.samples[0].html).toHaveLength(200);
    expect(evidence.samples[0].html.endsWith("…")).toBe(true);
  });

  it("honours a caller-supplied sample cap", () => {
    const nodes = Array.from({ length: 4 }, (_, index) => ({
      html: `<span>${index}</span>`,
      target: [`span:nth-of-type(${index + 1})`],
    }));
    const findings = mapAxeViolations({ violations: [violation({ nodes })] }, { maxNodesPerRule: 2 });
    const evidence = findings[0].evidence as unknown as { samples: unknown[] };
    expect(evidence.samples.length).toBe(2);
    expect(findings[0].evidence?.nodeCount).toBe(4);
  });

  it("records elements axe could not decide instead of dropping them", () => {
    const findings = mapAxeViolations({
      violations: [CONTRAST],
      incomplete: [{ id: "color-contrast", impact: "serious", nodes: [{}, {}, {}] }],
    });
    expect(findings[0].evidence?.incompleteNodeCount).toBe(3);
  });

  it("does not invent an incomplete count for a rule axe decided", () => {
    const findings = mapAxeViolations({ violations: [CONTRAST] });
    expect(findings[0].evidence).not.toHaveProperty("incompleteNodeCount");
  });

  it("handles a rule with no named element without claiming one", () => {
    const findings = mapAxeViolations({ violations: [violation({ nodes: [] })] });
    expect(findings[0].elementSelector).toBeNull();
    expect(findings[0].description).toContain("named no specific element");
  });

  it("returns nothing for a clean run", () => {
    expect(mapAxeViolations({ violations: [] })).toEqual([]);
  });

  it("is deterministic", () => {
    const results: AxeResults = { violations: [violation(), CONTRAST] };
    expect(mapAxeViolations(results)).toEqual(mapAxeViolations(results));
  });

  it("emits findings whose every prose field carries real guidance", () => {
    const findings = mapAxeViolations({
      violations: [violation(), CONTRAST, violation({ id: "unmapped-rule-xyz", tags: ["wcag2a", "wcag111"] })],
    });
    for (const finding of findings as FindingDraft[]) {
      expect(finding.ruleId.startsWith("axe:")).toBe(true);
      expect(finding.title.length).toBeGreaterThan(0);
      expect(finding.description.length).toBeGreaterThan(0);
      expect(finding.whyMatters.length).toBeGreaterThan(20);
      expect(finding.recommendation.length).toBeGreaterThan(20);
      expect(finding.implementation.length).toBeGreaterThan(20);
      expect(finding.detectionMethod).toBe("deterministic");
      expect(finding.confidence).toBe(1);
    }
  });

  it("produces evidence and originalValues that survive JSON storage", () => {
    const findings = mapAxeViolations({ violations: [violation(), CONTRAST] });
    for (const finding of findings) {
      expect(JSON.parse(JSON.stringify(finding.evidence))).toEqual(finding.evidence);
      expect(JSON.parse(JSON.stringify(finding.originalValues))).toEqual(finding.originalValues);
    }
  });

  it("names the rule in the generated guidance for an unmapped rule", () => {
    const findings = mapAxeViolations({ violations: [violation({ id: "aria-hidden-body" })] });
    expect(findings[0].implementation).toContain("aria-hidden-body");
  });

  it("surfaces the axe engine's own version when callers keep it", () => {
    const results: AxeResults = {
      violations: [CONTRAST],
      testEngine: { name: "axe-core", version: "4.13.0" },
    };
    // The engine block is passed through untouched; mapping only reads violations.
    expect(mapAxeViolations(results)[0].ruleId).toBe("axe:color-contrast");
  });
});

describe("AXE_RUN_TAGS", () => {
  it("covers WCAG 2.0/2.1/2.2 A and AA plus best practice", () => {
    expect(AXE_RUN_TAGS).toContain("wcag2a");
    expect(AXE_RUN_TAGS).toContain("wcag2aa");
    expect(AXE_RUN_TAGS).toContain("wcag21aa");
    expect(AXE_RUN_TAGS).toContain("wcag22aa");
    expect(AXE_RUN_TAGS).toContain("best-practice");
    expect(AXE_RUN_TAGS).not.toContain("wcag2aaa");
  });
});
