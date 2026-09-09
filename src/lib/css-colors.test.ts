import { describe, expect, it } from "vitest";
import {
  closestNamedColour,
  CSS_NAMED_COLORS,
  CSS_NAMED_COLOR_COUNT,
} from "@/lib/css-colors";

describe("CSS named colours dataset", () => {
  it("contains the 148 CSS named colours", () => {
    expect(CSS_NAMED_COLOR_COUNT).toBe(148);
  });

  it("uses only valid lowercase hex values", () => {
    for (const colour of CSS_NAMED_COLORS) {
      expect(colour.name).toMatch(/^[a-z]+$/);
      expect(colour.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("has unique names and includes the alias pairs", () => {
    const names = CSS_NAMED_COLORS.map((c) => c.name);
    expect(new Set(names).size).toBe(148);
    for (const alias of ["gray", "grey", "aqua", "cyan", "fuchsia", "magenta"]) {
      expect(names).toContain(alias);
    }
    expect(names).toContain("rebeccapurple");
  });
});

describe("closestNamedColour", () => {
  it("matches exact colours with distance 0", () => {
    expect(closestNamedColour("#ff0000")?.name).toBe("red");
    expect(closestNamedColour("#ff0000")?.distance).toBeCloseTo(0, 6);
    expect(closestNamedColour("#000000")?.name).toBe("black");
    expect(closestNamedColour("#ffffff")?.name).toBe("white");
    expect(closestNamedColour("#ff6347")?.name).toBe("tomato");
  });

  it("handles mixed-case hex input", () => {
    expect(closestNamedColour("#FF0000")?.name).toBe("red");
  });

  it("returns a name with a valid hex and non-negative distance", () => {
    const result = closestNamedColour("#47003a");
    expect(result).not.toBeNull();
    expect(CSS_NAMED_COLORS.some((c) => c.hex === result?.hex)).toBe(true);
    expect(result!.distance).toBeGreaterThanOrEqual(0);
  });

  it("falls back to a sensible name for off-named colours", () => {
    // A vivid violet should land near rebeccapurple or violet, never black/white.
    const result = closestNamedColour("#7c3aed");
    expect(["rebeccapurple", "violet", "mediumpurple", "blueviolet"]).toContain(result?.name);
  });
});