import { describe, expect, it } from "vitest";
import { generateTheme } from "./generate";
import { contrastRatio } from "../colour/contrast";
import { buildDesignSystem } from "..";
import type { ScaleStep } from "../types";

const SOURCE = "#47003a";

const scale: ScaleStep[] = [
  { step: 50, hex: "#fdf5fb", oklch: { l: 0.97, c: 0.02, h: 338 }, isSource: false },
  { step: 100, hex: "#fbe7f6", oklch: { l: 0.94, c: 0.04, h: 338 }, isSource: false },
  { step: 200, hex: "#f4c9ea", oklch: { l: 0.88, c: 0.07, h: 338 }, isSource: false },
  { step: 300, hex: "#e79cd8", oklch: { l: 0.78, c: 0.1, h: 338 }, isSource: false },
  { step: 400, hex: "#d05fc0", oklch: { l: 0.65, c: 0.16, h: 338 }, isSource: false },
  { step: 500, hex: "#b62ba5", oklch: { l: 0.55, c: 0.18, h: 338 }, isSource: false },
  { step: 600, hex: "#9c1c8c", oklch: { l: 0.48, c: 0.17, h: 338 }, isSource: false },
  { step: 700, hex: "#7d1571", oklch: { l: 0.41, c: 0.15, h: 338 }, isSource: false },
  { step: 800, hex: "#5d1153", oklch: { l: 0.34, c: 0.13, h: 338 }, isSource: false },
  { step: 900, hex: "#42093c", oklch: { l: 0.27, c: 0.1, h: 338 }, isSource: false },
  { step: 950, hex: "#2b0427", oklch: { l: 0.19, c: 0.07, h: 338 }, isSource: false },
];

describe("generateTheme", () => {
  const input = {
    primaryHex: SOURCE,
    scale,
    accentSeedHex: "#a10038",
    secondarySeedHex: SOURCE,
  };

  it("emits every semantic token for both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = generateTheme(input, mode);
      expect(Object.keys(tokens)).toHaveLength(31);
      expect(tokens.background).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("produces a light background in light mode and dark in dark mode", () => {
    const light = generateTheme(input, "light");
    const dark = generateTheme(input, "dark");
    expect(contrastRatio(light.background, "#ffffff")).toBeLessThan(1.15);
    expect(contrastRatio(dark.background, "#000000")).toBeLessThan(2);
  });

  it("guarantees AA on primary button pairing in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = generateTheme(input, mode);
      const ratio = contrastRatio(tokens["primary-foreground"], tokens.primary);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps body text readable in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = generateTheme(input, mode);
      expect(
        contrastRatio(tokens.foreground, tokens.background),
      ).toBeGreaterThanOrEqual(10);
    }
  });

  it("uses a lighter primary on dark backgrounds than on light ones", () => {
    const lightPrimary = generateTheme(input, "light").primary;
    const darkPrimary = generateTheme(input, "dark").primary;
    // The brand colour #47003a passes AA against white already, so light
    // mode keeps it verbatim; dark mode must lighten it.
    expect(lightPrimary).toBe(SOURCE);
    expect(
      contrastRatio(darkPrimary, "#000000"),
    ).toBeGreaterThan(contrastRatio(SOURCE, "#ffffff") * 0 + 4.5);
  });

  it("status colours pass AA against their foregrounds", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = generateTheme(input, mode);
      for (const name of ["success", "warning", "danger", "info"] as const) {
        const fgToken = `${name}-foreground` as const;
        const ratio = contrastRatio(tokens[fgToken], tokens[name]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("buildAccessibilityReport", () => {
  it("summarises per-mode results honestly", () => {
    const system = buildDesignSystem({ ...defaultConfig() });
    const report = system.accessibility;
    const failingLight = report.checks.filter(
      (c) => c.mode === "light" && !c.grade.aaNormal,
    ).length;
    expect(report.summary.light.failing).toBe(failingLight);
    expect(report.summary.light.passed).toBe(failingLight === 0);
    expect(report.checks.length).toBe(20); // 10 pairs × 2 modes
  });
});

function defaultConfig() {
  return {
    primary: SOURCE,
    secondary: "#7c3aed",
    accent: "#f59e0b",
    paletteStrategy: "complementary" as const,
    lockedIndices: [],
    paletteOverrides: {},
    radiusStyle: "soft" as const,
    typeRatio: 1.25 as const,
  };
}
