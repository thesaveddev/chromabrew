import { describe, expect, it } from "vitest";
import { AA_LARGE, AA_NORMAL, contrastRatio } from "@/lib/design-system/colour/contrast";
import { mapAxeViolations, type AxeResults } from "./axe";
import { buildContrastFindings, requiredRatio } from "./contrast-rules";
import {
  applyProposedFixes,
  proposeContrastFix,
  proposeContrastFixForFinding,
  proposeDescriptionFix,
  proposeFixFor,
  proposeTitleFix,
} from "./fixes";
import { SAMPLE_TEXT_MAX_LENGTH, parseProposedFix, type FindingDraft, type ProposedFixData } from "./types";

function finding(overrides: Partial<FindingDraft> = {}): FindingDraft {
  return {
    ruleId: "contrast-text",
    category: "color_contrast",
    severity: "high",
    title: "Text contrast is 3:1 (needs 4.5:1)",
    description: "measured",
    whyMatters: "why",
    recommendation: "what",
    implementation: "how",
    elementSelector: "p.lede",
    originalValues: {
      color: "#777777",
      background: "#ffffff",
      ratio: 4.48,
      required: AA_NORMAL,
      fontSizePx: 16,
      fontWeight: 400,
    },
    suggestedValues: null,
    evidence: null,
    wcagCriterion: "WCAG 2.2 SC 1.4.3",
    detectionMethod: "deterministic",
    confidence: 1,
    ...overrides,
  };
}

describe("proposeContrastFix", () => {
  it("moves the text colour the minimum distance and re-measures the result", () => {
    const fix = proposeContrastFix({
      color: "#777777",
      background: "#ffffff",
      required: AA_NORMAL,
      fontSizePx: 16,
      fontWeight: 400,
      selector: "p.lede",
    });

    expect(fix).not.toBeNull();
    const contrast = fix?.contrast;
    expect(contrast?.foregroundBefore).toBe("#777777");
    expect(contrast?.background).toBe("#ffffff");

    // The claim is the fix's own evidence: the proposed colour must clear the
    // requirement when measured again, from scratch, by the same engine.
    const reMeasured = contrastRatio(fix!.contrast!.foregroundAfter, "#ffffff");
    expect(reMeasured).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrast?.ratioAfter).toBeCloseTo(Math.round(reMeasured * 100) / 100, 2);
    expect(fix?.validation.passed).toBe(true);
    expect(fix?.validation.before).toBe("4.48:1");
    expect(fix?.validation.after).toBe(`${contrast?.ratioAfter}:1`);

    // No colour is invented: the fix is a shade of the original, not a new hue.
    expect(fix?.changes).toEqual([
      { property: "color", before: "#777777", after: contrast?.foregroundAfter },
    ]);
    expect(fix?.css).toContain("p.lede");
    expect(fix?.css).toContain(contrast!.foregroundAfter);
    expect(fix?.tokens).toEqual([{ name: "--text-on-light", value: contrast?.foregroundAfter }]);
  });

  it("uses the large-text minimum when the text is large", () => {
    const fix = proposeContrastFix({
      // 2.85:1 — below the 3:1 a large heading needs, so there is something to fix.
      color: "#999999",
      background: "#ffffff",
      required: AA_LARGE,
      fontSizePx: 30,
      fontWeight: 700,
    });
    expect(fix?.contrast?.required).toBe(AA_LARGE);
    expect(fix?.validation.rule).toContain("large text");
    expect(contrastRatio(fix!.contrast!.foregroundAfter, "#ffffff")).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it("names the token for the surface the text sits on", () => {
    const onDark = proposeContrastFix({
      color: "#52525c",
      background: "#18181b",
      required: AA_NORMAL,
      fontSizePx: 11,
      fontWeight: 400,
    });
    expect(onDark?.tokens[0].name).toBe("--text-on-dark");
    expect(contrastRatio(onDark!.contrast!.foregroundAfter, "#18181b")).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("proposes nothing for a pair that already passes", () => {
    // #767676 on white is 4.54:1 — nothing to fix, so nothing is offered.
    expect(
      proposeContrastFix({
        color: "#767676",
        background: "#ffffff",
        required: AA_NORMAL,
        fontSizePx: 16,
        fontWeight: 400,
      }),
    ).toBeNull();
  });

  it("proposes nothing it cannot validate", () => {
    // Mid grey on mid grey: no lightness on this hue reaches 7:1 against a
    // background of almost the same luminance, so the honest answer is silence
    // rather than a colour that only claims to pass.
    const fix = proposeContrastFix({
      color: "#808080",
      background: "#7f7f7f",
      required: 21,
      fontSizePx: 16,
      fontWeight: 400,
    });
    expect(fix).toBeNull();
  });

  it("never returns a proposal that does not clear the requirement", () => {
    // The engine reports achievability, but the fix generator is the layer that
    // makes the user-facing claim, so it verifies the claim itself.
    for (const [color, background, required] of [
      ["#9f9fa9", "#ffffff", AA_NORMAL],
      ["#52525c", "#18181b", AA_NORMAL],
      ["#71717b", "#18181b", AA_NORMAL],
    ] as const) {
      const fix = proposeContrastFix({ color, background, required, fontSizePx: 12, fontWeight: 400 });
      expect(fix).not.toBeNull();
      expect(fix!.validation.passed).toBe(true);
      expect(fix!.validation.after).toBe(`${fix!.contrast!.ratioAfter}:1`);
      expect(fix!.contrast!.ratioAfter).toBeGreaterThanOrEqual(required);
    }
  });

  it("reads a measured pair out of a finding without inventing the bar", () => {
    const fix = proposeContrastFixForFinding(finding());
    expect(fix?.contrast?.fontSizePx).toBe(16);

    // A finding that records the size but not the requirement gets the bar its
    // size implies, so a large-text finding is not held to the body minimum.
    const large = proposeContrastFixForFinding(
      finding({
        originalValues: {
          color: "#999999",
          background: "#ffffff",
          ratio: 2.85,
          fontSizePx: 30,
          fontWeight: 700,
        },
      }),
    );
    expect(large?.contrast?.required).toBe(AA_LARGE);
  });

  it("declines findings that carry no colours", () => {
    expect(proposeContrastFixForFinding(finding({ originalValues: null }))).toBeNull();
    expect(proposeContrastFixForFinding(finding({ originalValues: { color: "#777777" } }))).toBeNull();
  });
});

describe("metadata length fixes", () => {
  it("shortens an over-long meta description to a prefix of the original words", () => {
    const original =
      "Turn one color into a complete design system: accessible palettes, semantic tokens, light and dark themes, WCAG checks, and production-ready CSS, Tailwind v4 and shadcn/ui exports. Free, no account required.";
    const fix = proposeDescriptionFix(
      finding({
        ruleId: "meta-description-length",
        originalValues: { length: original.length, description: original },
      }),
    );

    expect(fix).not.toBeNull();
    const shortened = fix!.changes[0].after;
    expect(shortened.length).toBeLessThanOrEqual(155);
    expect(shortened.length).toBeLessThan(original.length);
    // Every word kept is the original's own, in order: the audit never writes
    // copy, it only removes the end.
    expect(original.startsWith(shortened)).toBe(true);
    expect(fix!.validation.passed).toBe(true);
    expect(fix!.validation.after).toBe(`${shortened.length} characters`);
    expect(fix!.css).toBeNull();
    expect(fix!.contrast).toBeNull();
  });

  it("does not leave dangling punctuation behind", () => {
    const original = `${"alpha beta gamma delta ".repeat(8)}epsilon, zeta.`;
    const fix = proposeDescriptionFix(
      finding({ ruleId: "meta-description-length", originalValues: { length: original.length, description: original } }),
    );
    expect(fix!.changes[0].after.endsWith(",")).toBe(false);
    expect(fix!.changes[0].after.endsWith(" ")).toBe(false);
  });

  it("shortens an over-long title and declines when there is nothing to cut", () => {
    const long = "Free Color Tools — Palette Generator, Contrast Checker & More · ChromaBrew";
    const fix = proposeTitleFix(finding({ ruleId: "meta-title-length", originalValues: { title: long } }));
    expect(fix).not.toBeNull();
    expect(fix!.changes[0].after.length).toBeLessThanOrEqual(60);
    expect(long.startsWith(fix!.changes[0].after)).toBe(true);

    // A short title is a different problem, and shortening cannot solve it.
    expect(proposeTitleFix(finding({ ruleId: "meta-title-length", originalValues: { title: "Short" } }))).toBeNull();
    expect(proposeTitleFix(finding({ ruleId: "meta-title-length", originalValues: {} }))).toBeNull();
  });

  it("leaves rules it cannot fix alone", () => {
    // A missing title has to be written by a person; the audit does not invent
    // page content, so no fix is attached.
    expect(proposeFixFor(finding({ ruleId: "meta-title", originalValues: { title: null } }))).toBeNull();
    expect(proposeFixFor(finding({ ruleId: "html-lang", originalValues: { lang: null } }))).toBeNull();
  });
});

describe("axe contrast findings", () => {
  const AXE_CONTRAST: AxeResults = {
    violations: [
      {
        id: "color-contrast",
        impact: "serious",
        help: "Elements must meet minimum color contrast ratio thresholds",
        description: "Ensures the contrast between foreground and background colors meets WCAG 2 AA",
        tags: ["cat.color", "wcag2aa", "wcag143"],
        nodes: [
          {
            html: '<span class="text-[11px]">Step 1</span>',
            target: ["ol > li > span"],
            any: [
              {
                id: "color-contrast",
                data: {
                  fgColor: "#9f9fa9",
                  bgColor: "#ffffff",
                  contrastRatio: 2.62,
                  expectedContrastRatio: "4.5:1",
                  fontSize: "11px",
                  fontWeight: 600,
                },
              },
            ],
          },
        ],
      },
    ],
    testEngine: { name: "axe-core", version: "4.13.0" },
  };

  it("keeps the colours axe measured in their own palette-agnostic vocabulary", () => {
    const [finding] = mapAxeViolations(AXE_CONTRAST);
    expect(finding.originalValues).toMatchObject({
      color: "#9f9fa9",
      background: "#ffffff",
      ratio: 2.62,
      required: 4.5,
      fontSizePx: 11,
    });
  });

  it("produces a validated fix from axe's own measurement", () => {
    const findings = applyProposedFixes(mapAxeViolations(AXE_CONTRAST));
    const fix = findings[0].suggestedValues?.fix as ProposedFixData | undefined;
    expect(fix).toBeDefined();
    expect(fix!.kind).toBe("contrast");
    expect(fix!.validation.passed).toBe(true);
    expect(contrastRatio(fix!.contrast!.foregroundAfter, "#ffffff")).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("carries on when axe reported no colours at all", () => {
    const withoutData: AxeResults = {
      violations: [{ ...AXE_CONTRAST.violations[0], nodes: [{ html: "<span>x</span>", target: ["span"] }] }],
    };
    const findings = applyProposedFixes(mapAxeViolations(withoutData));
    expect(findings[0].suggestedValues?.fix).toBeUndefined();
    // The finding itself is unchanged: a missing measurement is not a fix.
    expect(findings[0].ruleId).toBe("axe:color-contrast");
  });
});

/**
 * The rounding rule, which is a correctness rule rather than a formatting one.
 *
 * The bar is a real threshold: 2.9984:1 is a failure of a 3:1 requirement, even
 * though it prints as "3:1". A fix engine that rounds before comparing gets this
 * exactly backwards — it treats the failure as already passing and offers
 * nothing, while the rule that raised the finding used the raw value.
 */
describe("the pass claim is decided on raw maths", () => {
  // Captured from the engine: 2.99839679, i.e. a genuine 3:1 failure that rounds
  // to exactly 3.00.
  const NEAR_MISS = { color: "#16a34a", background: "#f4f4f5", required: AA_LARGE };

  it("still fixes a failure that the displayed ratio rounds up to the bar", () => {
    const raw = contrastRatio(NEAR_MISS.color, NEAR_MISS.background);
    expect(raw).toBeLessThan(NEAR_MISS.required);
    expect(Math.round(raw * 100) / 100).toBe(NEAR_MISS.required);

    const fix = proposeContrastFix({ ...NEAR_MISS, fontSizePx: 26, fontWeight: 400 });
    expect(fix).not.toBeNull();
    // The reading is rounded, the verdict is not.
    expect(fix?.validation.before).toBe("3:1");
    expect(fix?.validation.passed).toBe(true);
    expect(
      contrastRatio(fix!.contrast!.foregroundAfter, NEAR_MISS.background),
    ).toBeGreaterThanOrEqual(NEAR_MISS.required);
  });

  it("offers nothing for a pair that genuinely passes", () => {
    // 4.54222496:1 — above the bar on the raw measurement.
    const raw = contrastRatio("#767676", "#ffffff");
    expect(raw).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(
      proposeContrastFix({
        color: "#767676",
        background: "#ffffff",
        required: AA_NORMAL,
        fontSizePx: 16,
        fontWeight: 400,
      }),
    ).toBeNull();
  });

  it("never labels a proposal as passing when it does not measure above the bar", () => {
    const colours = ["#777777", "#999999", "#9f9fa9", "#16a34a", "#ef4444", "#3b82f6", "#fbbf24", "#c084fc"];
    const backgrounds = ["#ffffff", "#f4f4f5", "#18181b", "#000000"];
    const sizes: ReadonlyArray<readonly [number, number]> = [
      [11, 600],
      [16, 400],
      [19, 700],
      [26, 400],
    ];

    let failures = 0;
    let fixed = 0;
    for (const color of colours) {
      for (const background of backgrounds) {
        for (const [fontSizePx, fontWeight] of sizes) {
          const required = requiredRatio(fontSizePx, fontWeight);
          const raw = contrastRatio(color, background);
          if (raw >= required) continue;
          failures += 1;

          const fix = proposeContrastFix({
            color,
            background,
            required,
            fontSizePx,
            fontWeight,
            selector: "p",
          });
          if (!fix) continue;
          fixed += 1;

          // The only thing the report may call "passing".
          const reMeasured = contrastRatio(fix.contrast!.foregroundAfter, background);
          expect(reMeasured, `${color} on ${background} at ${fontSizePx}px`).toBeGreaterThanOrEqual(required);
          expect(fix.validation.passed).toBe(true);
          // What the reader is shown must be the same measurement, rounded.
          expect(fix.validation.after).toBe(`${Math.round(reMeasured * 100) / 100}:1`);
          // The bar the fix was checked against is the bar the failure had.
          expect(fix.contrast!.required).toBe(required);
        }
      }
    }

    // Guard against a vacuous pass: the matrix has to contain real failures.
    expect(failures).toBeGreaterThan(20);
    expect(fixed).toBe(failures);
  });

  it("uses the bar axe stated, with the real size and weight in the wording", () => {
    const results: AxeResults = {
      violations: [
        {
          id: "color-contrast",
          impact: "serious",
          help: "Elements must meet minimum color contrast ratio thresholds",
          description: "contrast",
          tags: ["cat.color", "wcag2aa", "wcag143"],
          nodes: [
            {
              html: '<h2 class="title">Heading</h2>',
              target: ["h2.title"],
              any: [
                {
                  id: "color-contrast",
                  data: {
                    // Exactly what axe 4.13 sends for a 19px bold heading.
                    fgColor: "#999999",
                    bgColor: "#ffffff",
                    contrastRatio: 2.84,
                    expectedContrastRatio: "3:1",
                    fontSize: "14.3pt (19px)",
                    fontWeight: "bold",
                  },
                },
              ],
            },
          ],
        },
      ],
      testEngine: { name: "axe-core", version: "4.13.0" },
    };

    const [finding] = applyProposedFixes(mapAxeViolations(results));
    const fix = finding.suggestedValues?.fix as ProposedFixData | undefined;
    expect(fix).toBeDefined();
    expect(fix!.contrast!.required).toBe(AA_LARGE);
    expect(fix!.contrast!.fontSizePx).toBe(19);
    expect(fix!.contrast!.fontWeight).toBe(700);
    // Large text, and described as large text at its real size and weight — not
    // body text at 14px and weight 400, which is what parsing the point value
    // and dropping the keyword produced.
    expect(fix!.validation.rule).toContain("3:1 for large text");
    expect(fix!.validation.rule).toContain("19px, weight 700");
    expect(contrastRatio(fix!.contrast!.foregroundAfter, "#ffffff")).toBeGreaterThanOrEqual(AA_LARGE);
  });
});

describe("applyProposedFixes", () => {
  it("attaches a fix under the key the reader looks for", () => {
    const [fixed] = applyProposedFixes([finding()]);
    const fix = fixed.suggestedValues?.fix as ProposedFixData | undefined;
    expect(fix?.kind).toBe("contrast");
    expect(fix?.validation.passed).toBe(true);
  });

  it("leaves a finding that has no computable fix untouched", () => {
    const untouched = applyProposedFixes([finding({ ruleId: "img-alt" })]);
    expect(untouched[0].suggestedValues).toBeNull();
  });

  it("keeps the rule's own suggested values alongside the fix", () => {
    const description = `${"A sentence about colour tools. ".repeat(8)}and a final clause.`;
    const [fixed] = applyProposedFixes([
      finding({
        ruleId: "meta-description-length",
        originalValues: { length: description.length, description },
        suggestedValues: { length: "120-155 characters" },
      }),
    ]);
    expect(fixed.suggestedValues?.length).toBe("120-155 characters");
    expect(fixed.suggestedValues?.fix).toBeDefined();
  });

  it("is idempotent and never overwrites an existing fix", () => {
    const once = applyProposedFixes([finding()]);
    const twice = applyProposedFixes(once);
    expect(twice[0].suggestedValues).toEqual(once[0].suggestedValues);
  });
});

/**
 * The report draws a colour fix on the element's own words, so the fix has to
 * carry them — and those words are text lifted from someone else's page.
 */
describe("the element's own text on a colour fix", () => {
  const measured = {
    color: "#9f9fa9",
    background: "#ffffff",
    ratio: 2.62,
    required: AA_NORMAL,
    fontSizePx: 16,
    fontWeight: 400,
  };

  it("borrows the text the native contrast rule recorded", () => {
    const fix = proposeContrastFixForFinding(
      finding({
        originalValues: measured,
        evidence: { textSamples: ["Buy now"], sampleSelectors: ["p.lede"] },
      }),
    );
    expect(fix?.contrast?.sampleText).toBe("Buy now");
  });

  it("recovers it from the markup an axe finding recorded", () => {
    const fix = proposeContrastFixForFinding(
      finding({
        originalValues: measured,
        evidence: { samples: [{ html: '<p class="lede">Sign up</p>', selector: "p.lede" }] },
      }),
    );
    expect(fix?.contrast?.sampleText).toBe("Sign up");
  });

  it("carries none when the finding recorded no text, rather than inventing some", () => {
    const fix = proposeContrastFixForFinding(finding({ originalValues: measured, evidence: null }));
    expect(fix?.contrast?.sampleText).toBeNull();
  });

  it("keeps the text through the database boundary the report reads", () => {
    const fix = proposeContrastFixForFinding(
      finding({ originalValues: measured, evidence: { textSamples: ["Buy now"] } }),
    );
    expect(fix).not.toBeNull();
    const stored = JSON.parse(JSON.stringify(fix));
    expect(parseProposedFix(stored)?.contrast?.sampleText).toBe("Buy now");
  });

  it("draws on the words a real scan measured, through the rule itself", () => {
    // The end-to-end path: rendered text samples in, a fix carrying the page's
    // own words out. Nothing here is hand-built evidence.
    const findings = applyProposedFixes(
      buildContrastFindings([
        {
          selector: "p.lede",
          text: "The quick brown fox",
          color: "#9f9fa9",
          background: "#ffffff",
          backgroundSource: "element",
          fontSizePx: 16,
          fontWeight: 400,
        },
      ]),
    );

    const fix = findings[0]?.suggestedValues?.fix as ProposedFixData | undefined;
    expect(fix?.contrast?.sampleText).toBe("The quick brown fox");
    expect(fix?.contrast?.fontSizePx).toBe(16);
  });

  it("caps and cleans whatever the page actually contained", () => {
    const fix = proposeContrastFixForFinding(
      finding({
        originalValues: measured,
        evidence: { textSamples: [`  Buy\n\tnow ${"x".repeat(400)}  `] },
      }),
    );
    const text = fix?.contrast?.sampleText ?? "";
    expect(text.startsWith("Buy now xxx")).toBe(true);
    expect(text.length).toBeLessThanOrEqual(SAMPLE_TEXT_MAX_LENGTH);
    expect(text).not.toMatch(/\s{2}/);
  });
});
