import { describe, expect, it } from "vitest";

import {
  analyzeBrandFit,
  dominantColors,
  hueDistance,
  inferCategory,
} from "./brand-fit";

/**
 * The fit check is a heuristic, so the tests pin its honesty rules rather
 * than any taste: neutrals never count as brand colours, an unknown
 * category or a gray page yields no section at all, and a misfit always
 * carries a generator link while a fit never does.
 */

describe("inferCategory", () => {
  it("reads the category from the title", () => {
    expect(inferCategory("Acme Bank — checking accounts", "https://acmebank.com/")?.id).toBe("finance");
  });

  it("reads compounds in the hostname", () => {
    expect(inferCategory("Acme", "https://acmebank.com/")?.id).toBe("finance");
  });

  it("admits when nothing matches", () => {
    expect(inferCategory("Zzxq Quux", "https://zzxq-quux.example/")).toBeNull();
  });

  it("ignores mood words that match everything", () => {
    expect(inferCategory("Modern Clean Minimal", "https://example.com/")).toBeNull();
  });
});

describe("dominantColors", () => {
  const hist = (hex: string, count: number) => ({ hex, count });

  it("ranks chromatic colours by frequency and skips surfaces", () => {
    const colors = dominantColors([
      hist("#ffffff", 100),
      hist("#111111", 90),
      hist("#1d4ed8", 40),
      hist("#dc2626", 25),
      hist("#16a34a", 10),
      hist("#f59e0b", 5),
    ]);
    expect(colors.map((c) => c.hex)).toEqual(["#1d4ed8", "#dc2626", "#16a34a"]);
  });

  it("returns nothing for an all-gray page", () => {
    expect(dominantColors([hist("#ffffff", 10), hist("#888888", 5)])).toEqual([]);
  });

  it("drops malformed entries instead of trusting them", () => {
    expect(dominantColors([hist("red", 10), hist("#1d4ed8", 3)]).map((c) => c.hex)).toEqual([
      "#1d4ed8",
    ]);
  });
});

describe("hueDistance", () => {
  it("wraps around the wheel", () => {
    expect(hueDistance(350, 10)).toBe(20);
  });
});

describe("analyzeBrandFit", () => {
  const bank = { title: "Acme Bank", url: "https://acmebank.com/" };

  it("passes a bank dressed in blue", () => {
    const fit = analyzeBrandFit({
      ...bank,
      histogram: [{ hex: "#1d4ed8", count: 30 }],
    });
    expect(fit?.categoryId).toBe("finance");
    expect(fit?.colors[0].role).toBe("primary");
    expect(fit?.colors[0].fit).toBe(true);
    expect(fit?.suggestions).toEqual([]);
  });

  it("flags a bank dressed in fast-food red and links a replacement", () => {
    const fit = analyzeBrandFit({
      ...bank,
      histogram: [{ hex: "#dc2626", count: 30 }],
    });
    expect(fit?.colors[0].fit).toBe(false);
    expect(fit?.suggestions).toHaveLength(1);
    const suggestion = fit!.suggestions[0];
    expect(suggestion.from).toBe("#dc2626");
    expect(suggestion.to).toMatch(/^#[0-9a-f]{6}$/);
    expect(suggestion.to).not.toBe("#dc2626");
    expect(suggestion.generatorHref).toBe(
      `/design-system?primary=${suggestion.to.slice(1)}`,
    );
  });

  it("hides the section when there is nothing honest to say", () => {
    expect(
      analyzeBrandFit({ ...bank, histogram: [{ hex: "#ffffff", count: 30 }] }),
    ).toBeNull();
    expect(
      analyzeBrandFit({
        title: "Zzxq Quux",
        url: "https://zzxq-quux.example/",
        histogram: [{ hex: "#dc2626", count: 30 }],
      }),
    ).toBeNull();
  });
});
