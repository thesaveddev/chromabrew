import { describe, expect, it } from "vitest";
import {
  AA_NORMAL,
  contrastRatio,
  fixContrast,
  gradePair,
  relativeLuminance,
} from "./contrast";
import { generateScale } from "./scale";
import { toColourValue } from "./convert";

describe("WCAG contrast maths", () => {
  it("matches known reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    // #767676 is the lightest grey that passes AA on white; #777777 fails.
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
    // Spec example colour: primary #47003A on white (hand-verified ≈15.8:1).
    expect(contrastRatio("#47003a", "#ffffff")).toBeGreaterThan(14);
    expect(contrastRatio("#47003a", "#ffffff")).toBeLessThan(17);
  });

  it("is symmetric and bounded", () => {
    const ratio = contrastRatio("#0f4c81", "#e8b04b");
    expect(ratio).toBeCloseTo(contrastRatio("#e8b04b", "#0f4c81"), 10);
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThanOrEqual(21);
  });

  it("grades thresholds correctly", () => {
    const g = gradePair("#767676", "#ffffff"); // ≈ 4.54
    expect(g.aaNormal).toBe(true);
    expect(g.aaLarge).toBe(true);
    expect(g.aaaNormal).toBe(false);
    expect(g.aaaLarge).toBe(true);
    expect(AA_NORMAL).toBe(4.5);
  });
});

describe("fixContrast", () => {
  it("returns unchanged when the pair already passes", () => {
    const result = fixContrast("#000000", "#ffffff", 4.5);
    expect(result.changed).toBe(false);
    expect(result.hex).toBe("#000000");
  });

  it("darkens light colours against white while preserving hue", () => {
    const source = generateScale("#f59e0b").find((s) => s.step === 500)!.hex;
    const fixed = fixContrast(source, "#ffffff", 4.5);
    expect(fixed.ratio).toBeGreaterThanOrEqual(4.5);
    const hueBefore = toColourValue(source).oklch.h;
    const hueAfter = toColourValue(fixed.hex).oklch;
    let delta = Math.abs(hueAfter.h - hueBefore);
    if (delta > 180) delta = 360 - delta;
    expect(delta).toBeLessThan(8);
  });

  it("lightens dark colours against dark backgrounds", () => {
    const fixed = fixContrast("#1e3a8a", "#0b1020", 4.5);
    expect(fixed.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("handles near-white sources", () => {
    const fixed = fixContrast("#fafafa", "#ffffff", 3);
    expect(fixed.ratio).toBeGreaterThanOrEqual(3);
    expect(fixed.unachievable).toBe(false);
  });

  it("never returns a failing pair without flagging unachievable", () => {
    for (const [fg, bg] of [
      ["#888888", "#ffffff"],
      ["#22c55e", "#84cc16"],
      ["#f0abfc", "#faf5ff"],
    ]) {
      const fixed = fixContrast(fg, bg, 4.5);
      if (!fixed.unachievable) {
        expect(fixed.ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
