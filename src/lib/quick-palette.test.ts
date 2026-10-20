import { describe, expect, it } from "vitest";
import {
  quickPalette,
  parseQuickPalette,
  serializeQuickPalette,
  randomHex,
  applyPaletteSettings,
  DEFAULT_PALETTE_SETTINGS,
  settingsAreDefault,
} from "./quick-palette";
import { hexToRgb, rgbToOklch } from "@/lib/design-system/colour/convert";

const l = (hex: string): number => rgbToOklch(hexToRgb(hex)).l;
const c = (hex: string): number => rgbToOklch(hexToRgb(hex)).c;
const h = (hex: string): number => rgbToOklch(hexToRgb(hex)).h;
const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

describe("quick-palette", () => {
  it("generates valid hex colors at the requested size", () => {
    const palette = quickPalette(5, []);
    expect(palette).toHaveLength(5);
    for (const hex of palette) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("clamps sizes to the 2–8 range", () => {
    expect(quickPalette(1, [])).toHaveLength(2);
    expect(quickPalette(99, [])).toHaveLength(8);
  });

  it("preserves locked colors verbatim", () => {
    const palette = quickPalette(5, [null, "#ff0000", null, null, null]);
    expect(palette[1]).toBe("#ff0000");
  });

  it("round-trips through the shareable URL format", () => {
    const colors = ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"];
    const serialized = serializeQuickPalette(colors);
    expect(serialized).toBe("264653-2a9d8f-e9c46a-f4a261-e76f51");
    expect(parseQuickPalette(serialized)).toEqual(colors);
  });

  it("rejects malformed URL palettes", () => {
    expect(parseQuickPalette(null)).toBeNull();
    expect(parseQuickPalette("zzz")).toBeNull();
    expect(parseQuickPalette("ff0000")).toBeNull();
  });

  it("generates valid random hex values", () => {
    for (let i = 0; i < 20; i++) {
      expect(randomHex()).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("quickPalette anchors", () => {
  it("starts from a vivid mid-lightness anchor, never a muddy grey", () => {
    for (let run = 0; run < 12; run++) {
      const [anchor] = quickPalette(5, [], "complementary");
      // randomPleasantHex bounds: L 0.45–0.70, C ≥ 0.09 — grey or near-black
      // anchors are what made unguided shuffles look dull.
      expect(l(anchor)).toBeGreaterThanOrEqual(0.4);
      expect(l(anchor)).toBeLessThanOrEqual(0.75);
      expect(c(anchor)).toBeGreaterThanOrEqual(0.07);
    }
  });

  it("honours an explicit harmony strategy", () => {
    const mono = quickPalette(3, [], "monochromatic");
    for (let i = 1; i < mono.length; i++) {
      expect(hueDistance(h(mono[0]), h(mono[i]))).toBeLessThan(3);
    }
    const triad = quickPalette(3, [], "triadic");
    expect(hueDistance(h(triad[0]), h(triad[1]))).toBeCloseTo(120, 0);
  });
});

describe("applyPaletteSettings", () => {
  const palette = ["#6d28d9", "#dc2626", "#0ea5e9"];
  const none = [false, false, false];

  it("is a no-op at the default settings", () => {
    expect(settingsAreDefault(DEFAULT_PALETTE_SETTINGS)).toBe(true);
    expect(applyPaletteSettings(palette, none, DEFAULT_PALETTE_SETTINGS)).toEqual(
      palette,
    );
  });

  it("keeps locked colours byte-for-byte under extreme tuning", () => {
    const locked = [false, true, false];
    const out = applyPaletteSettings(palette, locked, {
      hueShift: 150,
      brightness: 100,
      vibrance: 0,
      contrast: 200,
    });
    expect(out[1]).toBe(palette[1]);
    expect(out[0]).not.toBe(palette[0]);
    expect(out[2]).not.toBe(palette[2]);
    for (const hex of out) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("brightness lifts lightness", () => {
    const out = applyPaletteSettings(palette, none, {
      ...DEFAULT_PALETTE_SETTINGS,
      brightness: 100,
    });
    out.forEach((hex, i) => expect(l(hex)).toBeGreaterThan(l(palette[i]) + 0.15));
  });

  it("contrast spreads lightness away from the palette mean", () => {
    const pair = ["#464646", "#cfcfcf"];
    const before = l(pair[1]) - l(pair[0]);
    const out = applyPaletteSettings(pair, none, {
      ...DEFAULT_PALETTE_SETTINGS,
      contrast: 180,
    });
    expect(l(out[1]) - l(out[0])).toBeGreaterThan(before * 1.5);
    expect(l(out[0])).toBeLessThan(l(pair[0]));
    expect(l(out[1])).toBeGreaterThan(l(pair[1]));
  });

  it("vibrance scales chroma", () => {
    const out = applyPaletteSettings(palette, none, {
      ...DEFAULT_PALETTE_SETTINGS,
      vibrance: 50,
    });
    out.forEach((hex, i) => expect(c(hex)).toBeLessThan(c(palette[i])));
  });

  it("hue shift rotates every unlocked colour by the same angle", () => {
    const out = applyPaletteSettings(palette, none, {
      ...DEFAULT_PALETTE_SETTINGS,
      hueShift: 120,
    });
    out.forEach((hex, i) => {
      expect(hueDistance(h(hex), (h(palette[i]) + 120) % 360)).toBeLessThan(3);
      expect(Math.abs(l(hex) - l(palette[i]))).toBeLessThan(0.02);
    });
  });
});
