import { describe, expect, it } from "vitest";
import {
  PALETTE_STRATEGIES,
  generatePalette,
  getStrategy,
  regeneratePalette,
} from "./generate";
import { oklabDistance } from "../colour/convert";
import type { PaletteColour } from "../types";

const PRIMARY = "#47003a";

describe("palette strategies", () => {
  it("exposes the six required strategies", () => {
    expect(PALETTE_STRATEGIES.map((s) => s.id)).toEqual([
      "complementary",
      "analogous",
      "triadic",
      "split-complementary",
      "monochromatic",
      "tetradic",
    ]);
  });

  it.each(PALETTE_STRATEGIES.map((s) => [s.id]))(
    "%s produces swatches including the primary",
    (id) => {
      const palette = generatePalette(PRIMARY, id);
      expect(palette.length).toBeGreaterThanOrEqual(2);
      const primarySwatch = palette.find((p) => p.role === "Primary");
      expect(primarySwatch).toBeDefined();
      expect(oklabDistance(primarySwatch!.hex, PRIMARY)).toBeLessThan(0.01);
    },
  );

  it("complementary hue differs by ~180°", () => {
    const palette = generatePalette("#3b82f6", "complementary");
    const complement = palette.find((p) => p.role === "Complement")!;
    expect(complement).toBeDefined();
  });

  it("monochromatic stays on one hue with distinct lightness", () => {
    const palette = generatePalette("#e11d48", "monochromatic");
    const ls = palette.map((p) => p.hex);
    expect(new Set(ls).size).toBe(3);
  });

  it("respects manual overrides", () => {
    const palette = generatePalette(PRIMARY, "triadic", {
      overrides: { 1: "#123456" },
    });
    expect(palette[1].hex).toBe("#123456");
    expect(palette[1].edited).toBe(true);
  });

  it("regeneration preserves locked and edited swatches", () => {
    const previous: PaletteColour[] = generatePalette(PRIMARY, "analogous").map(
      (swatch) =>
        swatch.index === 1
          ? { ...swatch, hex: "#abcdef", edited: true }
          : swatch,
    );
    previous[2] = { ...previous[2], locked: true };
    const next = regeneratePalette("#0f4c81", "analogous", previous);
    expect(next[1].hex).toBe("#abcdef");
    expect(next[1].edited).toBe(true);
    // Locked but not edited keeps its value too.
    expect(next[2].locked).toBe(true);
  });
});

describe("getStrategy", () => {
  it("throws for unknown ids", () => {
    expect(() => getStrategy("nope" as never)).toThrow();
  });
});
