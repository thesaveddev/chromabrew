import { describe, expect, it } from "vitest";

import { hexToRgb, rgbToOklch } from "./convert";
import { applyRefinement, ZERO_REFINEMENT } from "./refine";

/**
 * The refinement maths, offline: contrast in particular, because it is the
 * only dial that moves a colour *relative* to perceptual mid-grey rather
 * than by an absolute amount.
 *
 * What the dial promises: positive spreads lightness away from mid (a dark
 * colour darker, a light colour lighter — punch); negative compresses toward
 * mid (muted). Zero — and the absence of the field — changes nothing, and a
 * contrast-only refinement must not be mistaken for an inert one.
 */

const lightness = (hex: string): number => rgbToOklch(hexToRgb(hex)).l;

const DARK = "#47003a"; // the default primary — clearly below mid
const LIGHT = "#fde68a"; // clearly above mid

describe("applyRefinement — contrast", () => {
  it("is a no-op at zero", () => {
    expect(applyRefinement(DARK, ZERO_REFINEMENT)).toBe(DARK);
    expect(applyRefinement(LIGHT, { ...ZERO_REFINEMENT, contrast: 0 })).toBe(LIGHT);
  });

  it("positive contrast darkens a dark colour and lightens a light one", () => {
    const r = { ...ZERO_REFINEMENT, contrast: 50 };
    expect(lightness(applyRefinement(DARK, r))).toBeLessThan(lightness(DARK));
    expect(lightness(applyRefinement(LIGHT, r))).toBeGreaterThan(lightness(LIGHT));
  });

  it("negative contrast pulls both ends toward perceptual mid-grey", () => {
    const r = { ...ZERO_REFINEMENT, contrast: -50 };
    const dark = lightness(applyRefinement(DARK, r));
    const light = lightness(applyRefinement(LIGHT, r));

    expect(dark).toBeGreaterThan(lightness(DARK));
    expect(light).toBeLessThan(lightness(LIGHT));
    expect(Math.abs(dark - 0.5)).toBeLessThan(Math.abs(lightness(DARK) - 0.5));
    expect(Math.abs(light - 0.5)).toBeLessThan(Math.abs(lightness(LIGHT) - 0.5));
  });

  it("a contrast-only refinement is not treated as inert", () => {
    expect(applyRefinement(DARK, { ...ZERO_REFINEMENT, contrast: 10 })).not.toBe(DARK);
  });

  it("stays a valid hex when combined with the other dials", () => {
    const out = applyRefinement(DARK, {
      ...ZERO_REFINEMENT,
      brightness: 30,
      contrast: 40,
      saturation: -20,
      hueShift: 45,
      temperature: 25,
    });
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("never exceeds the lightness bounds, even from an extreme start", () => {
    for (const contrast of [50, -50]) {
      for (const hex of ["#000000", "#ffffff"]) {
        const l = lightness(applyRefinement(hex, { ...ZERO_REFINEMENT, contrast }));
        expect(l).toBeGreaterThanOrEqual(0);
        expect(l).toBeLessThanOrEqual(1);
      }
    }
  });
});
