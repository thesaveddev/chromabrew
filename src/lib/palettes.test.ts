import { describe, expect, it } from "vitest";
import {
  PALETTE_THEMES,
  GALLERY_PALETTES,
  MINTED_PER_THEME,
  themeBySlug,
  paletteBySlug,
  palettesForTheme,
  relatedPalettes,
  relatedMintedPalettes,
  crossThemeMintedPalettes,
  mintJumpIndexes,
  mintedPalette,
  resolvePalette,
  paletteGeneratorHref,
  variationSeedHex,
  isGalleryHex,
} from "./palettes";
import { mintedSlug, parseMintedSlug } from "./palette-mint";
import { GENERATED_PALETTES } from "./palettes-generated";
import {
  hexToRgb,
  oklabDistance,
  rgbToOklch,
} from "./design-system/colour/convert";

describe("palette gallery data", () => {
  it("has unique theme and palette slugs", () => {
    const themeSlugs = PALETTE_THEMES.map((t) => t.slug);
    expect(new Set(themeSlugs).size).toBe(themeSlugs.length);

    const paletteSlugs = GALLERY_PALETTES.map((p) => `${p.theme}/${p.slug}`);
    expect(new Set(paletteSlugs).size).toBe(paletteSlugs.length);
  });

  it("stores five valid hex stops per palette", () => {
    for (const palette of GALLERY_PALETTES) {
      expect(palette.colors, palette.slug).toHaveLength(5);
      for (const color of palette.colors) {
        expect(isGalleryHex(color), `${palette.slug}: ${color}`).toBe(true);
      }
    }
  });

  it("points every palette at a real theme with its own description", () => {
    for (const palette of GALLERY_PALETTES) {
      expect(themeBySlug(palette.theme), palette.slug).toBeDefined();
      expect(palette.description.length).toBeGreaterThan(40);
      expect(palette.tags.length).toBeGreaterThan(0);
    }
  });

  it("describes every palette differently", () => {
    const descriptions = GALLERY_PALETTES.map((p) => p.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("gives every theme at least three palettes", () => {
    for (const theme of PALETTE_THEMES) {
      expect(palettesForTheme(theme.slug).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("resolves lookups and related palettes without self-matches", () => {
    const first = GALLERY_PALETTES[0];
    expect(paletteBySlug(first.theme, first.slug)).toEqual(first);
    expect(paletteBySlug("nope", "nope")).toBeUndefined();

    const related = relatedPalettes(first, 3);
    expect(related).toHaveLength(3);
    expect(related.map((p) => p.slug)).not.toContain(first.slug);
  });

  it("seeds variations with the most vivid stop, never a near-black ink", () => {
    for (const palette of GALLERY_PALETTES) {
      const seed = variationSeedHex(palette);
      expect(palette.colors, palette.slug).toContain(seed);
      expect(isGalleryHex(seed), palette.slug).toBe(true);
    }
    // Midway Night stores its tent-shadow ink first; variations must grow
    // from the hot pink instead, or the harmony tool shows two near-blacks.
    const midway = paletteBySlug("circus", "midway-night")!;
    expect(variationSeedHex(midway)).toBe("#a5317a");
  });

  it("deep-links palettes into the generator with valid hex params", () => {
    for (const palette of GALLERY_PALETTES) {
      const href = paletteGeneratorHref(palette);
      const params = new URLSearchParams(href.split("?")[1]);
      for (const key of ["primary", "secondary", "accent"]) {
        expect(isGalleryHex(`#${params.get(key)}`), `${palette.slug}:${key}`).toBe(true);
      }
    }
  });
});

describe("minted long tail (1M addressable palettes)", () => {
  it("addresses 20,000 palettes per theme across all 50 themes", () => {
    expect(MINTED_PER_THEME).toBe(20_000);
    expect(PALETTE_THEMES.length * MINTED_PER_THEME).toBe(1_000_000);
  });

  it("mints a valid gallery entry for every theme", () => {
    for (const theme of PALETTE_THEMES) {
      for (const index of [0, 7_777, MINTED_PER_THEME - 1]) {
        const palette = mintedPalette(theme.slug, index);
        expect(palette, `${theme.slug}/${index}`).not.toBeNull();
        expect(palette!.colors).toHaveLength(5);
        for (const color of palette!.colors) {
          expect(isGalleryHex(color), `${theme.slug}/${index}: ${color}`).toBe(true);
        }
        expect(palette!.description.length).toBeGreaterThan(40);
        expect(palette!.mintedIndex).toBe(index);
      }
    }
  });

  it("refuses out-of-space mints and unknown themes", () => {
    expect(mintedPalette("retro", -1)).toBeNull();
    expect(mintedPalette("retro", MINTED_PER_THEME)).toBeNull();
    expect(mintedPalette("nope", 0)).toBeNull();
  });

  it("resolves catalog entries first, minted slugs second, junk never", () => {
    const first = GALLERY_PALETTES[0];
    // The catalog always wins, even if a slug looks minted.
    expect(resolvePalette(first.theme, first.slug)).toEqual(first);
    const minted = resolvePalette("retro", mintedSlug("retro", 4242));
    expect(minted).not.toBeNull();
    expect(minted!.mintedIndex).toBe(4242);
    expect(resolvePalette("retro", "not-a-real-slug")).toBeNull();
    expect(resolvePalette("nope", mintedSlug("retro", 1))).toBeNull();
  });

  it("relates minted palettes to same-theme neighbors, never itself", () => {
    const palette = resolvePalette("ocean", mintedSlug("ocean", 500))!;
    const related = relatedMintedPalettes("ocean", 500, 3);
    expect(related).toHaveLength(3);
    for (const other of related) {
      expect(other.theme).toBe("ocean");
      expect(other.slug).not.toBe(palette.slug);
    }
    // Edges wrap to valid neighbors instead of short-changing the count.
    expect(relatedMintedPalettes("ocean", 0, 3)).toHaveLength(3);
  });

  it("parses every minted slug back to its index", () => {
    expect(parseMintedSlug("retro", mintedSlug("retro", 0))).toBe(0);
    expect(parseMintedSlug("retro", mintedSlug("retro", 19_999))).toBe(19_999);
  });

  it("jumps through the mint without leaving the addressable range", () => {
    // Mid-mint: both ends plus both skips each way.
    expect(mintJumpIndexes(10_000)).toEqual([0, 9_000, 9_900, 10_100, 11_000, 19_999]);
    // Edges: out-of-range skips drop out, never the target itself.
    expect(mintJumpIndexes(0)).toEqual([100, 1_000, 19_999]);
    expect(mintJumpIndexes(19_999)).toEqual([0, 18_999, 19_899]);
    // Every target resolves back through the mint.
    for (const target of mintJumpIndexes(7_777)) {
      expect(parseMintedSlug("ocean", mintedSlug("ocean", target))).toBe(target);
    }
  });

  it("links the same mint number across neighboring themes, never itself", () => {
    const counterparts = crossThemeMintedPalettes("ocean", 4242, 2);
    expect(counterparts).toHaveLength(2);
    for (const other of counterparts) {
      expect(other.theme).not.toBe("ocean");
      expect(other.mintedIndex).toBe(4242);
    }
    expect(new Set(counterparts.map((p) => p.theme)).size).toBe(2);
    // Unknown themes yield nothing rather than guessing.
    expect(crossThemeMintedPalettes("nope", 1)).toEqual([]);
  });
});

describe("expanded gallery (1000 palettes)", () => {
  it("totals 1000 palettes: 200 curated plus 16 generated per theme", () => {
    expect(GALLERY_PALETTES.length).toBe(1000);
    expect(GENERATED_PALETTES.length).toBe(800);
    expect(PALETTE_THEMES.length).toBe(50);
    for (const theme of PALETTE_THEMES) {
      expect(palettesForTheme(theme.slug).length).toBe(20);
    }
  });

  it("gives generated palettes globally unique names", () => {
    const names = GALLERY_PALETTES.map((p) => p.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("keeps generated palettes spacious: dark anchor, light release, distinct stops", () => {
    for (const palette of GENERATED_PALETTES) {
      const lights = palette.colors.map((c) => rgbToOklch(hexToRgb(c)).l);
      expect(Math.min(...lights), `${palette.slug}: darkest`).toBeLessThanOrEqual(0.4);
      expect(Math.max(...lights), `${palette.slug}: lightest`).toBeGreaterThanOrEqual(0.8);
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          expect(
            oklabDistance(palette.colors[i], palette.colors[j]),
            `${palette.slug}: stops ${i}/${j}`,
          ).toBeGreaterThanOrEqual(0.05);
        }
      }
    }
  });
});
