import { describe, expect, it } from "vitest";

import {
  MINTED_PER_THEME,
  anchorContrastNote,
  hashSeed,
  hueFamily,
  huePool,
  mintColors,
  mintPalette,
  mintedName,
  mintedSlug,
  mulberry32,
  parseMintedSlug,
} from "./palette-mint";

/**
 * The deterministic long-tail engine.
 *
 * A million URLs are only honest if every one of them resolves to the same
 * good palette on every machine: names unique within the theme, slugs that
 * invert exactly (so near-misses 404 instead of rendering), and colors that
 * always pass the gallery's gates. Randomness here is seeded, never ambient.
 */
describe("seeded PRNG", () => {
  it("replays the same stream for the same seed", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("hashes the same string to the same seed", () => {
    expect(hashSeed("chromabrew:palette:retro")).toBe(hashSeed("chromabrew:palette:retro"));
    expect(hashSeed("chromabrew:palette:retro")).not.toBe(hashSeed("chromabrew:palette:pastel"));
  });
});

describe("minted slugs", () => {
  it("round-trips every sampled index", () => {
    for (const index of [0, 1, 7, 999, 10_000, MINTED_PER_THEME - 1]) {
      const slug = mintedSlug("retro", index);
      expect(parseMintedSlug("retro", slug)).toBe(index);
    }
  });

  it("rejects slugs outside the space", () => {
    // No suffix at all, and curated-style slugs, are not minted addresses.
    expect(parseMintedSlug("retro", "pearl-market")).toBeNull();
    expect(parseMintedSlug("retro", "copper-hollow")).toBeNull();
    // Out of range.
    expect(parseMintedSlug("retro", mintedSlug("retro", 0).replace(/-[0-9a-z]+$/, "-zzzz"))).toBeNull();
    // Tampered names never render: the recomputed slug must match exactly.
    const good = mintedSlug("retro", 42);
    expect(parseMintedSlug("retro", `tampered-name-${good.split("-").pop()}`)).toBeNull();
    // Another theme's valid slug is not valid here.
    expect(parseMintedSlug("pastel", mintedSlug("retro", 42))).toBeNull();
  });

  it("keeps every name in a theme unique", () => {
    const seen = new Set<string>();
    for (let index = 0; index < MINTED_PER_THEME; index++) {
      const name = mintedName("ocean", index);
      expect(seen.has(name)).toBe(false);
      seen.add(name);
    }
    expect(seen.size).toBe(MINTED_PER_THEME);
  });
});

describe("minted colors", () => {
  const hues = [10, 40, 150, 210, 280];

  it("always returns five distinct valid hexes, darkest first", () => {
    for (const seed of [1, 99, 123456, 0xffffffff]) {
      const colors = mintColors({ seed, hues });
      expect(colors).toHaveLength(5);
      for (const hex of colors) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(new Set(colors).size).toBe(5);
    }
  });

  it("is deterministic for the same input", () => {
    expect(mintColors({ seed: 7, hues })).toEqual(mintColors({ seed: 7, hues }));
    expect(mintColors({ seed: 7, hues })).not.toEqual(mintColors({ seed: 8, hues }));
  });

  it("survives a thin hue pool", () => {
    const colors = mintColors({ seed: 3, hues: [] });
    expect(colors).toHaveLength(5);
    expect(new Set(colors).size).toBe(5);
  });
});

describe("minted palette assembly", () => {
  const hues = [10, 40, 150, 210, 280];

  it("builds a complete gallery entry whose slug resolves back", () => {
    const palette = mintPalette({ themeSlug: "retro", themeName: "Retro", index: 1234, hues });
    expect(palette.slug).toBe(mintedSlug("retro", 1234));
    expect(parseMintedSlug("retro", palette.slug)).toBe(1234);
    expect(palette.theme).toBe("retro");
    expect(palette.mintedIndex).toBe(1234);
    expect(palette.tags).toContain("retro");
    expect(palette.tags).toContain("five-stop");
    // Unique per page: the prose carries its own hexes.
    for (const hex of palette.colors) expect(palette.description).toContain(hex);
  });

  it("is stable across calls", () => {
    const input = { themeSlug: "pastel", themeName: "Pastel", index: 77, hues };
    expect(mintPalette(input)).toEqual(mintPalette(input));
  });
});

describe("hue helpers", () => {
  it("names achromatic families honestly", () => {
    expect(hueFamily("#111111")).toBe("near-black");
    expect(hueFamily("#fafafa")).toBe("off-white");
    expect(hueFamily("#808080")).toBe("neutral");
    expect(hueFamily("#c0392b")).toBe("red");
    expect(hueFamily("#2980b9")).toBe("sky");
  });

  it("falls back to a sweep when the pool is thin", () => {
    expect(huePool([])).toHaveLength(9);
    expect(huePool(["#ff0000", "#00ff00"])).toHaveLength(9);
    const hues = huePool(["#ff0000", "#00ff00", "#0000ff", "#ffff00"]);
    expect(hues).toHaveLength(4);
    for (const hue of hues) expect(hue).toBeGreaterThanOrEqual(0);
  });

  it("states only what the measured anchor ratio clears", () => {
    expect(anchorContrastNote(["#000000", "#ffffff"])).toContain("AAA");
    expect(anchorContrastNote(["#333333", "#dddddd"])).toContain("AA");
    expect(anchorContrastNote(["#888888", "#999999"])).toBe("");
  });
});
