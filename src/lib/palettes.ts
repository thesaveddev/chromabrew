/**
 * The curated palette gallery: the browsable catalog behind `/palettes`.
 *
 * Each palette is hand-built (five stops that work together), not generated —
 * the gallery's value is curation. Themes group palettes the way people search
 * for them (retro, pastel, …); palette pages deep-link into the generator with
 * `?primary=&secondary=&accent=` so every page is a working starting point,
 * not a static swatch card.
 *
 * User-published projects join this catalog next (the `Project` model already
 * carries `visibility`); until then these seeds are the whole gallery, which
 * is why they must be genuinely good.
 */

export interface PaletteTheme {
  slug: string;
  name: string;
  tagline: string;
  /** Two honest paragraphs rendered on the collection page. */
  intro: string[];
}

export interface GalleryPalette {
  slug: string;
  theme: string;
  name: string;
  /** Five hex stops, darkest feeling first where the palette has a direction. */
  colors: [string, string, string, string, string];
  /** What the palette is for, in the palette's own words — unique per page. */
  description: string;
  tags: string[];
}

const HEX = /^#[0-9a-f]{6}$/i;

export function isGalleryHex(value: string): boolean {
  return HEX.test(value);
}

export const PALETTE_THEMES: PaletteTheme[] = [
  {
    slug: "retro",
    name: "Retro",
    tagline: "Warm seventies hues, diner neons, and faded print tones.",
    intro: [
      "Retro palettes borrow from the seventies and eighties: burnt orange, avocado, mustard, teal, and chocolate — colors with the saturation turned down and the warmth turned up. They suit brands that want nostalgia without kitsch: coffee, vinyl, indie games, craft goods.",
      "The discipline with retro is restraint: pick one loud period color (the orange, the mustard) and let the browns and creams do the quiet work. Two loud retro hues at full weight tips straight into costume.",
    ],
  },
  {
    slug: "pastel",
    name: "Pastel",
    tagline: "Soft, high-lightness hues for calm interfaces and gentle brands.",
    intro: [
      "Pastel palettes live at high lightness and low-to-mid chroma: powder blue, blush, mint, lavender, butter. They read as calm, friendly, and modern — the default language of wellness apps, parenting products, and soft fintech.",
      "Pastels demand contrast honesty: most pastel-on-white text fails WCAG, so every palette here is designed around a darker anchor color that carries the type while the pastels carry the mood.",
    ],
  },
  {
    slug: "earthy",
    name: "Earthy",
    tagline: "Clay, moss, sand, and bark — grounded palettes that feel honest.",
    intro: [
      "Earthy palettes come from soil and forest: terracotta, olive, sand, bark brown, sage. They suit sustainability brands, outdoor gear, ceramics, and anything that wants to feel grown rather than manufactured.",
      "The risk with earth tones is mud — neighbors on the wheel collapsing into one brown. Each palette here keeps one clear lightness traveler (a sand or cream) so the darks have somewhere to stand out against.",
    ],
  },
  {
    slug: "ocean",
    name: "Ocean",
    tagline: "Deep navy to seafoam — blues and teals with real depth.",
    intro: [
      "Ocean palettes run the full blue range: abyssal navy, steel blue, teal, aqua, seafoam. They are the working uniform of SaaS, fintech, and health tech — trustworthy by association, but only distinctive with intention.",
      "Depth is the whole game: five blues at similar lightness merge into one. Every palette here spans near-navy to near-white so grounds, borders, actions, and ink each have their own water to swim in.",
    ],
  },
  {
    slug: "sunset",
    name: "Sunset",
    tagline: "Amber, coral, rose, and dusk violet — warmth with energy.",
    intro: [
      "Sunset palettes move from golden amber through coral and rose into dusk violet — the gradient the sky performs nightly. They power heroes, events, food brands, and anything that benefits from appetite and warmth.",
      "Sunsets need darkness to land: without a deep plum or espresso anchor, warm palettes float away. Each palette here includes its night sky — the dark that makes the amber glow.",
    ],
  },
  {
    slug: "neon",
    name: "Neon",
    tagline: "Electric nights — laser color on abyssal darks.",
    intro: [
      "Neon palettes are built for the dark: hot magentas, acid greens and electric cyans that only read as neon against near-black grounds. They power gaming, nightlife, music and dev tools with an after-hours side.",
      "Neon fails in daylight — these hues on white look cheap, not electric. Every palette here carries its own darkness, so lift the full five stops and keep the backgrounds deep.",
    ],
  },
  {
    slug: "autumn",
    name: "Autumn",
    tagline: "Harvest golds, orchard reds, and fog-softened greens.",
    intro: [
      "Autumn palettes run from harvest gold through orchard red into umber and fog: warmth with gravity. They suit food brands, outdoor goods, publishing and anything seasonal that wants to feel gathered rather than manufactured.",
      "The trap is pumpkin-spice cliché — orange plus brown with nothing to say. Each palette here earns its warmth with a counterweight: a fog green, a deep plum shadow, a cream that lets the ambers breathe.",
    ],
  },
  {
    slug: "frost",
    name: "Frost",
    tagline: "Glacier blues, alpine dawns, and evergreen under ice.",
    intro: [
      "Frost palettes live at the cold end of the wheel: glacier blue, alpine rose-dawn, evergreen under ice. They read as crisp, premium and calm — winter collections, skincare, Nordic brands, snow sports.",
      "Cold palettes go sterile without a warm whisper. Most palettes here hide one: a dawn pink, a pale gold ground, something that keeps the ice from feeling uninhabited.",
    ],
  },
  {
    slug: "jewel",
    name: "Jewel",
    tagline: "Emerald, sapphire, ruby — richness with restraint.",
    intro: [
      "Jewel palettes take saturated gemstone hues and set them like stones: deep grounds, one rich saturated middle, metallic or porcelain highlights. They suit wine, hospitality, premium consumer goods and anything that charges accordingly.",
      "Richness curdles into gaudiness past one jewel per palette. Each entry here commits to a single stone — emerald or sapphire or ruby, never all three — and lets neutrals do the framing.",
    ],
  },
  {
    slug: "monochrome",
    name: "Monochrome",
    tagline: "One hue, five stops — the disciplined power of a single color.",
    intro: [
      "Monochrome palettes prove that one hue is enough: five perceptual steps from near-white tint to near-black shade, all sharing a single hue angle. They suit editorial products, technical brands, and minimal portfolios where restraint is the message.",
      "Single-hue systems live or die on step spacing — even lightness travel, no jumps. Every palette here is spaced for real UI roles: ground, border, secondary, action, ink.",
    ],
  },
];

export const GALLERY_PALETTES: GalleryPalette[] = [
  // ——— Retro ———
  {
    slug: "burnt-orange-diner",
    theme: "retro",
    name: "Burnt Orange Diner",
    colors: ["#3b2314", "#9c4a1a", "#d97d2e", "#e8b04b", "#f5e6c8"],
    description:
      "A seventies diner in five stops: espresso brown grounds, burnt orange actions, mustard highlights, cream surfaces. Built for warm, nostalgic brands with appetite.",
    tags: ["warm", "vintage", "restaurant", "orange"],
  },
  {
    slug: "avocado-kitchen",
    theme: "retro",
    name: "Avocado Kitchen",
    colors: ["#2e3b1f", "#5c6e3c", "#8a9a5b", "#c9cf9f", "#f1ecd9"],
    description:
      "Avocado green with harvest-gold undertones, grounded in deep olive ink. The seventies kitchen palette, tuned for organic food and homeware brands.",
    tags: ["green", "vintage", "organic", "kitchen"],
  },
  {
    slug: "roller-rink-neon",
    theme: "retro",
    name: "Roller Rink Neon",
    colors: ["#1d1b3a", "#4b2e83", "#c2437f", "#ef6f53", "#f9e08b"],
    description:
      "Eighties rink-neon over a deep violet night: magenta and coral energy with a golden highlight. For entertainment, gaming, and anything after dark.",
    tags: ["neon", "eighties", "gaming", "violet"],
  },
  {
    slug: "faded-print",
    theme: "retro",
    name: "Faded Print",
    colors: ["#43302b", "#7d5a4f", "#b08d7e", "#d9c2b2", "#f3e9dd"],
    description:
      "Sun-faded print tones: cocoa ink, dusty rose-browns, parchment grounds. Quietly vintage — book covers, stationery, slow-living brands.",
    tags: ["muted", "print", "vintage", "neutral"],
  },
  // ——— Pastel ———
  {
    slug: "powder-morning",
    theme: "pastel",
    name: "Powder Morning",
    colors: ["#3d5a80", "#98c1d9", "#b8d8e8", "#e0fbfc", "#f7fdff"],
    description:
      "Powder blues ascending to near-white, anchored by a slate-blue ink that keeps every text pair honest. Calm SaaS, health apps, clean portfolios.",
    tags: ["blue", "calm", "saas", "minimal"],
  },
  {
    slug: "blush-studio",
    theme: "pastel",
    name: "Blush Studio",
    colors: ["#6d3b47", "#b56576", "#e5989b", "#f4c7c3", "#fbeae9"],
    description:
      "Blush pinks with a berry-plum anchor for type and actions. Beauty, wellness, and boutique brands that need softness with a spine.",
    tags: ["pink", "beauty", "wellness", "soft"],
  },
  {
    slug: "mint-condition",
    theme: "pastel",
    name: "Mint Condition",
    colors: ["#1f4d3a", "#4d8a6d", "#95d5b2", "#d8f3dc", "#f4fbf6"],
    description:
      "Mint ascending from deep botanical green — the rare pastel with built-in contrast. Fintech-for-good, eco apps, fresh food brands.",
    tags: ["green", "fresh", "eco", "fintech"],
  },
  {
    slug: "lavender-haze",
    theme: "pastel",
    name: "Lavender Haze",
    colors: ["#4a3f6b", "#7b6fa8", "#b3a7d6", "#dcd5ef", "#f5f2fb"],
    description:
      "Lavender with a dusky violet anchor: dreamy grounds, credible text. Sleep apps, journaling, creative tools with a gentle side.",
    tags: ["violet", "sleep", "creative", "calm"],
  },
  // ——— Earthy ———
  {
    slug: "terracotta-kiln",
    theme: "earthy",
    name: "Terracotta Kiln",
    colors: ["#3d2b1f", "#7f4f2c", "#c08552", "#e3b77e", "#f6e7ce"],
    description:
      "Fired clay from kiln-dark to sand: terracotta actions on warm grounds. Ceramics, craft, Mediterranean food — handmade in hex form.",
    tags: ["clay", "craft", "warm", "terracotta"],
  },
  {
    slug: "moss-trail",
    theme: "earthy",
    name: "Moss Trail",
    colors: ["#232d1d", "#4a5d3a", "#7d8f69", "#b5bf9e", "#ecefdc"],
    description:
      "Forest-floor greens from bark-dark to lichen-light. Outdoor gear, sustainability, gardening — grounded and quietly confident.",
    tags: ["green", "forest", "outdoor", "sustainable"],
  },
  {
    slug: "desert-sand",
    theme: "earthy",
    name: "Desert Sand",
    colors: ["#4a3a28", "#8a6d3f", "#c2a15e", "#e6cf9b", "#faf3df"],
    description:
      "Sun-baked sand tones with an umber anchor: travel, architecture, premium naturals. Warm minimalism that never goes cold.",
    tags: ["sand", "travel", "minimal", "warm"],
  },
  {
    slug: "bark-and-sage",
    theme: "earthy",
    name: "Bark & Sage",
    colors: ["#2f2a24", "#5f6f5e", "#8ba888", "#c2d4bf", "#eef3ea"],
    description:
      "Dark bark ink with sage mids and fog-light grounds. Apothecary, skincare, slow fashion — natural without the granola cliché.",
    tags: ["sage", "skincare", "natural", "muted"],
  },
  // ——— Ocean ———
  {
    slug: "abyssal-saas",
    theme: "ocean",
    name: "Abyssal SaaS",
    colors: ["#0b1e3a", "#1d4e89", "#2f8f9d", "#7fc8bc", "#e6f4f1"],
    description:
      "Abyssal navy to seafoam: the trustworthy SaaS gradient with teal energy in the middle. Dashboards, developer tools, fintech that means it.",
    tags: ["blue", "saas", "fintech", "dashboard"],
  },
  {
    slug: "harbor-fog",
    theme: "ocean",
    name: "Harbor Fog",
    colors: ["#2b3a4a", "#5a7d8a", "#8fb3b8", "#c8dcd9", "#f0f6f4"],
    description:
      "Steel blue-grays like morning fog over water: professional, quiet, premium. Consulting, legal tech, enterprise with taste.",
    tags: ["gray-blue", "enterprise", "professional", "muted"],
  },
  {
    slug: "coral-reef",
    theme: "ocean",
    name: "Coral Reef",
    colors: ["#123a4d", "#1f7a8c", "#3fb0ac", "#f4a261", "#fdefe0"],
    description:
      "Teal depths with a coral surprise — the reef palette. Travel, marine conservation, food brands that live near water. Proof that one warm accent transforms cold blues.",
    tags: ["teal", "coral", "travel", "accent"],
  },
  {
    slug: "midnight-tide",
    theme: "ocean",
    name: "Midnight Tide",
    colors: ["#080f24", "#232a5c", "#3d5a99", "#6fa8dc", "#d4e4f7"],
    description:
      "Midnight blues built for dark mode first: luminous mid-blues on abyssal grounds. Dev tools, gaming, night-owl products.",
    tags: ["dark", "navy", "devtools", "gaming"],
  },
  // ——— Sunset ———
  {
    slug: "golden-hour",
    theme: "sunset",
    name: "Golden Hour",
    colors: ["#3a1f3d", "#8e3b5e", "#d95d5e", "#f2a65a", "#f9e0ae"],
    description:
      "The full sunset arc: dusk violet, rose, ember orange, golden light. Events, hospitality, food — appetite and warmth in five stops.",
    tags: ["warm", "events", "food", "gradient"],
  },
  {
    slug: "ember-glow",
    theme: "sunset",
    name: "Ember Glow",
    colors: ["#241623", "#5c2a3c", "#a03e4e", "#e07a5f", "#f6d8b8"],
    description:
      "Embers over espresso dark: smoky rose-reds with amber heat. Grill restaurants, whiskey brands, autumn collections with fire in them.",
    tags: ["red", "warm", "restaurant", "autumn"],
  },
  {
    slug: "citrus-dusk",
    theme: "sunset",
    name: "Citrus Dusk",
    colors: ["#2d1b4e", "#6c3fa0", "#b565a7", "#f2a65a", "#fbe3b9"],
    description:
      "Violet dusk electrified with tangerine: festivals, nightlife, bold consumer brands. High-voltage warmth that still grounds in plum.",
    tags: ["violet", "festival", "bold", "nightlife"],
  },
  {
    slug: "peach-fuzz-dawn",
    theme: "sunset",
    name: "Peach Fuzz Dawn",
    colors: ["#5c3a3c", "#a26769", "#d0a092", "#eec9b6", "#faf0e6"],
    description:
      "The gentle dawn end of sunset: peach and clay over cocoa. Brunch spots, stationery, soft lifestyle brands that wake up kind.",
    tags: ["peach", "soft", "lifestyle", "morning"],
  },
  // ——— Monochrome ———
  {
    slug: "graphite-editorial",
    theme: "monochrome",
    name: "Graphite Editorial",
    colors: ["#16161a", "#3a3a44", "#6e6e7d", "#b5b5c0", "#f0f0f4"],
    description:
      "Neutral graphite in five even steps: the editorial workhorse. Publishing, portfolios, technical docs — typography does the talking.",
    tags: ["gray", "editorial", "minimal", "neutral"],
  },
  {
    slug: "ink-blueprint",
    theme: "monochrome",
    name: "Ink Blueprint",
    colors: ["#0a1c33", "#17406b", "#2f6ba3", "#7aa8d1", "#dce9f5"],
    description:
      "Single-hue blueprint blue from ink to ice. Architecture, engineering, technical SaaS — precision with one color.",
    tags: ["blue", "technical", "blueprint", "saas"],
  },
  {
    slug: "forest-ink",
    theme: "monochrome",
    name: "Forest Ink",
    colors: ["#0f2419", "#1f4d2e", "#3d7a4c", "#7fb069", "#d9e8c3"],
    description:
      "One green, forest floor to new leaf: environmental orgs, organic brands, garden apps. Proof that monochrome is never monotonous.",
    tags: ["green", "eco", "organic", "nature"],
  },
  {
    slug: "oxblood-library",
    theme: "monochrome",
    name: "Oxblood Library",
    colors: ["#2a0f14", "#5c1f27", "#93343d", "#c97b7e", "#f0d5d3"],
    description:
      "Oxblood red in five steps: leather-bound and serious. Wine, academia, premium print — drama from a single hue.",
    tags: ["red", "wine", "premium", "print"],
  },
  // ——— Neon ———
  {
    slug: "cyber-arcade",
    theme: "neon",
    name: "Cyber Arcade",
    colors: ["#0b0026", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0"],
    description:
      "Violet-night arcade glow: deep space violet grounds, magenta heat, a cyan coin-slot highlight. Gaming, streaming overlays, music visuals.",
    tags: ["neon", "gaming", "violet", "night"],
  },
  {
    slug: "laser-grid",
    theme: "neon",
    name: "Laser Grid",
    colors: ["#001219", "#005f73", "#0a9396", "#ee9b00", "#ff5d8f"],
    description:
      "Teal grid lines with amber and hot-pink lasers over abyssal teal-black. Synthwave artwork, dev tools with attitude, event identities.",
    tags: ["neon", "teal", "synthwave", "accent"],
  },
  {
    slug: "midnight-drive",
    theme: "neon",
    name: "Midnight Drive",
    colors: ["#10002b", "#5a189a", "#9d4edd", "#ff8500", "#ffda44"],
    description:
      "Synthwave sunset compressed to five stops: plum night, electric violet, ember orange, taxi-light gold. Nightlife, automotive, bold consumer brands.",
    tags: ["neon", "synthwave", "nightlife", "bold"],
  },
  {
    slug: "phosphor-terminal",
    theme: "neon",
    name: "Phosphor Terminal",
    colors: ["#02110a", "#0a5c36", "#17b26a", "#a6f4c5", "#eafff3"],
    description:
      "CRT phosphor greens from near-black to mint-white: the hacker's palette, tuned for real interfaces. Dev tools, terminal themes, security brands.",
    tags: ["neon", "green", "devtools", "terminal"],
  },
  // ——— Autumn ———
  {
    slug: "harvest-moon",
    theme: "autumn",
    name: "Harvest Moon",
    colors: ["#2b1a12", "#8c4a2f", "#c98a3b", "#e8b04b", "#f7ead7"],
    description:
      "Harvest golds over umber dark: amber actions, golden highlights, cream grounds. Farm brands, bakeries, autumn collections with appetite.",
    tags: ["warm", "autumn", "gold", "food"],
  },
  {
    slug: "orchard-cider",
    theme: "autumn",
    name: "Orchard Cider",
    colors: ["#3b2314", "#a44a3f", "#d97941", "#e9c46a", "#faf3e3"],
    description:
      "Orchard reds pressed into cider amber: apple-skin red, caramel mid, golden light. Beverage, hospitality, seasonal retail with warmth.",
    tags: ["red", "autumn", "beverage", "warm"],
  },
  {
    slug: "foggy-orchard",
    theme: "autumn",
    name: "Foggy Orchard",
    colors: ["#28302a", "#5f6f5e", "#a3b18a", "#d4a373", "#faedcd"],
    description:
      "Fog-softened greens with a single tan traveler: misty mornings, not pumpkin spice. Outdoor brands, slow living, editorial autumn.",
    tags: ["muted", "autumn", "green", "editorial"],
  },
  {
    slug: "cranberry-woods",
    theme: "autumn",
    name: "Cranberry Woods",
    colors: ["#33121c", "#6e2a3c", "#a44a5a", "#d9a05b", "#f4e3c2"],
    description:
      "Cranberry reds against golden tan: berry depth with harvest light. Wine, holiday collections, premium food that takes autumn seriously.",
    tags: ["red", "autumn", "wine", "premium"],
  },
  // ——— Frost ———
  {
    slug: "glacier-milk",
    theme: "frost",
    name: "Glacier Milk",
    colors: ["#1b2a4a", "#3e5c76", "#74a9cf", "#bcd9ea", "#f4fafd"],
    description:
      "Glacier blues from deep water to milk-ice: the crisp SaaS gradient gone sub-zero. Skincare, winter sports, Nordic brands with clarity.",
    tags: ["blue", "winter", "minimal", "skincare"],
  },
  {
    slug: "alpine-dawn",
    theme: "frost",
    name: "Alpine Dawn",
    colors: ["#2c3e50", "#7f8c9b", "#c9d6df", "#f2b8c6", "#fdf0f3"],
    description:
      "Cold slate dawn blushing pink: alpine mornings in five stops. Wellness, hospitality, lifestyle brands that wake up cold and kind.",
    tags: ["winter", "pink", "wellness", "soft"],
  },
  {
    slug: "evergreen-frost",
    theme: "frost",
    name: "Evergreen Frost",
    colors: ["#122620", "#2f5d50", "#6aa68b", "#b8d8d3", "#eef7f5"],
    description:
      "Evergreen under ice: deep spruce ink, frosted mids, near-white grounds. Environmental orgs, winter outdoor gear, crisp packaging.",
    tags: ["green", "winter", "outdoor", "eco"],
  },
  {
    slug: "polar-night",
    theme: "frost",
    name: "Polar Night",
    colors: ["#060d1f", "#1c2f5e", "#3d5a99", "#8fb3e8", "#dce9fa"],
    description:
      "Arctic night blues built for dark mode: luminous steel blues on abyssal grounds. Space tech, security, night-owl products with nerve.",
    tags: ["dark", "blue", "winter", "devtools"],
  },
  // ——— Jewel ———
  {
    slug: "emerald-vault",
    theme: "jewel",
    name: "Emerald Vault",
    colors: ["#0b1f1a", "#14532d", "#1f8a4c", "#d4af37", "#f5ecd7"],
    description:
      "Emerald with a gold clasp: deep green vault, metallic highlight, porcelain grounds. Private banking, premium hospitality, fine goods.",
    tags: ["green", "luxury", "gold", "premium"],
  },
  {
    slug: "sapphire-club",
    theme: "jewel",
    name: "Sapphire Club",
    colors: ["#0a1030", "#1e3a8a", "#3b82c4", "#c0c8d8", "#eef1f6"],
    description:
      "Single-stone sapphire from club-night navy to silver: depth, precision, quiet money. Law, aviation, members' clubs, premium SaaS.",
    tags: ["blue", "luxury", "premium", "enterprise"],
  },
  {
    slug: "ruby-reserve",
    theme: "jewel",
    name: "Ruby Reserve",
    colors: ["#22060d", "#7f1d2d", "#c0263c", "#e8a0a8", "#f9e8e7"],
    description:
      "Reserve ruby: oxblood shadows, true-red heart, blush highlights. Wine labels, perfumery, fashion houses that never shout.",
    tags: ["red", "luxury", "wine", "fashion"],
  },
  {
    slug: "amethyst-hour",
    theme: "jewel",
    name: "Amethyst Hour",
    colors: ["#1d1030", "#4c1d95", "#7c3aed", "#c4b5fd", "#f1eafe"],
    description:
      "Amethyst at dusk: violet depth with lavender light. Beauty-tech, evening events, spiritual brands with a premium finish.",
    tags: ["violet", "luxury", "beauty", "evening"],
  },
];

export function themeBySlug(slug: string): PaletteTheme | undefined {
  return PALETTE_THEMES.find((theme) => theme.slug === slug);
}

export function paletteBySlug(
  theme: string,
  slug: string,
): GalleryPalette | undefined {
  return GALLERY_PALETTES.find((p) => p.theme === theme && p.slug === slug);
}

export function palettesForTheme(theme: string): GalleryPalette[] {
  return GALLERY_PALETTES.filter((p) => p.theme === theme);
}

export function relatedPalettes(palette: GalleryPalette, count = 3): GalleryPalette[] {
  const sameTheme = GALLERY_PALETTES.filter(
    (p) => p.theme === palette.theme && p.slug !== palette.slug,
  );
  const rest = GALLERY_PALETTES.filter((p) => p.theme !== palette.theme);
  return [...sameTheme, ...rest].slice(0, count);
}

/** Deep-link a palette into the generator: first color leads, next two follow. */
export function paletteGeneratorHref(palette: GalleryPalette): string {
  const [primary, secondary, accent] = palette.colors;
  const params = new URLSearchParams({
    primary: primary.replace("#", ""),
    secondary: secondary.replace("#", ""),
    accent: accent.replace("#", ""),
  });
  return `/design-system?${params.toString()}`;
}
