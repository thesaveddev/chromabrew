import { describe, expect, it } from "vitest";
import {
  extractBriefHues,
  hslToHex,
  suggestPalettes,
} from "./palette-suggest";

describe("hslToHex", () => {
  it("converts primary hues to hex", () => {
    expect(hslToHex(0, 100, 50)).toBe("#ff0000");
    expect(hslToHex(120, 100, 50)).toBe("#00ff00");
    expect(hslToHex(240, 100, 50)).toBe("#0000ff");
  });

  it("wraps out-of-range hues", () => {
    expect(hslToHex(360 + 0, 100, 50)).toBe(hslToHex(0, 100, 50));
    expect(hslToHex(-120, 100, 50)).toBe(hslToHex(240, 100, 50));
  });
});

describe("extractBriefHues", () => {
  it("maps keywords and dedupes repeat mentions", () => {
    const { hues, matchedKeywords } = extractBriefHues("luxury coffee brand coffee");
    expect(matchedKeywords).toEqual(["luxury", "coffee"]);
    expect(hues.length).toBeGreaterThan(0);
  });

  it("falls back to a hashed hue with no matches", () => {
    const { hues, matchedKeywords } = extractBriefHues("xqzt blorpt");
    expect(matchedKeywords).toEqual([]);
    expect(hues).toHaveLength(1);
    expect(hues[0]).toBeGreaterThanOrEqual(0);
    expect(hues[0]).toBeLessThan(360);
  });
});

describe("suggestPalettes", () => {
  it("returns one suggestion per strategy with valid primaries", () => {
    const suggestions = suggestPalettes("luxury coffee brand");
    expect(suggestions).toHaveLength(5);
    expect(suggestions.map((s) => s.strategy)).toEqual([
      "complementary",
      "analogous",
      "triadic",
      "split-complementary",
      "monochromatic",
    ]);
    for (const s of suggestions) {
      expect(s.primary).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("explains the logic with the matched keywords", () => {
    const suggestions = suggestPalettes("luxury coffee brand");
    for (const s of suggestions) {
      expect(s.matchedKeywords).toContain("coffee");
      expect(s.rationale).toContain("coffee");
      expect(s.rationale.length).toBeGreaterThan(40);
    }
    // Each strategy justifies itself differently.
    const rationales = new Set(suggestions.map((s) => s.rationale));
    expect(rationales.size).toBe(5);
  });

  it("is honest when nothing matches", () => {
    const suggestions = suggestPalettes("xqzt blorpt");
    expect(suggestions).toHaveLength(5);
    for (const s of suggestions) {
      expect(s.matchedKeywords).toEqual([]);
      expect(s.rationale).toMatch(/no brand keyword matched/i);
    }
  });
});
