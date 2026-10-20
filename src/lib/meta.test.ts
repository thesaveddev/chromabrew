import { describe, expect, it } from "vitest";
import { clampDescription } from "./meta";

describe("clampDescription", () => {
  it("passes text inside the limit through untouched", () => {
    const text = "Short description with plenty of room to spare.";
    expect(clampDescription(text)).toBe(text);
  });

  it("clamps long text at a word boundary and appends an ellipsis", () => {
    const text = "a ".repeat(200).trim();
    const out = clampDescription(text);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
    expect(out.includes("  ")).toBe(false);
    // The cut lands between words, never inside one.
    expect(out.slice(0, -1).endsWith("a")).toBe(true);
  });

  it("never returns more than the requested maximum", () => {
    const long = `${"word ".repeat(80)}end`;
    expect(clampDescription(long, 100).length).toBeLessThanOrEqual(100);
  });

  it("still clamps when there is no space to break on", () => {
    const out = clampDescription("x".repeat(300));
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
  });
});
