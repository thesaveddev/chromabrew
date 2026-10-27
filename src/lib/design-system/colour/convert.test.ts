import { describe, expect, it } from "vitest";
import {
  formatCmyk,
  formatHsl,
  formatOklch,
  formatRgb,
  hslToRgb,
  normalizeHex,
  oklabDistance,
  oklchToHex,
  parseColour,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToLab,
  rgbToOklch,
  toColourValue,
} from "./convert";
describe("hex handling", () => {
  it("normalises shorthand and longhand hex", () => {
    expect(normalizeHex("#F00")).toBe("#ff0000");
    expect(normalizeHex("47003A")).toBe("#47003a");
    expect(normalizeHex("#47003a")).toBe("#47003a");
    expect(normalizeHex("nope")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
  });
});

describe("hsv and lab conversions", () => {
  it("converts pure red to HSB(0, 100, 100)", () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, v: 100 });
  });

  it("maps greys to zero saturation with value tracking lightness", () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, v: 0 });
    expect(rgbToHsv({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, v: 100 });
  });

  it("matches the published LAB breakdown of #B57F50", () => {
    const lab = rgbToLab({ r: 181, g: 127, b: 80 });
    expect(lab.l).toBeCloseTo(58, 0);
    expect(lab.a).toBeCloseTo(16, 0);
    expect(lab.b).toBeCloseTo(34, 0);
  });

  it("anchors LAB at black and white", () => {
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 1);
    const white = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(white.l).toBeCloseTo(100, 1);
    expect(Math.abs(white.a)).toBeLessThan(0.01);
    expect(Math.abs(white.b)).toBeLessThan(0.01);
  });
});

describe("cmyk conversion", () => {
  it("converts #47003a to the expected ink percentages", () => {
    const cmyk = rgbToCmyk({ r: 71, g: 0, b: 58 });
    expect(cmyk.c).toBeCloseTo(0, 1);
    expect(cmyk.m).toBeCloseTo(100, 1);
    expect(cmyk.y).toBeCloseTo(18.3, 1);
    expect(cmyk.k).toBeCloseTo(72.2, 1);
  });

  it("white is zero ink and black is 100% key", () => {
    expect(rgbToCmyk({ r: 255, g: 255, b: 255 })).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgbToCmyk({ r: 0, g: 0, b: 0 })).toEqual({ c: 0, m: 0, y: 0, k: 100 });
  });

  it("pure red and pure green stay in their channels", () => {
    const red = rgbToCmyk({ r: 255, g: 0, b: 0 });
    expect(red).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    const green = rgbToCmyk({ r: 0, g: 255, b: 0 });
    expect(green).toEqual({ c: 100, m: 0, y: 100, k: 0 });
  });

  it("formats as percent cmyk()", () => {
    expect(formatCmyk(rgbToCmyk({ r: 71, g: 0, b: 58 }))).toMatch(/^cmyk\(/,);
  });
});

describe("rgb/hsl conversions", () => {
  it("converts pure red", () => {
    const hex = "#ff0000";
    const rgb = { r: 255, g: 0, b: 0 };
    expect(rgbToHex(rgb)).toBe(hex);
    expect(rgbToHsl(rgb)).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual(rgb);
  });

  it("round-trips arbitrary colours within rounding error", () => {
    for (const [r, g, b] of [
      [71, 0, 58],
      [15, 76, 129],
      [240, 240, 9],
      [128, 128, 128],
      [12, 200, 144],
    ]) {
      const rgb = { r, g, b };
      const hsl = rgbToHsl(rgb);
      const back = hslToRgb(hsl);
      expect(Math.round(back.r)).toBeCloseTo(r, 0);
      expect(Math.round(back.g)).toBeCloseTo(g, 0);
      expect(Math.round(back.b)).toBeCloseTo(b, 0);
    }
  });

  it("formats values for display", () => {
    const value = toColourValue("#47003a");
    expect(formatRgb(value.rgb)).toBe("rgb(71, 0, 58)");
    expect(formatHsl(value.hsl)).toMatch(/^hsl\(\d+(\.\d+)?, 100%, 14(\.\d+)?%\)$/);
  });
});

describe("OKLCH conversions", () => {
  it("matches reference values for pure red", () => {
    const { l, c, h } = rgbToOklch({ r: 255, g: 0, b: 0 });
    expect(l).toBeCloseTo(0.6279, 3);
    expect(c).toBeCloseTo(0.2577, 3);
    expect(h).toBeCloseTo(29.23, 1);
  });

  it("maps white/black/grey to zero chroma", () => {
    expect(rgbToOklch({ r: 255, g: 255, b: 255 }).l).toBeCloseTo(1, 3);
    expect(rgbToOklch({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 3);
    expect(rgbToOklch({ r: 120, g: 120, b: 120 }).c).toBeLessThan(0.001);
  });

  it("round-trips through oklchToHex within visible tolerance", () => {
    for (const hex of ["#47003a", "#0f4c81", "#e8b04b", "#22c55e"]) {
      const value = toColourValue(hex);
      const back = oklchToHex(value.oklch);
      // Round trip may differ by at most ~2/255 per channel due to
      // quantisation; perceptually identical.
      expect(oklabDistance(back, hex)).toBeLessThan(0.01);
    }
  });

  it("gamut-maps impossible chroma instead of shifting hue", () => {
    const hex = oklchToHex({ l: 0.95, c: 0.4, h: 145 });
    const back = toColourValue(hex).oklch;
    expect(back.l).toBeCloseTo(0.95, 2);
    expect(back.c).toBeLessThan(0.4);
  });

  it("formats OKLCH for display", () => {
    const formatted = formatOklch(toColourValue("#47003a").oklch);
    expect(formatted).toMatch(/^oklch\(0\.27\d? 0\.11\d? 337\.\d\)$/);
  });
});

describe("parseColour", () => {
  it("accepts hex, rgb() and hsl() input", () => {
    expect(parseColour("#47003A")).toBe("#47003a");
    expect(parseColour("rgb(71, 0, 58)")).toBe("#47003a");
    // HSL round-trips through its own formatting (quantisation-tolerant).
    const value = toColourValue("#47003a");
    const hslString = formatHsl(value.hsl).replace(/,\s+/g, ", ");
    expect(parseColour(hslString)).not.toBeNull();
    expect(oklabDistance(parseColour(hslString)!, "#47003a")).toBeLessThan(0.005);
  });

  it("rejects malformed or out-of-range input", () => {
    expect(parseColour("hello")).toBeNull();
    expect(parseColour("")).toBeNull();
    expect(parseColour("rgb(300, 0, 0)")).toBeNull();
    expect(parseColour("hsl(10, 200%, 50%)")).toBeNull();
  });
});
