/**
 * Named color reference: the curated dataset behind `/colors`.
 *
 * Thirty-seven colors people actually search for, grouped by family. Each
 * entry carries hand-written copy (description + uses); everything numeric —
 * formats, scale, harmonies, contrast — is computed at render time by
 * `buildColorReference` from the single hex, so pages share one source of
 * truth with the tools.
 */

export interface NamedColor {
  slug: string;
  name: string;
  hex: string;
  family: string;
  /** Two sentences, unique per color: character + one design directive. */
  description: string;
  uses: string[];
}

export const COLOR_FAMILIES = [
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Teal",
  "Blue",
  "Violet",
  "Pink",
  "Brown",
  "Neutrals",
] as const;

export const NAMED_COLORS: NamedColor[] = [
  // ——— Red ———
  {
    slug: "red",
    name: "Red",
    hex: "#FF0000",
    family: "Red",
    description:
      "Pure red is the loudest color on the screen — maximum chroma, zero subtlety. Reserve it for errors, alerts, and moments that must interrupt; anywhere else, reach for its darker siblings.",
    uses: ["error states", "alerts", "sale badges"],
  },
  {
    slug: "crimson",
    name: "Crimson",
    hex: "#DC143C",
    family: "Red",
    description:
      "Crimson deepens pure red toward blue, trading alarm for drama. It carries premium and editorial weight — wine labels, fashion, confident CTAs that don't shout.",
    uses: ["premium CTAs", "editorial accents", "wine and dining brands"],
  },
  {
    slug: "scarlet",
    name: "Scarlet",
    hex: "#FF2400",
    family: "Red",
    description:
      "Scarlet leans orange-hot: the red of flames, sports cars, and urgency with warmth. It vibrates against white, so give it room and keep surrounding colors quiet.",
    uses: ["sports brands", "urgency banners", "entertainment"],
  },
  // ——— Orange ———
  {
    slug: "orange",
    name: "Orange",
    hex: "#FFA500",
    family: "Orange",
    description:
      "Web orange is friendly energy — the CTA color for brands too warm for red and too playful for blue. It fails white text, so pair it with deep brown or charcoal type, never white.",
    uses: ["CTA buttons", "youth brands", "food delivery"],
  },
  {
    slug: "burnt-orange",
    name: "Burnt Orange",
    hex: "#CC5500",
    family: "Orange",
    description:
      "Burnt orange is autumn in a hex value: earthy, nostalgic, endlessly wearable. It anchors retro palettes and warms up SaaS brands without the immaturity of bright orange.",
    uses: ["retro palettes", "autumn campaigns", "craft brands"],
  },
  {
    slug: "coral",
    name: "Coral",
    hex: "#FF7F50",
    family: "Orange",
    description:
      "Coral sits between pink warmth and orange energy — approachable, modern, slightly feminine without cliché. It glows on dark backgrounds, where it makes a superb accent.",
    uses: ["beauty tech", "dark-mode accents", "hospitality"],
  },
  {
    slug: "amber",
    name: "Amber",
    hex: "#FFBF00",
    family: "Orange",
    description:
      "Amber is golden-hour yellow-orange: optimistic, premium, appetite-stirring. It needs a dark partner (espresso, charcoal) to avoid washing out — amber alone is all light, no shadow.",
    uses: ["premium highlights", "food brands", "warning accents"],
  },
  // ——— Yellow ———
  {
    slug: "gold",
    name: "Gold",
    hex: "#FFD700",
    family: "Yellow",
    description:
      "Gold reads as value itself — awards, premium tiers, first place. It only works surrounded by darkness; on white it disappears, on black it glows like a medal.",
    uses: ["premium tiers", "badges", "finance accents"],
  },
  {
    slug: "mustard",
    name: "Mustard",
    hex: "#E1AD01",
    family: "Yellow",
    description:
      "Mustard is yellow with the volume lowered and the taste raised: retro kitchens, editorial highlights, workwear brands. It pairs beautifully with navy and chocolate.",
    uses: ["editorial highlights", "retro brands", "packaging"],
  },
  {
    slug: "lemon",
    name: "Lemon",
    hex: "#FFF44F",
    family: "Yellow",
    description:
      "Lemon is pure citrus zing — the highest-energy yellow that still reads as yellow. Use it for highlights and warnings, never for text, and always against deep grounds.",
    uses: ["highlights", "warning strips", "summer campaigns"],
  },
  // ——— Green ———
  {
    slug: "emerald",
    name: "Emerald",
    hex: "#50C878",
    family: "Green",
    description:
      "Emerald is the confident middle green: jewel-toned, trustworthy, alive. It anchors fintech success states and eco brands alike — growth you can bank on.",
    uses: ["success states", "fintech", "eco brands"],
  },
  {
    slug: "forest-green",
    name: "Forest Green",
    hex: "#228B22",
    family: "Green",
    description:
      "Forest green is deep, traditional, institutional — the green of universities, parks departments, and heritage brands. It passes white text easily, making it a workhorse dark accent.",
    uses: ["heritage brands", "outdoor gear", "dark accents"],
  },
  {
    slug: "lime-green",
    name: "Lime Green",
    hex: "#32CD32",
    family: "Green",
    description:
      "Lime green is electric nature: Spotify energy, gaming highlights, startup zing. It demands dark partners and small doses — a full lime background is a dare, not a design.",
    uses: ["music and gaming", "startup accents", "dark-mode highlights"],
  },
  {
    slug: "olive",
    name: "Olive",
    hex: "#808000",
    family: "Green",
    description:
      "Olive is green gone to ground — military, utilitarian, earthy. It brings gravity to palettes that would otherwise float, and pairs naturally with sand and cream.",
    uses: ["outdoor and utility", "earthy palettes", "menswear"],
  },
  // ——— Teal ———
  {
    slug: "teal",
    name: "Teal",
    hex: "#008080",
    family: "Teal",
    description:
      "Teal is the professional's blue-green: trustworthy like blue, alive like green. It dominates SaaS and healthcare for a reason — calm competence in a single hue.",
    uses: ["SaaS brands", "healthcare", "dashboards"],
  },
  {
    slug: "turquoise",
    name: "Turquoise",
    hex: "#40E0D0",
    family: "Teal",
    description:
      "Turquoise is vacation water — bright, clear, irresistible against deep navy. It lifts travel, tropical, and jewelry brands, but needs darkness behind it to avoid fizzing out.",
    uses: ["travel brands", "jewelry", "tropical themes"],
  },
  {
    slug: "aqua",
    name: "Aqua",
    hex: "#00FFFF",
    family: "Teal",
    description:
      "Pure aqua is maximum-brightness cyan: electric, aquatic, unmistakable. A dark-mode specialist — on black it glows, on white it vanishes. Handle accordingly.",
    uses: ["dark-mode accents", "tech highlights", "data visualization"],
  },
  // ——— Blue ———
  {
    slug: "navy",
    name: "Navy",
    hex: "#000080",
    family: "Blue",
    description:
      "Navy is authority in color form: finance, law, enterprise, uniforms. Darker than royal but softer than black, it grounds palettes while staying unmistakably blue.",
    uses: ["finance", "enterprise", "dark grounds"],
  },
  {
    slug: "royal-blue",
    name: "Royal Blue",
    hex: "#4169E1",
    family: "Blue",
    description:
      "Royal blue is vivid institutional confidence — links, uniforms, flags. It passes white text, which makes it one of the few saturated blues safe for body-size type.",
    uses: ["links", "corporate brands", "sports teams"],
  },
  {
    slug: "sky-blue",
    name: "Sky Blue",
    hex: "#87CEEB",
    family: "Blue",
    description:
      "Sky blue is open air: friendly, light, optimistic. A background and illustration color first — it rarely carries text, and shouldn't have to.",
    uses: ["backgrounds", "illustrations", "children's products"],
  },
  {
    slug: "steel-blue",
    name: "Steel Blue",
    hex: "#4682B4",
    family: "Blue",
    description:
      "Steel blue tempers brightness with gray: professional without navy stiffness, modern without startup neon. The enterprise-casual of blues.",
    uses: ["B2B SaaS", "consulting", "professional services"],
  },
  // ——— Violet ———
  {
    slug: "purple",
    name: "Purple",
    hex: "#800080",
    family: "Violet",
    description:
      "Pure purple is royalty, mystery, and creativity compressed into one hue. It polarizes — beloved by beauty and gaming, avoided by banks — so use it where personality is the product.",
    uses: ["beauty brands", "gaming", "creative tools"],
  },
  {
    slug: "violet",
    name: "Violet",
    hex: "#8F00FF",
    family: "Violet",
    description:
      "Electric violet is purple turned all the way up: gradients, nightlife, AI-era tech. It owns the dark — on black backgrounds it practically emits light.",
    uses: ["gradients", "AI products", "nightlife and events"],
  },
  {
    slug: "indigo",
    name: "Indigo",
    hex: "#4B0082",
    family: "Violet",
    description:
      "Indigo is violet with depth and denim in its veins: deep, contemplative, premium. It grounds creative palettes the way navy grounds corporate ones.",
    uses: ["premium creative", "denim and fashion", "dark themes"],
  },
  {
    slug: "lavender",
    name: "Lavender",
    hex: "#E6E6FA",
    family: "Violet",
    description:
      "Lavender is violet at a whisper: calm, clean, slightly nostalgic. A background color that flatters content — but it needs a dusky violet partner for any text it touches.",
    uses: ["calm backgrounds", "wellness", "wedding brands"],
  },
  // ——— Pink ———
  {
    slug: "hot-pink",
    name: "Hot Pink",
    hex: "#FF69B4",
    family: "Pink",
    description:
      "Hot pink is unapologetic: bold, fun, impossible to ignore. It converts brilliantly as an accent for youth and beauty brands — and overwhelms everything when overused.",
    uses: ["beauty brands", "youth marketing", "accent CTAs"],
  },
  {
    slug: "magenta",
    name: "Magenta",
    hex: "#FF00FF",
    family: "Pink",
    description:
      "Pure magenta is printer's ink turned to eleven: the gradient-half of every sunset hero. Best deployed in blends and glows rather than flat fills.",
    uses: ["gradients", "print-inspired design", "event branding"],
  },
  {
    slug: "blush-pink",
    name: "Blush",
    hex: "#FFC0CB",
    family: "Pink",
    description:
      "Blush is pink at its softest: romantic, gentle, modern-feminine without retro baggage. Skincare, weddings, and lifestyle brands live here — with deeper berry partners for type.",
    uses: ["skincare", "weddings", "lifestyle brands"],
  },
  // ——— Brown ———
  {
    slug: "chocolate",
    name: "Chocolate",
    hex: "#D2691E",
    family: "Brown",
    description:
      "Chocolate (the web's warm mid-brown) is comfort and appetite: coffee, baking, autumn. Richer than tan, friendlier than espresso — the food-industry workhorse.",
    uses: ["food and coffee", "autumn themes", "cozy brands"],
  },
  {
    slug: "saddle-brown",
    name: "Saddle Brown",
    hex: "#8B4513",
    family: "Brown",
    description:
      "Saddle brown is leather and earth: western, rugged, honest. It grounds rustic palettes and gives craft brands their backbone.",
    uses: ["leather goods", "rustic brands", "outdoor retail"],
  },
  {
    slug: "tan",
    name: "Tan",
    hex: "#D2B48C",
    family: "Brown",
    description:
      "Tan is the quiet neutral of the brown family: warm backgrounds that never go cold-gray. It flatters photography and food, and disappears politely behind content.",
    uses: ["warm backgrounds", "photography sites", "food blogs"],
  },
  // ——— Neutrals ———
  {
    slug: "black",
    name: "Black",
    hex: "#000000",
    family: "Neutrals",
    description:
      "Pure black is maximum contrast and maximum drama — and on screens, often too much of both. Most interfaces prefer tinted charcoals; reserve #000000 for text on white, OLED themes, and deliberate statements.",
    uses: ["body text", "OLED dark mode", "luxury brands"],
  },
  {
    slug: "white",
    name: "White",
    hex: "#FFFFFF",
    family: "Neutrals",
    description:
      "White is the absence that makes everything else work: breathing room, contrast anchor, default ground of the web. Its design job is restraint — the discipline to leave space empty.",
    uses: ["page grounds", "contrast anchor", "minimal brands"],
  },
  {
    slug: "gray",
    name: "Gray",
    hex: "#808080",
    family: "Neutrals",
    description:
      "Mid gray is the fulcrum of every neutral system — and a trap at text sizes, where it fails white backgrounds. Use it for borders, dividers, and disabled states; promote text to darker steps.",
    uses: ["borders", "secondary UI", "disabled states"],
  },
  {
    slug: "charcoal",
    name: "Charcoal",
    hex: "#36454F",
    family: "Neutrals",
    description:
      "Charcoal is black with judgment: softer than #000, stronger than gray, often with a blue whisper. The default ink of considered interfaces and the ground of refined dark themes.",
    uses: ["body ink", "dark themes", "premium interfaces"],
  },
  {
    slug: "silver",
    name: "Silver",
    hex: "#C0C0C0",
    family: "Neutrals",
    description:
      "Silver is light gray with a metallic memory: tech, precision, Apple-era minimalism. Lovely for dividers and secondary surfaces; helpless as text on white.",
    uses: ["tech brands", "dividers", "secondary surfaces"],
  },
];

export function colorBySlug(slug: string): NamedColor | undefined {
  return NAMED_COLORS.find((color) => color.slug === slug);
}

export function colorsForFamily(family: string): NamedColor[] {
  return NAMED_COLORS.filter((color) => color.family === family);
}

export function relatedColors(color: NamedColor, count = 4): NamedColor[] {
  const sameFamily = NAMED_COLORS.filter(
    (c) => c.family === color.family && c.slug !== color.slug,
  );
  const rest = NAMED_COLORS.filter((c) => c.family !== color.family);
  return [...sameFamily, ...rest].slice(0, count);
}
