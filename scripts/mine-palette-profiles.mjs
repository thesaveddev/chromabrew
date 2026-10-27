// One-off analysis: mine per-theme color profiles from the curated gallery.
// Run: node scripts/mine-palette-profiles.mjs
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/palettes.ts", "utf8");

// Split into theme defs (before GALLERY_PALETTES) and palette entries.
const galleryStart = src.indexOf("export const GALLERY_PALETTES");
const themeSrc = src.slice(0, galleryStart);
const gallerySrc = src.slice(galleryStart);

const themeSlugs = [...themeSrc.matchAll(/slug: "([a-z-]+)"/g)].map((m) => m[1]);

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

const entries = [...gallerySrc.matchAll(
  /theme: "([a-z-]+)",\s*name: "([^"]+)",\s*colors: \[([^\]]+)\]/g,
)];

const per = {};
for (const m of entries) {
  const [, theme, , colorsRaw] = m;
  const colors = [...colorsRaw.matchAll(/"(#[0-9a-f]{6})"/gi)].map((c) => c[1]);
  (per[theme] ??= []).push(colors);
}

console.log(`themes:${themeSlugs.length} palettes:${entries.length}`);
for (const slug of themeSlugs) {
  const pals = per[slug] ?? [];
  const hues = [];
  const lights = [];
  const sats = [];
  for (const colors of pals) {
    for (const c of colors) {
      const { h, s, l } = hexToHsl(c);
      if (s > 0.08) hues.push(h);
      lights.push(l);
      sats.push(s);
    }
  }
  // Circular mean of saturated hues.
  let sx = 0, sy = 0;
  for (const h of hues) { sx += Math.cos((h * Math.PI) / 180); sy += Math.sin((h * Math.PI) / 180); }
  const mean = hues.length ? ((Math.atan2(sy / hues.length, sx / hues.length) * 180) / Math.PI + 360) % 360 : -1;
  // Circular spread: mean angular deviation.
  let dev = 0;
  for (const h of hues) {
    let d = Math.abs(h - mean); if (d > 180) d = 360 - d; dev += d;
  }
  dev = hues.length ? dev / hues.length : 0;
  const lo = Math.min(...lights), hi = Math.max(...lights);
  const avgS = sats.reduce((a, b) => a + b, 0) / sats.length;
  console.log(
    `${slug} n=${pals.length} hueMean=${mean.toFixed(0)} hueDev=${dev.toFixed(0)} ` +
    `light=[${lo.toFixed(2)}..${hi.toFixed(2)}] satAvg=${avgS.toFixed(2)} hues=[${hues.map((h) => h.toFixed(0)).join(",")}]`,
  );
}
