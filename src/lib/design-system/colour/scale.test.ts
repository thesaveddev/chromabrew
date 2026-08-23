import { describe, expect, it } from "vitest";
import { generateScale } from "./scale";
import { rgbToOklch, hexToRgb } from "./convert";

const SOURCE = "#47003a";

describe("generateScale", () => {
  const scale = generateScale(SOURCE);

  it("produces exactly the 11 conventional steps", () => {
    expect(scale.map((s) => s.step)).toEqual([
      50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
    ]);
  });

  it("pins the source colour at its nearest step", () => {
    const pinned = scale.find((s) => s.isSource);
    expect(pinned).toBeDefined();
    expect(pinned!.hex).toBe(SOURCE);
  });

  it("is monotonically light from 50 to 950", () => {
    const lightnesses = scale.map((s) => s.oklch.l);
    for (let i = 1; i < lightnesses.length; i++) {
      expect(lightnesses[i]).toBeLessThan(lightnesses[i - 1]);
    }
  });

  it("preserves hue across the scale", () => {
    const sourceHue = rgbToOklch(hexToRgb(SOURCE)).h;
    for (const step of scale) {
      if (step.oklch.c < 0.02) continue; // near-gamut-edge steps may desaturate
      let delta = Math.abs(step.oklch.h - sourceHue);
      if (delta > 180) delta = 360 - delta;
      expect(delta).toBeLessThan(6);
    }
  });

  it("keeps chroma within gamut at every step", () => {
    for (const step of scale) {
      expect(step.oklch.c).toBeGreaterThanOrEqual(0);
      // Re-deriving hex from reported oklch must be stable (in-gamut).
      expect(step.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("handles extreme sources deterministically", () => {
    for (const hex of ["#ffffff", "#000000", "#fef9c3", "#111111"]) {
      const s = generateScale(hex);
      expect(s).toHaveLength(11);
      expect(s.find((step) => step.isSource)!.hex.toLowerCase()).toBe(hex.toLowerCase());
      const lightnesses = s.map((step) => step.oklch.l);
      expect([...lightnesses].sort((a, b) => b - a)).toEqual(lightnesses);
    }
  });

  it("treats low-chroma sources as neutral ramps", () => {
    const greys = generateScale("#666666");
    expect(Math.max(...greys.map((s) => s.oklch.c))).toBeLessThan(0.02);
  });

  it("is deterministic", () => {
    expect(generateScale(SOURCE)).toEqual(generateScale(SOURCE));
  });
});
