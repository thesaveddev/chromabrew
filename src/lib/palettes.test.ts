import { describe, expect, it } from "vitest";
import {
  PALETTE_THEMES,
  GALLERY_PALETTES,
  themeBySlug,
  paletteBySlug,
  palettesForTheme,
  relatedPalettes,
  paletteGeneratorHref,
  variationSeedHex,
  isGalleryHex,
} from "./palettes";
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
