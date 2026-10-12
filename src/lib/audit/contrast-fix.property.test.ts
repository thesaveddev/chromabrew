import { describe, expect, it } from "vitest";
import { AA_LARGE, AA_NORMAL, contrastRatio } from "@/lib/design-system/colour/contrast";
import { requiredRatio } from "./contrast-rules";
import { proposeContrastFix } from "./fixes";
import { parseProposedFix } from "./types";

/**
 * Property test: fuzz the contrast fix over random colour pairs and font sizes.
 *
 * The example-based suites check pairs someone thought to write down. This one
 * samples the space instead, and asserts the two claims the feature rests on:
 * that a proposed colour really does clear the bar it was checked against
 * (re-measured, not merely asserted), and that the engine only stays silent when
 * silence is the honest answer.
 *
 * Deliberately no property-testing dependency: the repo has none, and a seeded
 * generator covers the ground while keeping the run reproducible. A failure here
 * names the exact inputs, so it is a bug report rather than a coin toss.
 */

/**
 * Seeded PRNG (mulberry32). `Math.random` would make a failing run unreproducible,
 * which is the one thing a fuzz test cannot afford.
 */
function makeRandom(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pair = (value: number) => value.toString(16).padStart(2, "0");
const hex = (r: number, g: number, b: number) => `#${pair(r)}${pair(g)}${pair(b)}`;

/** Anywhere in the sRGB cube, so saturated hues and near-extremes are included. */
function randomColour(random: () => number): string {
  const channel = () => Math.floor(random() * 256);
  return hex(channel(), channel(), channel());
}

/** Greys, weighted separately: that is where a bar becomes unreachable. */
function randomGrey(random: () => number): string {
  const value = Math.floor(random() * 256);
  return hex(value, value, value);
}

const FONT_SIZES_PX = [7.5, 8, 10, 11, 12, 13, 14, 16, 18, 19, 20, 24, 26, 32, 44, 64, 120];
const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

interface CaseInput {
  color: string;
  background: string;
  required: number;
  fontSizePx: number;
  fontWeight: number;
}

const describeCase = (input: CaseInput) =>
  `${input.color} on ${input.background} at ${input.fontSizePx}px/${input.fontWeight} against ${input.required}:1`;

/**
 * The highest ratio any foreground could reach on this background.
 *
 * Black and white are the luminance extremes, and contrast is monotonic in the
 * distance between the two luminances, so the maximum over the entire sRGB cube
 * is attained by one of them. That makes this an exact oracle for "no colour
 * could have passed", not an approximation.
 */
function bestPossibleRatio(background: string): number {
  return Math.max(contrastRatio("#000000", background), contrastRatio("#ffffff", background));
}

interface Sweep {
  evaluated: number;
  failures: number;
  proposed: number;
  declined: number;
  /** Proposed colours that did not re-measure above their bar. Must be empty. */
  belowBar: string[];
  /** Fixes whose declared verdict disagreed with a re-measurement. Must be empty. */
  dishonestVerdict: string[];
  /** Fixes that did not carry the bar they were judged against. Must be empty. */
  barDrift: string[];
  /** Colour fixes that arrived without the measured pair a swatch needs. Must be empty. */
  missingPair: string[];
  /** Declines where some colour would in fact have cleared the bar. Must be empty. */
  falseNegatives: string[];
  /** Declines, for the vacuity guard below. */
  confirmations: number;
  /** The closest any accepted proposal lands to its bar. */
  tightestMargin: number;
}

const SEEDS = [1, 7919, 104729, 1299709, 15485863];
const PER_SEED = 700;

function runSweep(): Sweep {
  const sweep: Sweep = {
    evaluated: 0,
    failures: 0,
    proposed: 0,
    declined: 0,
    belowBar: [],
    dishonestVerdict: [],
    barDrift: [],
    missingPair: [],
    falseNegatives: [],
    confirmations: 0,
    tightestMargin: Number.POSITIVE_INFINITY,
  };

  for (const seed of SEEDS) {
    const random = makeRandom(seed);
    for (let i = 0; i < PER_SEED; i++) {
      // Greys half the time: a pair of near-identical mid-greys is the case where
      // a high bar simply cannot be met, and a generator that never produced one
      // would let the unachievability property pass without testing anything.
      const color = random() < 0.5 ? randomGrey(random) : randomColour(random);
      const background = random() < 0.5 ? randomGrey(random) : randomColour(random);
      const fontSizePx = FONT_SIZES_PX[Math.floor(random() * FONT_SIZES_PX.length)];
      const fontWeight = FONT_WEIGHTS[Math.floor(random() * FONT_WEIGHTS.length)];

      // Real WCAG bars (3 and 4.5), the AAA bar (7, reachable through axe's
      // enhanced rule), and arbitrary bars up to the 21:1 maximum.
      const roll = random();
      const required =
        roll < 0.5
          ? requiredRatio(fontSizePx, fontWeight)
          : roll < 0.75
            ? 7
            : 1 + random() * 20;

      const input: CaseInput = { color, background, required, fontSizePx, fontWeight };
      sweep.evaluated += 1;

      // Only measured failures carry a fix; a passing pair is not a finding.
      const measured = contrastRatio(color, background);
      if (!(measured < required)) continue;
      sweep.failures += 1;

      const fix = proposeContrastFix({ ...input, selector: "p.lede" });

      if (!fix) {
        sweep.declined += 1;
        if (bestPossibleRatio(background) >= required) {
          sweep.falseNegatives.push(describeCase(input));
        } else {
          sweep.confirmations += 1;
        }
        continue;
      }

      sweep.proposed += 1;

      // Reported rather than asserted with `!`: a colour fix that arrives without
      // its measured pair is itself the failure, and a thrown TypeError would
      // bury which inputs caused it.
      const pairData = fix.contrast;
      if (!pairData) {
        sweep.missingPair.push(describeCase(input));
        continue;
      }

      // --- The claim this whole feature rests on -------------------------
      const afterRatio = contrastRatio(pairData.foregroundAfter, pairData.background);
      if (!(afterRatio >= required)) sweep.belowBar.push(describeCase(input));
      const margin = afterRatio - required;
      if (margin < sweep.tightestMargin) sweep.tightestMargin = margin;

      // --- The declared verdict must equal the re-measurement -------------
      if (fix.validation.passed !== true || fix.validation.after !== `${Math.round(afterRatio * 100) / 100}:1`) {
        sweep.dishonestVerdict.push(describeCase(input));
      }

      // --- The bar must not drift between failing and fixing --------------
      if (pairData.required !== required) sweep.barDrift.push(describeCase(input));

      // --- And it must survive the boundary the report reads --------------
      const stored = parseProposedFix(JSON.parse(JSON.stringify(fix)));
      const storedPair = stored?.contrast ?? null;
      if (!stored || !storedPair) {
        sweep.missingPair.push(`stored: ${describeCase(input)}`);
      } else if (
        stored.validation.passed !==
        (contrastRatio(storedPair.foregroundAfter, storedPair.background) >= storedPair.required)
      ) {
        sweep.dishonestVerdict.push(`stored: ${describeCase(input)}`);
      }
    }
  }

  return sweep;
}

/** Computed once, then asserted property by property. */
let cached: Sweep | null = null;
const sweepOnce = (): Sweep => (cached ??= runSweep());

describe("a proposed contrast fix, over random colour pairs and font sizes", () => {
  it("re-measures above the bar it was checked against, every time", () => {
    const sweep = sweepOnce();
    expect(sweep.belowBar).toEqual([]);
    expect(sweep.proposed).toBeGreaterThan(0);
  });

  it("lands within floating-point distance of the bar, not comfortably above it", () => {
    // Documented on purpose: the engine searches for the *nearest* passing
    // colour, so a tiny margin is the design working, not a near-miss. A margin
    // that went negative is the bug, and the property above catches that.
    const sweep = sweepOnce();
    expect(sweep.tightestMargin).toBeGreaterThanOrEqual(0);
    expect(sweep.tightestMargin).toBeLessThan(0.5);
  });

  it("declares a verdict that matches a re-measurement of the colours it shows", () => {
    const sweep = sweepOnce();
    expect(sweep.dishonestVerdict).toEqual([]);
  });

  it("hands over the same bar the failure was judged against", () => {
    const sweep = sweepOnce();
    expect(sweep.barDrift).toEqual([]);
  });

  it("always carries the measured pair, on both sides of the storage boundary", () => {
    const sweep = sweepOnce();
    expect(sweep.missingPair).toEqual([]);
  });

  it("stays silent only when no colour could have passed", () => {
    const sweep = sweepOnce();
    expect(sweep.falseNegatives).toEqual([]);
  });

  it("has actually exercised both outcomes, so neither property above is vacuous", () => {
    // Without this, a generator that produced nothing but failures the engine
    // always fixes would make the unachievability property pass by never running.
    const sweep = sweepOnce();
    expect(sweep.evaluated).toBe(SEEDS.length * PER_SEED);
    expect(sweep.failures).toBeGreaterThan(2000);
    expect(sweep.proposed).toBeGreaterThan(1500);
    expect(sweep.declined).toBeGreaterThan(500);
    expect(sweep.confirmations).toBe(sweep.declined);
  });

  it("is deterministic, so a reported failure can be reproduced", () => {
    const input = { color: "#9f9fa9", background: "#f4f4f5", required: AA_LARGE, fontSizePx: 26, fontWeight: 400 };
    expect(proposeContrastFix(input)).toEqual(proposeContrastFix(input));
  });

  it("declines a bar that is not a positive number, where silence is not a claim", () => {
    // Excluded from the sweep on purpose: with `required <= 0` every colour
    // "passes", so the unachievability oracle above would be meaningless.
    for (const required of [0, -1, Number.NaN]) {
      expect(
        proposeContrastFix({ color: "#9f9fa9", background: "#ffffff", required, fontSizePx: 16, fontWeight: 400 }),
      ).toBeNull();
    }
  });

  it("keeps the AA thresholds it is judged by honest", () => {
    expect(AA_NORMAL).toBe(4.5);
    expect(AA_LARGE).toBe(3);
    expect(requiredRatio(16, 400)).toBe(AA_NORMAL);
    expect(requiredRatio(26, 400)).toBe(AA_LARGE);
  });
});
