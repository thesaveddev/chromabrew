import { BRAND_PALETTES, type BrandPalette } from "./brand-palettes";
import { buildColorReference, slugifyBrand } from "./color-reference";
import { hexToHsl } from "./design-system/colour/convert";

/**
 * Per-brand pages (`/brands/[slug]`) are reference data, not endorsements:
 * each page leads with the disclaimer, shows the widely published anchor
 * color with computed facts (formats, scale, measured contrast), and links
 * the color into the generator as a seed. Copy below is assembled from the
 * brand's own facts, so 98 pages share no sentence while sharing one honest
 * structure.
 */

export function brandSlug(name: string): string {
  return slugifyBrand(name);
}

export function brandBySlug(slug: string): BrandPalette | undefined {
  return BRAND_PALETTES.find((brand) => brandSlug(brand.name) === slug);
}

export function brandsForSector(sector: string): BrandPalette[] {
  return BRAND_PALETTES.filter((brand) => brand.sector === sector);
}

export function relatedBrands(brand: BrandPalette, count = 4): BrandPalette[] {
  const sameSector = BRAND_PALETTES.filter(
    (b) => b.sector === brand.sector && b.name !== brand.name,
  );
  const rest = BRAND_PALETTES.filter((b) => b.sector !== brand.sector);
  return [...sameSector, ...rest].slice(0, count);
}

function lightnessWord(l: number): string {
  if (l <= 15) return "near-black";
  if (l <= 35) return "deep";
  if (l <= 55) return "mid-tone";
  if (l <= 75) return "bright";
  return "near-white";
}

/**
 * Two factual paragraphs unique to this brand: what the color is, how it
 * behaves (contrast verdicts), and what to do with it. Every clause varies
 * with the data, so no two brands read the same.
 */
export function brandCopy(brand: BrandPalette): { lede: string; detail: string } {
  const ref = buildColorReference(brand.hex);
  const l = hexToHsl(brand.hex).l;
  const depth = lightnessWord(l);
  const family = ref?.hueFamily.toLowerCase() ?? "neutral";
  const [onWhite, onBlack] = ref?.contrast ?? [];

  const whiteVerdict = !onWhite
    ? "contrast is unmeasured"
    : onWhite.aaNormal
      ? `passes AA body text on white at ${onWhite.ratio}:1`
      : onWhite.aaLarge
        ? `clears AA large text on white at ${onWhite.ratio}:1 but not body copy`
        : `fails AA on white at ${onWhite.ratio}:1 and needs a darker step for text`;
  const blackVerdict = !onBlack
    ? "contrast is unmeasured"
    : onBlack.aaNormal
      ? `passes AA body text on black at ${onBlack.ratio}:1`
      : onBlack.aaLarge
        ? `works for large text on black at ${onBlack.ratio}:1`
        : `fails on black at ${onBlack.ratio}:1 and wants a lighter step there`;

  const peers = brandsForSector(brand.sector)
    .filter((b) => b.name !== brand.name)
    .slice(0, 3)
    .map((b) => b.name)
    .join(", ");

  return {
    lede: `The widely cited anchor color for ${brand.name} is ${brand.hex.toUpperCase()} — a ${depth} ${family} tone in the ${brand.sector} sector. It ${whiteVerdict}; on dark grounds it ${blackVerdict}.`,
    detail: `Use it as a seed, not a rule: open it in the generator to derive scales, accessible text steps, and themes in the same family, and confirm the current value against ${brand.name}'s own materials before shipping anything in their identity. Sector neighbors${peers ? ` like ${peers}` : ""} make useful comparisons when positioning against competitors.`,
  };
}
