/**
 * The deterministic long-tail palette engine: a bounded, crawlable space of
 * one million palette pages with no million-row table and no million-file
 * build.
 *
 * 50 themes x 20,000 indexes = 1,000,000 addressable palettes. Each
 * (theme, index) pair derives exactly one palette — name, colors,
 * description, tags — from a seeded PRNG, so any URL in the space renders
 * the same bytes on every machine without storing anything. Curated and
 * generated catalog entries always win on collision (see `resolvePalette`
 * in `./palettes`): the mint only serves slugs the catalog does not claim.
 *
 * Names are a full cross-product per theme (250 adjectives x 80 nouns),
 * unique within the theme by construction, with the index in the slug so a
 * URL resolves in O(1) without an inversion table. Colors come from the real
 * palette engine (`generatePalette`) seeded by the theme's curated hue pool,
 * then gated the way the gallery script gates: five distinct in-gamut stops,
 * dark anchor first, a measured contrast note instead of a claimed one.
 */

import { generatePalette } from "@/lib/design-system/palette/generate";
import { hexToHsl, oklchToHex } from "@/lib/design-system/colour/convert";
import { contrastRatio, relativeLuminance } from "@/lib/design-system/colour/contrast";
import type { PaletteStrategyId } from "@/lib/design-system/types";
import type { GalleryPalette } from "./palettes";

/** Addressable minted palettes per theme. 50 themes x 20,000 = 1,000,000. */
export const MINTED_PER_THEME = 20_000;

/* ------------------------------------------------------------------ */
/* Seeded PRNG                                                          */
/* ------------------------------------------------------------------ */

/** FNV-1a: short strings to uint32 seeds, identical on every machine. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Name pools: 273 adjectives x 84 nouns = 22,932 pairs, covering the      */
/* 20,000 minted indexes per theme with room to spare. Names stay unique   */
/* within a theme by construction (see namePair).                          */
/* ------------------------------------------------------------------ */

const ADJECTIVES: readonly string[] = [
  "amber", "ashen", "atlas", "autumn", "barefoot", "birch", "bitter", "blushing",
  "bracken", "brazen", "breezy", "brindle", "brisk", "bronze", "brumal", "burnished",
  "butter", "calico", "candlelit", "caramel", "cardamom", "cashmere", "cedar",
  "chalky", "chambray", "chiffon", "cinder", "cinnamon", "citrus", "clouded",
  "clover", "cobalt", "cocoa", "copper", "coral", "cordovan", "cornsilk", "cozy",
  "crackling", "cranberry", "cream", "crimson", "crisp", "crocus", "cumin",
  "cypress", "dappled", "dawn", "daybreak", "denim", "dewey", "distant", "drowsy",
  "dusky", "dusty", "earthen", "ebony", "elder", "ember", "emerald", "evening",
  "faded", "faraway", "fawn", "fennel", "fern", "festival", "fiery", "fig",
  "firstlight", "flannel", "flaxen", "flickering", "flint", "foggy", "foxglove",
  "frosted", "frosty", "gauzy", "ginger", "glacier", "glassy", "gleaming",
  "gloaming", "golden", "granite", "grape", "grassy", "greige", "gypsy",
  "halcyon", "harbor", "harvest", "hazy", "heather", "herbal", "hickory",
  "honeyed", "hushed", "hyacinth", "icy", "indigo", "inked", "inlet", "iris",
  "ivory", "jadite", "jasmine", "juniper", "jute", "kelp", "kiln", "kindled",
  "lacquered", "lantern", "larkspur", "late", "latte", "laurel", "lavender",
  "lazy", "leaden", "leafy", "lichen", "lilac", "linen", "lingering", "lotus",
  "lullaby", "luminous", "lunar", "lupine", "magnolia", "mahogany", "malty",
  "maple", "marble", "marigold", "maritime", "maroon", "meadow", "melon",
  "mercurial", "merino", "midnight", "milky", "mimosa", "mineral", "minty",
  "misty", "molasses", "moonlit", "morning", "mossy", "mulberry", "muslin",
  "mustard", "myrrh", "nectar", "nightfall", "nomad", "north", "oaken", "oat",
  "obsidian", "ochre", "olive", "opal", "orchard", "overcast", "oyster", "pale",
  "paprika", "parchment", "pastoral", "peachy", "pearl", "peaty", "pepper",
  "perennial", "pewter", "pine", "pink", "plum", "polar", "poppy", "porcelain",
  "powdery", "prairie", "primrose", "pumice", "punchy", "quiet", "quilted",
  "rainy", "raisin", "raw", "reedy", "restful", "river", "roasted", "rocky",
  "rosewood", "rosy", "rumpled", "russet", "rustic", "sable", "saffron", "sage",
  "sandy", "satin", "seafoam", "seaside", "sienna", "silken", "silvery", "simmered",
  "sleepy", "sloe", "smoky", "snowy", "soft", "sooty", "sorrel", "speckled",
  "spiced", "spruce", "starlit", "steely", "stone", "stormy", "straw", "sugar",
  "sultry", "sumac", "sunbaked", "sundew", "sunlit", "sunset", "tawny", "teal",
  "terracotta", "thistled", "tidal", "timbered", "toasted", "topaz", "torrid",
  "tranquil", "tumbleweed", "turmeric", "twilit", "umber", "vale", "velvet",
  "vernal", "vintage", "violet", "walnut", "waxed", "wheat", "whispering",
  "wildflower", "willow", "windy", "wisteria", "woodsmoke", "woolen", "woven",
  "yonder", "yuzu", "zephyr",
];

const NOUNS: readonly string[] = [
  "abbey", "alley", "archive", "atelier", "bakery", "bazaar", "beacon", "bluff",
  "bookshop", "boulevard", "brook", "cabin", "canyon", "caravan", "cellar",
  "chapel", "clearing", "cottage", "courtyard", "cove", "crater", "crossing",
  "dairy", "deck", "delta", "depot", "dock", "dune", "estuary", "fen", "fjord",
  "foundry", "gallery", "garret", "gazebo", "glade", "granary", "grove", "harbor",
  "heath", "hollow", "inn", "junction", "kiln", "kiosk", "lagoon", "lane",
  "library", "lighthouse", "lodge", "loft", "manor", "marsh", "meadow", "mesa",
  "mill", "moor", "oasis", "orchard", "outpost", "pagoda", "parlor", "patio",
  "pavilion", "pier", "plaza", "porch", "prairie", "reef", "ridge", "saloon",
  "shrine", "square", "station", "studio", "tavern", "temple", "terrace",
  "thicket", "tundra", "valley", "veranda", "villa", "wharf",
];

/** Scatter the index across the name space so neighbours never look related. */
const NAME_STRIDE = 7919;
const NAME_SALT = 0x9e3779b9;

function namePair(themeSlug: string, index: number): { adjective: string; noun: string } {
  const salt = (hashSeed(`chromabrew:palette:${themeSlug}`) ^ NAME_SALT) >>> 0;
  const scattered = (Math.imul(index, NAME_STRIDE) + salt) % MINTED_PER_THEME;
  const adjective = ADJECTIVES[scattered % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(scattered / ADJECTIVES.length) % NOUNS.length];
  return { adjective, noun };
}

/** The URL slug for a minted palette: name plus the index in base36. */
export function mintedSlug(themeSlug: string, index: number): string {
  const { adjective, noun } = namePair(themeSlug, index);
  return `${adjective}-${noun}-${index.toString(36)}`;
}

const MINTED_SUFFIX = /-([0-9a-z]{1,4})$/;

/**
 * Invert a minted slug back to its index, or null when it is not one of
 * ours. The index is re-derived forward and the slug recomputed, so a
 * hand-typed near-miss never renders — only exact members of the space do.
 */
export function parseMintedSlug(themeSlug: string, slug: string): number | null {
  const match = MINTED_SUFFIX.exec(slug);
  if (!match) return null;
  const index = parseInt(match[1], 36);
  if (!Number.isInteger(index) || index < 0 || index >= MINTED_PER_THEME) return null;
  return mintedSlug(themeSlug, index) === slug ? index : null;
}

export function mintedName(themeSlug: string, index: number): string {
  const { adjective, noun } = namePair(themeSlug, index);
  const cap = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);
  return `${cap(adjective)} ${cap(noun)}`;
}

/* ------------------------------------------------------------------ */
/* Colors: the real engine, seeded by the theme's curated hue pool      */
/* ------------------------------------------------------------------ */

const STRATEGY_IDS: readonly PaletteStrategyId[] = [
  "complementary",
  "analogous",
  "triadic",
  "split-complementary",
  "monochromatic",
  "tetradic",
];

const STRATEGY_LABELS: Record<PaletteStrategyId, string> = {
  complementary: "complementary",
  analogous: "analogous",
  triadic: "triadic",
  "split-complementary": "split-complementary",
  monochromatic: "monochromatic",
  tetradic: "tetradic",
};

function hueOf(hex: string): number {
  return hexToHsl(hex).h;
}

/** Hue family for tags, from the palette's most saturated stop. */
export function hueFamily(hex: string): string {
  // hexToHsl reports s/l on 0-100 and h in degrees.
  const { h, s, l } = hexToHsl(hex);
  if (s < 12) {
    return l < 25 ? "near-black" : l > 80 ? "off-white" : "neutral";
  }
  if (h < 15 || h >= 345) return "red";
  if (h < 40) return "orange";
  if (h < 55) return "amber";
  if (h < 75) return "yellow";
  if (h < 100) return "chartreuse";
  if (h < 150) return "green";
  if (h < 175) return "teal";
  if (h < 200) return "cyan";
  if (h < 235) return "sky";
  if (h < 265) return "blue";
  if (h < 290) return "violet";
  if (h < 325) return "magenta";
  return "pink";
}

/**
 * Mint five stops for (theme, index) from a pool of the theme's curated
 * hues. Retries with advancing draws until the gates pass (bounded, so the
 * function always returns): five distinct in-gamut hexes with a dark anchor
 * and a light release, ordered dark first the way the gallery reads.
 */
export function mintColors(input: {
  seed: number;
  hues: readonly number[];
  attempts?: number;
}): [string, string, string, string, string] {
  const hues = input.hues.length > 0 ? input.hues : [0, 40, 120, 200, 280];
  const maxAttempts = Math.max(1, input.attempts ?? 8);
  let best: string[] | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rand = mulberry32((input.seed + attempt * 0x85ebca6b) >>> 0);
    const baseHue = hues[Math.floor(rand() * hues.length)] + (rand() * 16 - 8);
    const strategy = STRATEGY_IDS[Math.floor(rand() * STRATEGY_IDS.length)];
    const primary = oklchToHex({
      l: 0.5 + rand() * 0.15,
      c: 0.1 + rand() * 0.09,
      h: ((baseHue % 360) + 360) % 360,
    });
    const stops = generatePalette(primary, strategy, { size: 5 })
      .map((swatch) => swatch.hex.toLowerCase())
      .filter((hex) => /^#[0-9a-f]{6}$/.test(hex));
    const unique = [...new Set(stops)];
    if (unique.length < 5) {
      best = best ?? unique.concat(stops).slice(0, 5);
      continue;
    }
    const ordered = [...unique].sort(
      (a, b) => relativeLuminance(a) - relativeLuminance(b),
    );
    const spread = contrastRatio(ordered[0], ordered[4]);
    if (spread >= 2.2) return ordered as [string, string, string, string, string];
    if (!best) best = ordered;
  }

  const fallback = (best ?? ["#1c1917", "#57534e", "#a8a29e", "#e7e5e4", "#fafaf9"]).slice(0, 5);
  return fallback as [string, string, string, string, string];
}

/* ------------------------------------------------------------------ */
/* Prose: templated but unique per page (hexes, strategy, use-case)     */
/* ------------------------------------------------------------------ */

const USE_CASES: readonly string[] = [
  "coffee bags and cafe menus that need appetite on crowded shelves",
  "book covers that read at thumbnail size",
  "wellness apps where the interface must feel calm, not clinical",
  "indie game interfaces with a strong day-night rhythm",
  "packaging that photographs well under harsh retail light",
  "dashboards where status colors must survive color-vision differences",
  "restaurant branding that works on signage and receipts alike",
  "newsletters where the header, links, and footers share one voice",
  "event posters that compete with a wall of other posters",
  "ceramics and home goods shot against white seamless",
  "outdoor gear branding that reads in sun and shade",
  "fintech onboarding that must feel both safe and modern",
  "music artwork with loud darks and a glowing accent",
  "farmers-market stalls seen from across the parking lot",
  "yoga studio schedules pinned to a corkboard",
  "craft brewery cans lined up in a cooler door",
  "podcast cover art at sixty pixels square",
  "hotel key cards and lobby signage in one system",
  "bakery boxes stamped with a single ink color",
  "national-park posters with layered mountain silhouettes",
  "tea packaging where the flavor color does the talking",
  "bike-shop liveries that survive mud and sun",
  "flower-shop wraps and delivery van livery together",
  "museum exhibition graphics with long sightlines",
];

// Every template names all five stops: the hexes are what make each page's
// prose unique, so leaving any stop out weakens the whole point.
const DESCRIPTION_TEMPLATES: readonly ((slots: TemplateSlots) => string)[] = [
  ({ name, hexes, strategy, useCase, contrastNote }: TemplateSlots): string =>
    `Five stops tuned to sit together without fighting — ${hexes[0]} ink anchors the set, ${hexes[4]} opens it up, and ${hexes[1]}, ${hexes[2]}, ${hexes[3]} cross the middle in a ${strategy} arrangement. ${name} suits ${useCase}.${contrastNote}`,
  ({ hexes, theme, strategy, useCase, contrastNote }: TemplateSlots): string =>
    `A quiet five-stop ${theme} arc with a confident middle — ${hexes[0]} carries the weight and ${hexes[4]} carries the air, with ${hexes[1]}, ${hexes[2]} and ${hexes[3]} bridging in ${strategy} formation. Built for ${useCase}.${contrastNote}`,
  ({ name, hexes, strategy, useCase, contrastNote }: TemplateSlots): string =>
    `${name} runs ${hexes[0]} through ${hexes[1]}, ${hexes[2]}, ${hexes[3]} to ${hexes[4]} in five measured steps, the ${strategy} structure keeping every neighbor honest. Reach for it for ${useCase}.${contrastNote}`,
  ({ hexes, theme, strategy, useCase, contrastNote }: TemplateSlots): string =>
    `Dark anchor, working middle, light release: ${hexes.join(", ")} form a ${strategy} ${theme} set with somewhere to stand at every lightness. Made for ${useCase}.${contrastNote}`,
  ({ hexes, theme, strategy, useCase, contrastNote }: TemplateSlots): string =>
    `Five ${theme} stops with room to breathe — ${hexes[0]} grounds, ${hexes[1]} and ${hexes[2]} do the talking, ${hexes[3]} softens, ${hexes[4]} lifts. The ${strategy} bones keep it coherent across ${useCase}.${contrastNote}`,
  ({ name, hexes, strategy, useCase, contrastNote }: TemplateSlots): string =>
    `From ${hexes[0]} ink through ${hexes[1]}, ${hexes[2]}, ${hexes[3]} to ${hexes[4]} light, ${name} is a ${strategy} progression that holds together at any size. Use it for ${useCase}.${contrastNote}`,
];

interface TemplateSlots {
  name: string;
  hexes: [string, string, string, string, string];
  theme: string;
  strategy: string;
  useCase: string;
  contrastNote: string;
}

/**
 * The one honest claim the page may make: the darkest and lightest stops
 * are measured, and the note states exactly what the measured ratio clears.
 */
export function anchorContrastNote(colors: readonly string[]): string {
  const ratio = contrastRatio(colors[0], colors[colors.length - 1]);
  if (ratio >= 7) return " The darkest and lightest stops clear AAA as a text pair.";
  if (ratio >= 4.5) return " The darkest and lightest stops clear AA as a text pair.";
  if (ratio >= 3) return " The darkest and lightest stops clear AA for large text.";
  return "";
}

/* ------------------------------------------------------------------ */
/* Assembly                                                             */
/* ------------------------------------------------------------------ */

export interface MintInput {
  themeSlug: string;
  themeName: string;
  index: number;
  /** Hues mined from the theme's curated palettes; falls back to a sweep. */
  hues: readonly number[];
}

export function mintPalette(input: MintInput): GalleryPalette {
  const seed = (hashSeed(`chromabrew:palette:${input.themeSlug}`) ^ Math.imul(input.index + 1, 0x9e3779b1)) >>> 0;
  const rand = mulberry32(seed);
  const strategy = STRATEGY_IDS[Math.floor(rand() * STRATEGY_IDS.length)];
  const colors = mintColors({ seed, hues: input.hues });
  const name = mintedName(input.themeSlug, input.index);
  const useCase = USE_CASES[Math.floor(mulberry32(seed ^ 0xabcdef)() * USE_CASES.length)];
  const template = DESCRIPTION_TEMPLATES[Math.floor(rand() * DESCRIPTION_TEMPLATES.length)];
  const description = template({
    name,
    hexes: colors,
    theme: input.themeName.toLowerCase(),
    strategy: STRATEGY_LABELS[strategy],
    useCase,
    contrastNote: anchorContrastNote(colors),
  });
  // The most saturated stop names the family; mid-saturation (~50) reads as
  // the palette's most characteristic hue rather than an ink or a pastel.
  const family = hueFamily(
    [...colors].sort(
      (a, b) => Math.abs(50 - hexToHsl(a).s) - Math.abs(50 - hexToHsl(b).s),
    )[0],
  );
  const tags = [family, input.themeSlug, "five-stop"];
  if (contrastRatio(colors[0], colors[4]) >= 4.5) tags.push("high-contrast");

  return {
    slug: mintedSlug(input.themeSlug, input.index),
    theme: input.themeSlug,
    name,
    colors,
    description,
    tags,
    mintedIndex: input.index,
  };
}

/** Hue pool for a theme from hexes; even sweep when the pool is thin. */
export function huePool(hexes: readonly string[]): number[] {
  const hues = hexes.map(hueOf).filter((h) => Number.isFinite(h));
  if (hues.length >= 3) return hues;
  return [0, 30, 60, 120, 180, 210, 260, 300, 330];
}
