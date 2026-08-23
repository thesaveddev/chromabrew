import { NextResponse } from "next/server";

/**
 * AI palette suggestion engine.
 *
 * Uses a heuristic-based approach: maps brand keywords to hue ranges,
 * then generates 5 palette suggestions with different strategies.
 * No LLM API required — works entirely offline.
 */

interface PaletteSuggestion {
  name: string;
  description: string;
  primary: string;
  strategy:
    | "complementary"
    | "analogous"
    | "triadic"
    | "split-complementary"
    | "monochromatic";
}

const KEYWORD_HUE_MAP: Record<string, number[]> = {
  // Tech / Innovation
  tech: [210, 220, 230],
  software: [210, 220, 230],
  ai: [260, 270, 280],
  data: [200, 210, 220],
  cloud: [200, 210, 220],
  digital: [220, 230, 240],
  code: [220, 230, 240],

  // Finance / Trust
  finance: [210, 220, 230],
  bank: [210, 220, 230],
  money: [150, 160, 170],
  invest: [150, 160, 170],
  trust: [210, 220, 230],

  // Health / Wellness
  health: [150, 160, 170],
  medical: [190, 200, 210],
  wellness: [150, 160, 170],
  fitness: [0, 10, 350],
  sport: [0, 10, 350],
  yoga: [260, 270, 280],

  // Food / Drink
  food: [25, 35, 45],
  cafe: [25, 35, 45],
  coffee: [20, 25, 30],
  restaurant: [0, 10, 350],
  organic: [100, 110, 120],
  nature: [100, 110, 120],

  // Creative / Design
  design: [280, 290, 300],
  art: [330, 340, 350],
  creative: [280, 290, 300],
  music: [280, 290, 300],
  fashion: [330, 340, 350],
  beauty: [330, 340, 350],

  // Education
  learn: [40, 50, 60],
  school: [40, 50, 60],
  education: [40, 50, 60],
  study: [40, 50, 60],
  book: [40, 50, 60],

  // Energy / Power
  energy: [45, 55, 65],
  power: [45, 55, 65],
  solar: [40, 50, 60],
  electric: [55, 65, 75],

  // Social / Community
  social: [200, 210, 220],
  community: [200, 210, 220],
  chat: [150, 160, 170],
  message: [150, 160, 170],

  // Luxury / Premium
  luxury: [40, 45, 50],
  premium: [40, 45, 50],
  gold: [40, 45, 50],
  elegant: [280, 290, 300],

  // Safety / Security
  safe: [210, 220, 230],
  secure: [210, 220, 230],
  protect: [210, 220, 230],
  guard: [210, 220, 230],

  // Speed / Motion
  fast: [0, 10, 350],
  speed: [0, 10, 350],
  quick: [25, 35, 45],
  rush: [0, 10, 350],

  // Calm / Peace
  calm: [200, 210, 220],
  peace: [200, 210, 220],
  zen: [200, 210, 220],
  quiet: [210, 220, 230],

  // Warm / Friendly
  warm: [25, 35, 45],
  friendly: [25, 35, 45],
  cozy: [15, 20, 25],
  home: [25, 35, 45],

  // Cool / Modern
  cool: [200, 210, 220],
  modern: [220, 230, 240],
  minimal: [220, 230, 240],
  clean: [200, 210, 220],

  // Adventure / Travel
  travel: [200, 210, 220],
  adventure: [190, 200, 210],
  explore: [190, 200, 210],
  wild: [100, 110, 120],

  // Pet / Animal
  pet: [25, 35, 45],
  animal: [25, 35, 45],
  dog: [25, 35, 45],
  cat: [260, 270, 280],
};

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generatePalette(hue: number, strategy: PaletteSuggestion["strategy"]): string {
  switch (strategy) {
    case "complementary":
      return hslToHex(hue, 70, 50);
    case "analogous":
      return hslToHex(hue + 15, 65, 48);
    case "triadic":
      return hslToHex(hue, 60, 50);
    case "split-complementary":
      return hslToHex(hue + 15, 65, 48);
    case "monochromatic":
      return hslToHex(hue, 50, 45);
  }
}

function extractHues(description: string): number[] {
  const words = description.toLowerCase().split(/\s+/);
  const hues: number[] = [];

  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, "");
    if (KEYWORD_HUE_MAP[clean]) {
      hues.push(...KEYWORD_HUE_MAP[clean]);
    }
  }

  // Fallback: hash the description to a hue
  if (hues.length === 0) {
    let hash = 0;
    for (const char of description) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    hues.push(Math.abs(hash) % 360);
  }

  return [...new Set(hues)];
}

export async function POST(request: Request) {
  const body = await request.json();
  const { description } = body as { description: string };

  if (!description || description.trim().length === 0) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400 },
    );
  }

  const hues = extractHues(description);
  const primaryHue = hues[0];

  const suggestions: PaletteSuggestion[] = [
    {
      name: "Bold & Direct",
      description: "Strong primary with high contrast — great for SaaS and fintech",
      primary: generatePalette(primaryHue, "complementary"),
      strategy: "complementary",
    },
    {
      name: "Harmonious Flow",
      description: "Smooth transitions between related hues — approachable and modern",
      primary: generatePalette(primaryHue + 20, "analogous"),
      strategy: "analogous",
    },
    {
      name: "Vibrant Energy",
      description: "Three distinct hues for maximum visual impact — creative and bold",
      primary: generatePalette(primaryHue + 120, "triadic"),
      strategy: "triadic",
    },
    {
      name: "Refined Accent",
      description: "Subtle split for sophisticated balance — enterprise and premium",
      primary: generatePalette(primaryHue + 15, "split-complementary"),
      strategy: "split-complementary",
    },
    {
      name: "Focused Monochrome",
      description: "Single hue with depth — minimal and professional",
      primary: generatePalette(primaryHue, "monochromatic"),
      strategy: "monochromatic",
    },
  ];

  return NextResponse.json({ suggestions });
}
