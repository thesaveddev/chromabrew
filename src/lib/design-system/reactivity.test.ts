import { describe, it, expect } from "vitest";
import { buildDesignSystem, DEFAULT_PRIMARY } from "@/lib/design-system";
import type { GeneratorConfig } from "@/lib/design-system/types";

const base: GeneratorConfig = {
  primary: DEFAULT_PRIMARY,
  secondary: "#7c3aed",
  accent: "#f59e0b",
  paletteStrategy: "analogous",
  lockedIndices: [],
  paletteOverrides: {},
  radiusStyle: "soft",
  typeRatio: 1.25,
};

describe("secondary/accent reactivity", () => {
  it("changing secondary changes light theme tokens", () => {
    const a = buildDesignSystem({ ...base, secondary: "#7c3aed" });
    const b = buildDesignSystem({ ...base, secondary: "#0ea5e9" });
    expect(a.themes.light.secondary).not.toBe(b.themes.light.secondary);
    console.log("light secondary A:", a.themes.light.secondary);
    console.log("light secondary B:", b.themes.light.secondary);
    console.log("light secondary-hover A:", a.themes.light["secondary-hover"]);
    console.log("light secondary-hover B:", b.themes.light["secondary-hover"]);
  });

  it("changing accent changes accent token", () => {
    const a = buildDesignSystem({ ...base, accent: "#f59e0b" });
    const b = buildDesignSystem({ ...base, accent: "#22c55e" });
    console.log("accent A:", a.themes.light.accent);
    console.log("accent B:", b.themes.light.accent);
    expect(a.themes.light.accent).not.toBe(b.themes.light.accent);
  });
});
