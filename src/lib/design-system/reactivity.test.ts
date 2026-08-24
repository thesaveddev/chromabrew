import { describe, it, expect } from "vitest";
import { buildDesignSystem, DEFAULT_PRIMARY, ZERO_REFINEMENT } from "@/lib/design-system";
import type { GeneratorConfig } from "@/lib/design-system/types";

const base: GeneratorConfig = {
  primary: DEFAULT_PRIMARY,
  secondary: "#7c3aed",
  accent: "#f59e0b",
  paletteStrategy: "analogous",
  paletteSize: 6,
  lockedIndices: [],
  paletteOverrides: {},
  radiusStyle: "soft",
  typeRatio: 1.25,
  refinement: { ...ZERO_REFINEMENT },
  darkBackground: "tinted",
  customDarkBg: undefined,
  fontPairing: "system",
};

describe("secondary/accent reactivity", () => {
  it("changing secondary changes light theme tokens", () => {
    const a = buildDesignSystem({ ...base, secondary: "#7c3aed" });
    const b = buildDesignSystem({ ...base, secondary: "#0ea5e9" });
    expect(a.themes.light.secondary).not.toBe(b.themes.light.secondary);
    // Outputs must be visually distinct from each other and from white.
    expect(a.themes.light.secondary).not.toBe("#ffffff");
    expect(b.themes.light.secondary).not.toBe("#ffffff");
  });

  it("changing accent changes accent token", () => {
    const a = buildDesignSystem({ ...base, accent: "#f59e0b" });
    const b = buildDesignSystem({ ...base, accent: "#22c55e" });
    expect(a.themes.light.accent).not.toBe(b.themes.light.accent);
    expect(a.themes.light.accent).not.toBe("#ffffff");
    expect(b.themes.light.accent).not.toBe("#ffffff");
  });
});

describe("refinement", () => {
  it("shifts unlocked palette swatches", () => {
    const plain = buildDesignSystem(base);
    const brightened = buildDesignSystem({
      ...base,
      refinement: { ...ZERO_REFINEMENT, brightness: 20 },
    });
    const a = plain.primitives.colors.palette[1].hex;
    const b = brightened.primitives.colors.palette[1].hex;
    expect(b).not.toBe(a);
  });

  it("leaves locked swatches untouched", () => {
    const refined = buildDesignSystem({
      ...base,
      refinement: { ...ZERO_REFINEMENT, hueShift: 120 },
      lockedIndices: [2],
    });
    const unrefined = buildDesignSystem({ ...base, lockedIndices: [2] });
    expect(refined.primitives.colors.palette[2].hex).toBe(
      unrefined.primitives.colors.palette[2].hex,
    );
    // …while unlocked ones did move.
    expect(refined.primitives.colors.palette[1].hex).not.toBe(
      unrefined.primitives.colors.palette[1].hex,
    );
  });

  it("zero refinement is an exact no-op", () => {
    const a = buildDesignSystem(base);
    const b = buildDesignSystem({ ...base, refinement: { ...ZERO_REFINEMENT } });
    expect(a.themes.light.primary).toBe(b.themes.light.primary);
  });
});

describe("palette size", () => {
  it("controls generated swatch count", () => {
    for (const size of [3, 6, 10] as const) {
      const system = buildDesignSystem({ ...base, paletteSize: size });
      expect(system.primitives.colors.palette).toHaveLength(size);
    }
  });
});

describe("dark background styles", () => {
  it("solid black uses pure #000000", () => {
    const system = buildDesignSystem({ ...base, darkBackground: "solid-black" });
    expect(system.themes.dark.background).toBe("#000000");
  });

  it("custom hex is respected", () => {
    const system = buildDesignSystem({
      ...base,
      darkBackground: "custom",
      customDarkBg: "#101418",
    });
    expect(system.themes.dark.background.toLowerCase()).toBe("#101418");
  });

  it("default tinted differs from solid black", () => {
    const tinted = buildDesignSystem(base);
    expect(tinted.themes.dark.background.toLowerCase()).not.toBe("#000000");
  });
});

describe("font pairings", () => {
  it("change the heading family without touching body sizes", () => {
    const system = buildDesignSystem(base);
    const editorial = buildDesignSystem({ ...base, fontPairing: "editorial" });
    expect(editorial.primitives.typography.fontFamily.heading).not.toBe(
      system.primitives.typography.fontFamily.heading,
    );
    expect(editorial.primitives.typography.fontSize["5xl"]).toEqual(
      system.primitives.typography.fontSize["5xl"],
    );
  });

  it("system pairing keeps sans === heading", () => {
    const system = buildDesignSystem({ ...base, fontPairing: "system" });
    expect(system.primitives.typography.fontFamily.heading).toBe(
      system.primitives.typography.fontFamily.sans,
    );
  });
});
