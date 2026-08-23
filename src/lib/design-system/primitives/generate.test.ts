import { describe, expect, it } from "vitest";
import {
  generateRadius,
  generateShadows,
  generateSpacing,
  generateTypography,
  normaliseRadiusStyle,
  normaliseTypeRatio,
} from "./generate";

describe("generateTypography", () => {
  it("bases the scale on a 1rem body size", () => {
    const type = generateTypography(1.25);
    expect(type.fontSize.base.size).toBe("1rem");
    expect(type.fontSize.base.lineHeight).toBe(1.5);
  });

  it("grows and shrinks by the requested ratio", () => {
    const type = generateTypography(1.25);
    expect(type.fontSize.lg.size).toBe("1.25rem");
    expect(type.fontSize.sm.size).toBe("0.8rem");
    const wide = generateTypography(1.333);
    expect(Number.parseFloat(wide.fontSize["4xl"].size)).toBeGreaterThan(
      Number.parseFloat(generateTypography(1.2).fontSize["4xl"].size),
    );
  });

  it("tightens line height and tracking as sizes grow", () => {
    const type = generateTypography(1.25);
    expect(type.fontSize["5xl"].lineHeight).toBeLessThan(type.fontSize.base.lineHeight);
    expect(type.fontSize["4xl"].letterSpacing).toBe("-0.02em");
  });

  it("provides system font stacks", () => {
    const type = generateTypography(1.25);
    expect(type.fontFamily.sans).toContain("system-ui");
    expect(type.fontFamily.mono).toContain("monospace");
  });
});

describe("generateSpacing", () => {
  it("uses pixel-based names over a 4px base", () => {
    const spacing = generateSpacing();
    expect(spacing["4"]).toBe("0.25rem");
    expect(spacing["8"]).toBe("0.5rem");
    expect(spacing["16"]).toBe("1rem");
    expect(spacing["96"]).toBe("6rem");
  });
});

describe("generateRadius", () => {
  it("supports sharp, soft and round styles", () => {
    expect(generateRadius("sharp").lg).toBe("0.25rem");
    expect(generateRadius("soft").lg).toBe("0.75rem");
    expect(generateRadius("round").lg).toBe("1rem");
  });

  it("always provides a full circle radius", () => {
    for (const style of ["sharp", "soft", "round"] as const) {
      expect(generateRadius(style).full).toBe("9999px");
    }
  });
});

describe("generateShadows", () => {
  it("produces an escalating neutral elevation set", () => {
    const shadows = generateShadows();
    expect(shadows.sm).toContain("0.05");
    expect(shadows.xl.length).toBeGreaterThan(shadows.sm.length);
    expect(shadows.md).not.toMatch(/#[0-9a-f]{3,6}/); // neutral, no hex colours
  });
});

describe("normalisers", () => {
  it("accepts only known ratios and styles", () => {
    expect(normaliseTypeRatio("1.25")).toBe(1.25);
    expect(normaliseTypeRatio("1.333")).toBe(1.333);
    expect(normaliseTypeRatio("7")).toBeNull();
    expect(normaliseRadiusStyle("round")).toBe("round");
    expect(normaliseRadiusStyle("blobby")).toBeNull();
  });
});
