import { describe, expect, it } from "vitest";
import { deriveCompanions } from "./companions";
import { hexToRgb, oklch, rgbToOklch } from "./convert";

const HEX = /^#[0-9a-f]{6}$/;

const hue = (hex: string): number => rgbToOklch(hexToRgb(hex)).h;
const lightness = (hex: string): number => rgbToOklch(hexToRgb(hex)).l;

const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

describe("deriveCompanions", () => {
  it("is deterministic", () => {
    for (const primary of ["#dc2626", "#47003a", "#ffffff", "#000000", "#fde68a"]) {
      expect(deriveCompanions(primary)).toEqual(deriveCompanions(primary));
    }
  });

  it("emits valid lowercase hex for both companions", () => {
    for (const primary of ["#dc2626", "#47003a", "#ffffff", "#000000", "#808080", "#0ea5e9"]) {
      const { secondary, accent } = deriveCompanions(primary);
      expect(secondary).toMatch(HEX);
      expect(accent).toMatch(HEX);
      expect(secondary).not.toBe(accent);
    }
  });

  it("gives chromatic primaries companions on distant hues (split complement)", () => {
    for (const primary of ["#dc2626", "#2563eb", "#16a34a", "#ca8a04", "#7c3aed", "#0ea5e9"]) {
      const p = hue(primary);
      const { secondary, accent } = deriveCompanions(primary);
      // Clearly distinct from the primary — not a retint of it.
      expect(hueDistance(hue(secondary), p)).toBeGreaterThanOrEqual(120);
      expect(hueDistance(hue(accent), p)).toBeGreaterThanOrEqual(120);
      // And distinct from each other.
      expect(hueDistance(hue(secondary), hue(accent))).toBeGreaterThanOrEqual(45);
    }
  });

  it("responds categorically to the primary: red and blue get different companions", () => {
    const red = deriveCompanions("#dc2626");
    const blue = deriveCompanions("#2563eb");
    expect(hueDistance(hue(red.secondary), hue(blue.secondary))).toBeGreaterThanOrEqual(60);
    expect(hueDistance(hue(red.accent), hue(blue.accent))).toBeGreaterThanOrEqual(60);
  });

  it("lets achromatic light primaries borrow their personality: ink + red", () => {
    for (const primary of ["#ffffff", "#e5e5e5", "#cbd5e1"]) {
      const { secondary, accent } = deriveCompanions(primary);
      expect(lightness(secondary)).toBeLessThanOrEqual(0.35); // ink
      expect(hueDistance(hue(accent), 25)).toBeLessThanOrEqual(30); // red accent
    }
  });

  it("lets black borrow red + azure", () => {
    const { secondary, accent } = deriveCompanions("#000000");
    expect(hueDistance(hue(secondary), 25)).toBeLessThanOrEqual(30); // red secondary
    expect(hueDistance(hue(accent), 235)).toBeLessThanOrEqual(30); // azure accent
    expect(lightness(accent)).toBeGreaterThan(lightness(secondary));
  });

  it("adapts companion lightness to the primary's value", () => {
    const pale = deriveCompanions(oklch(0.86, 0.1, 120));
    expect(lightness(pale.secondary)).toBeLessThanOrEqual(0.4); // supplies depth

    const deep = deriveCompanions(oklch(0.2, 0.14, 300));
    expect(lightness(deep.secondary)).toBeGreaterThanOrEqual(0.5); // supplies lift
    expect(lightness(deep.accent)).toBeGreaterThanOrEqual(0.5);

    const mid = deriveCompanions(oklch(0.5, 0.15, 250));
    expect(lightness(mid.secondary)).toBeLessThanOrEqual(0.4); // button-like depth
    expect(lightness(mid.accent)).toBeGreaterThan(lightness(mid.secondary));
  });
});
