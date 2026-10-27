// Expand the palette gallery to 1000 entries, deterministically.
//
// Reads the curated palettes in src/lib/palettes.ts, mines per-theme hue
// pools, then generates 16 new palettes per theme (50 themes x 20 = 1000
// total with the 200 curated ones) and writes src/lib/palettes-generated.ts.
//
// Run: node scripts/generate-gallery-palettes.mjs
// The script is fully deterministic (seeded PRNG) and exits non-zero if any
// quality gate or uniqueness invariant fails.

import { readFileSync, writeFileSync } from "node:fs";

const TARGET_TOTAL = 1000;
const PER_THEME = 16;
const SEED = 1000;

/* ------------------------------------------------------------------ */
/* Seeded PRNG                                                          */
/* ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* OKLCH -> sRGB (same matrices as src/lib/design-system/colour/convert) */
/* ------------------------------------------------------------------ */

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function oklchToRgb(l, c, hDeg) {
  const L = clamp01(l);
  const rad = (hDeg * Math.PI) / 180;
  const A = Math.cos(rad) * c;
  const B = Math.sin(rad) * c;
  const attempt = (ch) => {
    const a = Math.cos(rad) * ch;
    const b = Math.sin(rad) * ch;
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l2 = l_ ** 3, m2 = m_ ** 3, s2 = s_ ** 3;
    return {
      r: 4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2,
      g: -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2,
      b: -0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2,
    };
  };
  const inGamut = ({ r, g, b }, e = 1e-4) =>
    r >= -e && r <= 1 + e && g >= -e && g <= 1 + e && b >= -e && b <= 1 + e;
  let chroma = Math.max(0, c);
  if (!inGamut(attempt(chroma))) {
    let lo = 0, hi = chroma;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(attempt(mid))) lo = mid; else hi = mid;
    }
    chroma = lo;
  }
  const lin = attempt(chroma);
  const toSrgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  const ch = (v) => Math.round(clamp01(toSrgb(clamp01(v))) * 255);
  const r = ch(lin.r), g = ch(lin.g), b = ch(lin.b);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function hexToOklab(hex) {
  const n = parseInt(hex.slice(1), 16);
  const toLin = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLin((n >> 16) & 255), g = toLin((n >> 8) & 255), b = toLin(n & 255);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabDistance(a, b) {
  const pa = hexToOklab(a), pb = hexToOklab(b);
  return Math.sqrt((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2 + (pa[2] - pb[2]) ** 2);
}

/* ------------------------------------------------------------------ */
/* Curated data + mined theme profiles                                  */
/* ------------------------------------------------------------------ */

const src = readFileSync("src/lib/palettes.ts", "utf8");
const gallerySrc = src.slice(src.indexOf("export const GALLERY_PALETTES"));
const themeSrc = src.slice(0, src.indexOf("export const GALLERY_PALETTES"));
const themeSlugs = [...themeSrc.matchAll(/slug: "([a-z-]+)"/g)].map((m) => m[1]);

function hexToHslHueSat(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2, d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

const curated = [...gallerySrc.matchAll(
  /slug: "([^"]+)",\s*theme: "([a-z-]+)",\s*name: "([^"]+)",\s*colors: \[([^\]]+)\][\s\S]*?description:\s*(?:"([^"]+)"|"([^"]+)")/g,
)];
// Simpler robust parse: entries with multiline descriptions.
const entryRe = /slug: "([^"]+)",\s*theme: "([a-z-]+)",\s*name: "([^"]+)",\s*colors: \[([^\]]+)\],\s*description:\s*("([^"]*)")/g;
const palettes = [...gallerySrc.matchAll(entryRe)].map((m) => ({
  slug: m[1], theme: m[2], name: m[3],
  colors: [...m[4].matchAll(/"(#[0-9a-f]{6})"/gi)].map((c) => c[1].toLowerCase()),
  description: m[6],
}));

// Fallback for any entries the strict regex missed (multiline safety).
if (palettes.length !== 200) {
  throw new Error(`expected 200 curated palettes, parsed ${palettes.length} — update the parser`);
}

const usedNames = new Set(palettes.map((p) => p.name.toLowerCase()));
const usedThemeSlugs = new Set(palettes.map((p) => `${p.theme}/${p.slug}`));
const usedDescriptions = new Set(palettes.map((p) => p.description));
const usedColorSets = new Set(palettes.map((p) => [...p.colors].sort().join(",")));

// Per-theme hue pools (saturated stops only) + saturation character.
const pools = {};
for (const slug of themeSlugs) pools[slug] = { hues: [], sats: [] };
for (const p of palettes) {
  for (const c of p.colors) {
    const { h, s } = hexToHslHueSat(c);
    if (s > 0.08) pools[p.theme].hues.push(Math.round(h));
    pools[p.theme].sats.push(s);
  }
}
const profiles = {};
for (const slug of themeSlugs) {
  const { hues, sats } = pools[slug];
  let sx = 0, sy = 0;
  for (const h of hues) { sx += Math.cos((h * Math.PI) / 180); sy += Math.sin((h * Math.PI) / 180); }
  const mean = hues.length ? ((Math.atan2(sy / hues.length, sx / hues.length) * 180) / Math.PI + 360) % 360 : 0;
  let dev = 0;
  for (const h of hues) { let d = Math.abs(h - mean); if (d > 180) d = 360 - d; dev += d; }
  dev = hues.length ? dev / hues.length : 0;
  const satAvg = sats.reduce((a, b) => a + b, 0) / sats.length;
  profiles[slug] = { hues, mean, dev, satAvg, single: dev < 22 };
}

/* ------------------------------------------------------------------ */
/* Word banks                                                           */
/* ------------------------------------------------------------------ */

const ADJECTIVES = [
  "Silent", "Amber", "Velvet", "Copper", "Misty", "Ember", "Golden",
  "Quiet", "Crimson", "Sable", "Ivory", "Cobalt", "Russet", "Pearl",
  "Ochre", "Slate", "Coral", "Indigo", "Saffron", "Teal", "Garnet",
  "Opal", "Bronze", "Linen", "Juniper", "Flint", "Sorrel", "Dusk",
  "Alpine", "Cinder", "Marigold", "Bracken", "Fable", "Harbor", "Lotus",
  "Meadow", "Onyx", "Reed", "Sable", "Tern", "Umber", "Vesper",
  "Willow", "Yarrow",
];
const NOUNS = [
  "Harbor", "Meadow", "Kiln", "Orchard", "Lantern", "Drift", "Hollow",
  "Market", "Ridge", "Garden", "Pier", "Canyon", "Studio", "Grove",
  "Signal", "Terrace", "Voyage", "Archive", "Bloom", "Frontier",
  "Hearth", "Lagoon", "Monsoon", "Pavilion", "Quarry", "Runway",
  "Summit", "Tide", "Vineyard", "Workshop", "Zephyr", "Compass",
  "Atelier", "Bazaar", "Cove", "Dune", "Estuary", "Fjord",
  "Glade", "Inn",
];
const OPENERS = [
  "A five-stop study that keeps its balance",
  "Five stops tuned to sit together without fighting",
  "A compact range built for real interfaces",
  "Five colors with a clear job each",
  "A steady five-stop progression with room to breathe",
  "A grounded set that reads as one idea",
  "Five stops with a dark anchor and a light release",
  "A measured range from ink to air",
  "A five-color chord voiced for screens",
  "A small system that covers ground, edge, and accent",
  "A quiet five-stop arc with a confident middle",
  "Five stops that hold together at any size",
];
const CRAFTS = [
  "the ink grounds the set while the lightest stop opens it up",
  "the darkest stop carries weight and the palest carries air",
  "depth comes from the low end and energy from the middle",
  "each step is spaced to stay distinguishable side by side",
  "the middle stops do the talking while the ends frame them",
  "contrast lives between the anchor ink and the light release",
];
const USES = [
  "dashboards that need trustworthy neutrals with one lively action color",
  "editorial layouts where pull-quotes and captions share one voice",
  "packaging that must read across the shelf and up close",
  "event branding with a night mode that actually glows",
  "onboarding flows where progress feels warm, not corporate",
  "data visuals where series stay separable without a legend hunt",
  "hospitality brands balancing heritage with a modern booking flow",
  "developer tools that live in dark mode most of the day",
  "seasonal campaigns that peak for a month then retire gracefully",
  "mobile apps where the palette must survive small type and sunlight",
  "marketing sites with a hero that converts and docs that calm down",
  "physical spaces — signage, menus, and walls — plus their website",
  "newsletters where the header, dividers, and buttons agree",
  "music and nightlife flyers that still print cleanly in daylight",
  "fintech surfaces where trust and one clear action coexist",
  "education products that feel encouraging without going juvenile",
  "outdoor and travel brands trading in daylight and dust",
  "food and drink labels that trigger appetite on crowded shelves",
  "nonprofit storytelling where photography leads and color supports",
  "portfolio sites where the work, not the chrome, is the color",
  "wellness products that whisper instead of shouting",
  "civic and transit interfaces legible at a glance in any weather",
];
const GENERIC_TAGS = [
  "balanced", "versatile", "interface", "brand", "modern", "warm", "calm",
  "bold", "soft", "editorial", "dashboard", "print", "web", "minimal",
  "expressive", "grounded",
];

function hueTag(h) {
  if (h < 12 || h >= 345) return "red";
  if (h < 38) return "orange";
  if (h < 65) return "amber";
  if (h < 95) return "chartreuse";
  if (h < 150) return "green";
  if (h < 175) return "teal";
  if (h < 200) return "cyan";
  if (h < 250) return "blue";
  if (h < 290) return "violet";
  if (h < 325) return "magenta";
  return "pink";
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/* ------------------------------------------------------------------ */
/* Generation                                                           */
/* ------------------------------------------------------------------ */

const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const jitter = (amt) => (rand() * 2 - 1) * amt;
const angDiff = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

function samplePalette(theme) {
  const prof = profiles[theme];
  const vivid = prof.satAvg > 0.6;
  const muted = prof.satAvg < 0.28;
  const baseC = 0.02 + prof.satAvg * 0.24;

  // Anchor hues from the theme's own pool.
  const h1 = (pick(prof.hues) + jitter(prof.single ? 6 : 14) + 360) % 360;
  let h2;
  if (prof.single) {
    h2 = (h1 + jitter(10) + 360) % 360;
  } else {
    const r = rand();
    const off = r < 0.45 ? 20 + rand() * 25 : r < 0.7 ? 150 + rand() * 60 : 100 + rand() * 50;
    const dir = rand() < 0.5 ? 1 : -1;
    // Snap the second anchor toward another real theme hue when close.
    let cand = (h1 + dir * off + 360) % 360;
    let best = cand, bestD = Infinity;
    for (const h of prof.hues) {
      const d = angDiff(h, cand);
      if (d < bestD) { bestD = d; best = h; }
    }
    h2 = bestD < 30 ? (best + jitter(10) + 360) % 360 : cand;
  }
  const h3 = (h1 + (rand() < 0.5 ? 1 : -1) * (8 + rand() * 14) + 360) % 360;

  // Lightness ladder, dark anchor first (gallery convention).
  const ladder = [0.26, 0.44, 0.59, 0.74, 0.9].map((l) => l + jitter(0.035));
  ladder.sort((a, b) => a - b);

  // Hue assignment across the ladder: darks near h1, light end drifts,
  // one vivid middle stop carries the accent (h2).
  const accentIdx = 1 + Math.floor(rand() * 3);
  const hues = ladder.map((_, i) => {
    if (i === accentIdx) return h2;
    if (i === 0) return (h1 + jitter(8) + 360) % 360;
    if (i === 4) return (h3 + jitter(8) + 360) % 360;
    return (h1 + jitter(12) + 360) % 360;
  });
  const chromas = ladder.map((_, i) => {
    const shape = 0.55 + 0.45 * Math.sin((Math.PI * i) / 4);
    let c = baseC * shape * (0.85 + rand() * 0.3);
    if (vivid && i === accentIdx) c *= 1.25;
    if (muted) c *= 0.8;
    return Math.max(0.008, c);
  });

  const colors = ladder.map((l, i) => oklchToRgb(l, chromas[i], hues[i]));

  // Quality gates (lightness span checked via the ladder directly).
  if (ladder[0] > 0.38 || ladder[4] < 0.82) return null;
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      if (oklabDistance(colors[i], colors[j]) < 0.055) return null;
    }
  }
  const key = [...colors].sort().join(",");
  if (usedColorSets.has(key)) return null;
  return { colors, anchorHue: h1 };
}

const out = [];
for (const theme of themeSlugs) {
  const themeSlugsUsed = new Set(
    palettes.filter((p) => p.theme === theme).map((p) => p.slug),
  );
  let made = 0, attempts = 0;
  while (made < PER_THEME) {
    if (++attempts > 4000) {
      throw new Error(`could not generate ${PER_THEME} palettes for ${theme} (made ${made})`);
    }
    const s = samplePalette(theme);
    if (!s) continue;
    const [c0, c1, c2, c3, c4] = s.colors;

    // Name: adjective + noun, unique globally.
    let name = null, baseSlug = null;
    for (let t = 0; t < 40 && !name; t++) {
      const cand = `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
      if (!usedNames.has(cand.toLowerCase())) name = cand;
    }
    if (!name) continue; // banks exhausted for this draw; retry
    baseSlug = slugify(name);
    let slug = baseSlug, k = 2;
    while (themeSlugsUsed.has(slug)) slug = `${baseSlug}-${k++}`;
    if (usedThemeSlugs.has(`${theme}/${slug}`)) continue;

    // Description: unique by construction (hex anchors), verified below.
    const desc =
      `${pick(OPENERS)} — ${pick(CRAFTS)}, moving from ${c0} ink through ${c2} mid-tones to ${c4} light. ` +
      `Built for ${pick(USES)}.`;
    if (desc.length <= 40) continue;
    let description = desc;
    if (usedDescriptions.has(description)) {
      description = `${desc} Reference ${slug}.`;
      if (usedDescriptions.has(description)) continue;
    }

    const tags = [...new Set([hueTag(s.anchorHue), theme, pick(GENERIC_TAGS), pick(GENERIC_TAGS)])].slice(0, 4);

    usedNames.add(name.toLowerCase());
    usedThemeSlugs.add(`${theme}/${slug}`);
    themeSlugsUsed.add(slug);
    usedDescriptions.add(description);
    usedColorSets.add([...s.colors].sort().join(","));
    out.push({ slug, theme, name, colors: s.colors, description, tags });
    made++;
  }
}

if (palettes.length + out.length !== TARGET_TOTAL) {
  throw new Error(`total ${palettes.length + out.length}, expected ${TARGET_TOTAL}`);
}
// Final invariant sweep.
{
  const combos = new Set([...usedThemeSlugs]);
  if (combos.size !== TARGET_TOTAL) throw new Error("slug collision");
  if (usedDescriptions.size !== TARGET_TOTAL) throw new Error("description collision");
  if (usedColorSets.size !== TARGET_TOTAL) throw new Error("color-set collision");
  const HEX = /^#[0-9a-f]{6}$/;
  for (const p of out) {
    if (p.colors.length !== 5 || !p.colors.every((c) => HEX.test(c))) {
      throw new Error(`bad colors in ${p.theme}/${p.slug}`);
    }
    if (p.description.length <= 40 || p.tags.length < 1) {
      throw new Error(`bad metadata in ${p.theme}/${p.slug}`);
    }
  }
}

const lines = [
  "/**",
  " * Generated gallery palettes (800) — do not hand-edit.",
  " *",
  " * Produced by scripts/generate-gallery-palettes.mjs (seeded, deterministic):",
  " * each theme contributes 16 palettes mined from its curated hue pools, with",
  " * a dark anchor first, a light release last, and spacing/quality gates so",
  " * every stop earns its place. Names, descriptions and color sets are all",
  " * unique. To regenerate, run the script and commit the result.",
  " */",
  'import type { GalleryPalette } from "./palettes";',
  "",
  "export const GENERATED_PALETTES: GalleryPalette[] = [",
];
for (const p of out) {
  lines.push("  {");
  lines.push(`    slug: "${p.slug}",`);
  lines.push(`    theme: "${p.theme}",`);
  lines.push(`    name: ${JSON.stringify(p.name)},`);
  lines.push(`    colors: [${p.colors.map((c) => `"${c}"`).join(", ")}],`);
  lines.push(`    description: ${JSON.stringify(p.description)},`);
  lines.push(`    tags: [${p.tags.map((t) => `"${t}"`).join(", ")}],`);
  lines.push("  },");
}
lines.push("];", "");
writeFileSync("src/lib/palettes-generated.ts", lines.join("\n"));

const perTheme = {};
for (const p of out) perTheme[p.theme] = (perTheme[p.theme] || 0) + 1;
console.log(`wrote src/lib/palettes-generated.ts: ${out.length} palettes`);
console.log(`per-theme counts all 16: ${Object.values(perTheme).every((n) => n === 16)}`);
