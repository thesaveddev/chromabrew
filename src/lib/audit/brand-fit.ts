/**
 * Brand fit: does the site's palette suit its product category?
 *
 * The audit already measures every text colour it can resolve. Aggregating
 * those measurements gives the site's dominant chromatic colours for free —
 * no screenshot analysis, no new capture path. The category comes from the
 * site's own words (title plus hostname) matched against the same
 * keyword→hue knowledge the AI palette suggestion tool uses; the expected
 * hues below mirror that map's ranges, grouped by category instead of by
 * keyword.
 *
 * Everything here is a heuristic and is presented as one: a misfit is a
 * prompt to look, not a failure. Pure, so the report, the tests and any
 * future API share the same verdict.
 */

import { hexToHsl, hslToHex } from "@/lib/design-system/colour/convert";

export interface ColorCount {
  hex: string;
  count: number;
}

export interface BrandCategory {
  id: string;
  /** Shown in the report, e.g. "Finance". */
  label: string;
  /** Lowercase keywords matched against title words and the hostname. */
  keywords: string[];
  /** Hues (0–360) this category conventionally lives in. */
  hues: number[];
}

const CATEGORIES: BrandCategory[] = [
  {
    id: "technology",
    label: "Technology",
    keywords: ["tech", "software", "ai", "data", "cloud", "digital", "code", "app", "startup", "saas", "dev", "cyber"],
    hues: [200, 210, 220, 230, 240, 260, 270, 280],
  },
  {
    id: "finance",
    label: "Finance",
    keywords: ["finance", "bank", "money", "invest", "trust", "insurance", "fintech", "loan", "payment", "wealth", "capital"],
    hues: [150, 160, 170, 210, 220, 230],
  },
  {
    id: "health",
    label: "Health & care",
    keywords: ["health", "medical", "wellness", "care", "clinic", "dental", "pharma", "therapy", "doctor", "hospital"],
    hues: [150, 160, 170, 190, 200, 210],
  },
  {
    id: "fitness",
    label: "Fitness & energy",
    keywords: ["fitness", "sport", "gym", "run", "fast", "speed", "energy", "power", "training", "marathon"],
    hues: [0, 10, 45, 55, 65, 350],
  },
  {
    id: "food",
    label: "Food & drink",
    keywords: ["food", "cafe", "coffee", "restaurant", "bakery", "recipe", "kitchen", "taste", "brew", "organic", "farm", "vegan", "eat", "pizza", "tea"],
    hues: [0, 10, 20, 25, 30, 35, 45, 100, 110, 120, 350],
  },
  {
    id: "creative",
    label: "Creative & fashion",
    keywords: ["design", "art", "creative", "music", "fashion", "beauty", "photo", "studio", "agency", "film", "gallery"],
    hues: [280, 290, 300, 330, 340, 350],
  },
  {
    id: "education",
    label: "Education",
    keywords: ["learn", "school", "education", "study", "book", "course", "class", "tutor", "student", "academy"],
    hues: [40, 50, 60],
  },
  {
    id: "social",
    label: "Social & community",
    keywords: ["social", "community", "chat", "message", "friend", "connect", "network", "dating", "forum"],
    hues: [150, 160, 170, 200, 210, 220],
  },
  {
    id: "luxury",
    label: "Luxury & hospitality",
    keywords: ["luxury", "premium", "gold", "elegant", "hotel", "estate", "wine", "jewel", "resort", "bespoke"],
    hues: [40, 45, 50, 280, 290, 300],
  },
  {
    id: "security",
    label: "Security & privacy",
    keywords: ["safe", "secure", "protect", "guard", "privacy", "lock", "shield", "vpn", "vault", "defense", "defence"],
    hues: [210, 220, 230],
  },
  {
    id: "travel",
    label: "Travel",
    keywords: ["travel", "adventure", "explore", "trip", "flight", "journey", "tour", "stay", "booking"],
    hues: [190, 200, 210, 220],
  },
];

/**
 * Guess the product category from the site's own words. Title words match
 * exactly; the hostname also matches compounds (`acmebank` still counts as
 * finance) because domains rarely separate their words. Mood words like
 * "modern" or "clean" are deliberately absent from every list — they match
 * everything and would drown the signal.
 */
export function inferCategory(title: string | null, url: string): BrandCategory | null {
  const titleWords = (title ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  let hostWords: string[] = [];
  try {
    hostWords = new URL(url).hostname.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  } catch {
    hostWords = [];
  }

  let best: BrandCategory | null = null;
  let bestHits = 0;
  for (const category of CATEGORIES) {
    let hits = 0;
    for (const keyword of category.keywords) {
      if (titleWords.includes(keyword)) hits += 2;
      else if (hostWords.some((word) => word.includes(keyword))) hits += 1;
    }
    if (hits > bestHits) {
      best = category;
      bestHits = hits;
    }
  }
  return best;
}

/** Chromatic colours by frequency, most used first, capped at three. */
export function dominantColors(histogram: readonly ColorCount[]): ColorCount[] {
  const totals = new Map<string, number>();
  for (const entry of histogram) {
    const hex = entry.hex.toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(hex)) continue;
    if (!Number.isFinite(entry.count) || entry.count <= 0) continue;
    totals.set(hex, (totals.get(hex) ?? 0) + entry.count);
  }
  const chromatic = [...totals.entries()].filter(([hex]) => {
    let hsl: { s: number; l: number };
    try {
      hsl = hexToHsl(hex);
    } catch {
      return false;
    }
    // Near-grays, black and white are surfaces, not brand colours.
    return hsl.s >= 12 && hsl.l > 6 && hsl.l < 94;
  });
  chromatic.sort((a, b) => b[1] - a[1]);
  return chromatic.slice(0, 3).map(([hex, count]) => ({ hex, count }));
}

/** Shortest distance around the colour wheel, in degrees. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** A colour fits when it lands within a generously drawn ring of the category's hues. */
const FIT_DEGREES = 30;

export interface BrandColorFit {
  hex: string;
  count: number;
  /** Primary, secondary, accent — by frequency rank, most used first. */
  role: "primary" | "secondary" | "accent";
  hue: number;
  fit: boolean;
  /** Distance to the nearest expected hue, in degrees. */
  distance: number;
}

export interface RecolorSuggestion {
  role: "primary" | "secondary" | "accent";
  from: string;
  /** The same colour re-homed to the nearest expected hue. */
  to: string;
  /** Opens the design system generator with the replacement pre-selected. */
  generatorHref: string;
}

export interface BrandFit {
  categoryId: string;
  categoryLabel: string;
  colors: BrandColorFit[];
  /** One per misfit colour — fits need no replacement. */
  suggestions: RecolorSuggestion[];
}

const ROLES = ["primary", "secondary", "accent"] as const;

function nearestHue(hue: number, hues: readonly number[]): { hue: number; distance: number } {
  let best = hues[0];
  let bestDistance = hueDistance(hue, hues[0]);
  for (const candidate of hues.slice(1)) {
    const distance = hueDistance(hue, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return { hue: best, distance: bestDistance };
}

/**
 * The verdict for one page, or null when there is nothing honest to say:
 * no recognisable category, or no chromatic colours measured (an all-gray
 * page, or a fetch-only scan with no computed styles). Null hides the
 * section rather than inventing an opinion.
 */
export function analyzeBrandFit({
  title,
  url,
  histogram,
}: {
  title: string | null;
  url: string;
  histogram: readonly ColorCount[];
}): BrandFit | null {
  const category = inferCategory(title, url);
  if (!category) return null;
  const dominant = dominantColors(histogram);
  if (dominant.length === 0) return null;

  const colors: BrandColorFit[] = dominant.map(({ hex, count }, i) => {
    const { h } = hexToHsl(hex);
    const { distance } = nearestHue(h, category.hues);
    return {
      hex,
      count,
      role: ROLES[i],
      hue: Math.round(h),
      fit: distance <= FIT_DEGREES,
      distance: Math.round(distance),
    };
  });

  const suggestions: RecolorSuggestion[] = colors
    .filter((color) => !color.fit)
    .map((color) => {
      const { s, l } = hexToHsl(color.hex);
      const { hue } = nearestHue(color.hue, category.hues);
      const to = hslToHex(hue, s, Math.max(18, Math.min(72, l)));
      return {
        role: color.role,
        from: color.hex,
        to,
        generatorHref: `/design-system?primary=${to.slice(1)}`,
      };
    });

  return { categoryId: category.id, categoryLabel: category.label, colors, suggestions };
}
