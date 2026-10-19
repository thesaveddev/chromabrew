import { describe, expect, it } from "vitest";
import {
  COLOR_FAMILIES,
  NAMED_COLORS,
  colorBySlug,
  colorsForFamily,
  relatedColors,
} from "./colors";
import { buildColorReference, slugifyBrand } from "./color-reference";
import {
  brandSlug,
  brandBySlug,
  brandCopy,
  relatedBrands,
} from "./brand-pages";
import { BRAND_PALETTES } from "./brand-palettes";

describe("named colors data", () => {
  it("has unique slugs with valid hex and families", () => {
    const slugs = NAMED_COLORS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const color of NAMED_COLORS) {
      expect(color.hex, color.slug).toMatch(/^#[0-9a-f]{6}$/i);
      expect(COLOR_FAMILIES as readonly string[]).toContain(color.family);
      expect(color.description.length).toBeGreaterThan(40);
      expect(color.uses.length).toBeGreaterThan(0);
    }
  });

  it("describes every color differently", () => {
    const descriptions = NAMED_COLORS.map((c) => c.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("resolves lookups without self-matches in related", () => {
    const first = NAMED_COLORS[0];
    expect(colorBySlug(first.slug)).toEqual(first);
    expect(colorBySlug("nope")).toBeUndefined();
    expect(colorsForFamily(first.family).length).toBeGreaterThan(1);
    const related = relatedColors(first, 4);
    expect(related).toHaveLength(4);
    expect(related.map((c) => c.slug)).not.toContain(first.slug);
  });
});

describe("buildColorReference", () => {
  it("computes formats, scale, harmonies, and contrast from one hex", () => {
    const ref = buildColorReference("#2563eb");
    expect(ref).not.toBeNull();
    expect(ref!.formats.hex).toBe("#2563eb");
    expect(ref!.formats.rgb).toContain("37");
    expect(ref!.scale).toHaveLength(11);
    expect(ref!.scale.map((s) => s.step)).toEqual([
      50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
    ]);
    expect(ref!.harmonies.map((h) => h.name)).toEqual([
      "Complementary",
      "Analogous",
      "Triadic",
    ]);
    // Complementary of blue (~222°) lands opposite on the wheel.
    expect(ref!.harmonies[0].colors).toHaveLength(2);
    expect(ref!.contrast.map((c) => c.backgroundName)).toEqual(["white", "black"]);
    expect(ref!.hueFamily.length).toBeGreaterThan(0);
  });

  it("computes the same reference deterministically", () => {
    expect(buildColorReference("#e11d48")).toEqual(buildColorReference("#E11D48"));
  });

  it("refuses invalid input", () => {
    expect(buildColorReference("not-a-color")).toBeNull();
  });
});

describe("brand pages", () => {
  it("slugifies every brand uniquely", () => {
    expect(slugifyBrand("Microsoft Teams")).toBe("microsoft-teams");
    const slugs = BRAND_PALETTES.map((b) => brandSlug(b.name));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const brand of BRAND_PALETTES) {
      expect(brandBySlug(brandSlug(brand.name))).toEqual(brand);
    }
  });

  it("writes factual copy that differs per brand", () => {
    const copies = BRAND_PALETTES.map((b) => JSON.stringify(brandCopy(b)));
    expect(new Set(copies).size).toBe(copies.length);
    const first = brandCopy(BRAND_PALETTES[0]);
    expect(first.lede).toContain(BRAND_PALETTES[0].name);
    expect(first.lede).toContain(BRAND_PALETTES[0].hex.toUpperCase());
  });

  it("relates brands without self-matches", () => {
    const first = BRAND_PALETTES[0];
    const related = relatedBrands(first, 4);
    expect(related).toHaveLength(4);
    expect(related.map((b) => b.name)).not.toContain(first.name);
  });
});
