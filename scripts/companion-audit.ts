/**
 * Companion derivation audit — writes a markdown report.
 *
 *   npx tsx scripts/companion-audit.ts > docs/COMPANION_AUDIT.md
 *
 * Runs `deriveCompanions` across every primary in the repo's reference
 * corpora (brand colours, gallery palettes, named colours, edge primaries)
 * and reports each failing or ugly pairing, in three lenses:
 *
 *  1. TONE — WCAG contrast ratio *between the two role colours*. The trio
 *     contract promises "lightness chosen to contrast the primary's own
 *     value" and roles that are tone-identical (≈1:1) cannot be told apart
 *     without colour. FAIL < 3:1 (the non-text distinguishability bar the
 *     repo cites elsewhere), WARN 3:1–4.5:1 (muddy as adjacent surfaces).
 *  2. CVD — the repo's own convention from the "Are two colors
 *     distinguishable?" tool: `differenceScore` under each *chromatic*
 *     dichromacy (protanopia, deuteranopia, tritanopia — greyscale is the
 *     tone lens's job), below `CVD_DIFF_THRESHOLD` (30) = hard to tell apart.
 *     A pair can pass on tone and still collapse for a colour-blind viewer
 *     (hue-only difference); those are flagged separately.
 *  3. CONSTRUCTION — the module's own promises on inspection: no retint of
 *     the primary (ΔL < 0.06 within 90° of hue), no companion gamut-mapped
 *     to near-grey while the primary is chromatic, and where the sRGB gamut
 *     boundary reduced a companion's chroma.
 */

import { BRAND_PALETTES } from "../src/lib/brand-palettes";
import { NAMED_COLORS } from "../src/lib/colors";
import { GALLERY_PALETTES } from "../src/lib/palettes";
import { deriveCompanions } from "../src/lib/design-system/colour/companions";
import { contrastRatio } from "../src/lib/design-system/colour/contrast";
import {
  CVD_DIFF_THRESHOLD,
  CVD_TYPES,
  differenceScore,
  simulateCvd,
} from "../src/lib/design-system/colour/cvd";
import { hexToRgb, oklchToHex, rgbToOklch } from "../src/lib/design-system/colour/convert";

const TONE_FAIL = 3;
const TONE_WARN = 4.5;

/**
 * The three *chromatic* dichromacies, derived from the repo's own list.
 * Achromatopsia (greyscale) is excluded on purpose: greyscale separation is
 * lightness separation, which the tone lens measures directly with the
 * contrast ratio.
 */
const COLOUR_CVD = CVD_TYPES.map((t) => t.id).filter((id) => id !== "achromatopsia");

function hueDelta(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

function measured(hex: string): { l: number; c: number; h: number } {
  return rgbToOklch(hexToRgb(hex));
}

/** True when oklchToHex had to reduce chroma to fit this colour in sRGB. */
function atGamutBoundary(hex: string): boolean {
  const v = measured(hex);
  if (v.c < 0.005) return false;
  return oklchToHex({ l: v.l, c: v.c + 0.02, h: v.h }) === hex;
}

const PAIRS = [
  ["primary", "secondary"] as const,
  ["primary", "accent"] as const,
  ["secondary", "accent"] as const,
] as const;

/* ------------------------------------------------------------------ */
/* Corpus                                                              */
/* ------------------------------------------------------------------ */

const EDGE_PRIMARIES = [
  { label: "pure white", hex: "#ffffff" },
  { label: "mid grey", hex: "#808080" },
  { label: "near-black", hex: "#111111" },
  { label: "pale yellow", hex: "#fde68a" },
  { label: "deep navy", hex: "#0f172a" },
  { label: "off-white", hex: "#f5f5f4" },
];

const corpus = new Map<string, string>();
const add = (hex: string, label: string) => {
  const key = hex.toLowerCase();
  if (!corpus.has(key)) corpus.set(key, label);
};
for (const b of BRAND_PALETTES) add(b.hex, `brand ${b.name}`);
for (const p of GALLERY_PALETTES) for (const c of p.colors) add(c, `palette ${p.slug}`);
for (const c of NAMED_COLORS) add(c.hex, `named ${c.name}`);
for (const e of EDGE_PRIMARIES) add(e.hex, `edge ${e.label}`);

const primaries = [...corpus.entries()].map(([hex, source]) => ({ hex, source }));
if (primaries.length < 50) {
  console.error(`Corpus has only ${primaries.length} primaries — expected 50+.`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Checks                                                              */
/* ------------------------------------------------------------------ */

interface TrioResult {
  hex: string;
  source: string;
  branch: string;
  /** tone findings: pair -> ratio (only < TONE_WARN) */
  toneFails: Array<{ pair: string; ratio: number }>;
  toneWarns: Array<{ pair: string; ratio: number }>;
  /** pairs collapsing under ≥1 dichromacy: pair -> types */
  cvdFails: Array<{ pair: string; types: string[]; normalDiff: number }>;
  /** tone-passing pairs that still collapse under a dichromacy */
  cvdOnly: Array<{ pair: string; types: string[]; normalDiff: number; ratio: number }>;
  smells: string[];
  boundary: number;
}

const results: TrioResult[] = [];

for (const { hex, source } of primaries) {
  const p = measured(hex);
  const { secondary, accent } = deriveCompanions(hex);
  const trio = { primary: hex, secondary, accent };
  const achromatic = p.c < 0.035;
  const branch = achromatic
    ? p.l >= 0.5
      ? "achromatic light"
      : "achromatic dark"
    : p.l >= 0.78
      ? "pale"
      : p.l <= 0.32
        ? "deep"
        : "mid";

  const r: TrioResult = {
    hex,
    source,
    branch,
    toneFails: [],
    toneWarns: [],
    cvdFails: [],
    cvdOnly: [],
    smells: [],
    boundary: 0,
  };

  for (const [a, b] of PAIRS) {
    const pair = `${a}↔${b}`;
    const ratio = contrastRatio(trio[a], trio[b]);
    const normalDiff = differenceScore(trio[a], trio[b]);
    const types = COLOUR_CVD.filter(
      (t) => differenceScore(simulateCvd(trio[a], t), simulateCvd(trio[b], t)) < CVD_DIFF_THRESHOLD,
    );
    const collapses = types.length > 0;

    if (ratio < TONE_FAIL) r.toneFails.push({ pair, ratio });
    else if (ratio < TONE_WARN) r.toneWarns.push({ pair, ratio });

    if (collapses) {
      r.cvdFails.push({ pair, types: [...types], normalDiff });
      if (ratio >= TONE_FAIL) r.cvdOnly.push({ pair, types: [...types], normalDiff, ratio });
    }
  }

  if (!achromatic) {
    for (const role of ["secondary", "accent"] as const) {
      const m = measured(trio[role]);
      if (m.c < 0.03) {
        r.smells.push(
          `${role} gamut-mapped to near-grey (chroma ${m.c.toFixed(3)} vs primary ${p.c.toFixed(3)})`,
        );
      }
      const dl = Math.abs(m.l - p.l);
      const dh = hueDelta(m.h, p.h);
      if (dl < 0.06 && dh < 90) {
        r.smells.push(`${role} reads as a retint of the primary (ΔL ${dl.toFixed(2)}, hue ${dh.toFixed(0)}°)`);
      }
      if (atGamutBoundary(trio[role])) r.boundary += 1;
    }
  } else {
    for (const role of ["secondary", "accent"] as const) {
      if (atGamutBoundary(trio[role])) r.boundary += 1;
    }
  }

  results.push(r);
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const branchOrder = ["achromatic light", "achromatic dark", "pale", "mid", "deep"];
const fmtRatio = (n: number) => `${n.toFixed(2)}:1`;

const toneFailTrios = results.filter((r) => r.toneFails.length > 0);
const cvdFailTrios = results.filter((r) => r.cvdFails.length > 0);
const cvdOnlyTrios = results.filter((r) => r.cvdOnly.length > 0);
const smellTrios = results.filter((r) => r.smells.length > 0);
const toneToneIdentical = results.filter((r) => r.toneFails.some((f) => f.ratio < 1.5));
const cleanTrios = results.filter(
  (r) => r.toneFails.length === 0 && r.cvdFails.length === 0 && r.smells.length === 0,
);

const totalToneFails = results.reduce((n, r) => n + r.toneFails.length, 0);
const totalToneWarns = results.reduce((n, r) => n + r.toneWarns.length, 0);
const totalCvdFails = results.reduce((n, r) => n + r.cvdFails.length, 0);
const totalCvdOnly = results.reduce((n, r) => n + r.cvdOnly.length, 0);
const totalBoundary = results.reduce((n, r) => n + r.boundary, 0);
const totalPairs = results.length * 3;

const out: string[] = [];
const w = (line = "") => out.push(line);

w("# Companion derivation audit");
w();
w("Generated by `npx tsx scripts/companion-audit.ts > docs/COMPANION_AUDIT.md`.");
w("`deriveCompanions` is judged on its **delivered** hex output — the colours a");
w("generated system actually ships — across every primary in the repo's");
w("reference corpora.");
w();
w("## Summary");
w();
w(`| | |`);
w(`| --- | --- |`);
w(`| Primaries audited | **${primaries.length}** (brands ${BRAND_PALETTES.length}, gallery ${GALLERY_PALETTES.length * 5}, named ${NAMED_COLORS.length}, edge ${EDGE_PRIMARIES.length}; deduplicated) |`);
w(`| Trios with a tone failure (< 3:1 between roles) | **${toneFailTrios.length}** / ${results.length} (${Math.round((toneFailTrios.length / results.length) * 100)}%) — ${totalToneFails} of ${totalPairs} pairs |`);
w(`| …of which tone-identical (< 1.5:1) | **${toneToneIdentical.length}** trios |`);
w(`| Trios with a colour-CVD collapse (protan/deutan/tritan, diff < ${CVD_DIFF_THRESHOLD}) | **${cvdFailTrios.length}** / ${results.length} — ${totalCvdFails} pairs |`);
w(`| Pairs that pass tone but still collapse under a dichromacy | **${totalCvdOnly}** |`);
w(`| Muddy tone pairs (3:1–4.5:1) | ${totalToneWarns} |`);
w(`| Construction smells (retint / washed-out) | ${smellTrios.length} trios |`);
w(`| Companions reduced by the sRGB gamut boundary | ${totalBoundary} of ${results.length * 2} outputs |`);
w(`| Fully clean trios (no tone fail, no CVD collapse, no smell) | **${cleanTrios.length}** / ${results.length} |`);
w();

w("### Outcomes by branch");
w();
w("| Branch | Trios | Tone fail | CVD fail | Smells | Clean |");
w("| --- | ---: | ---: | ---: | ---: | ---: |");
for (const branch of branchOrder) {
  const set = results.filter((r) => r.branch === branch);
  if (!set.length) continue;
  w(
    `| ${branch} | ${set.length} | ${set.filter((r) => r.toneFails.length).length} | ${set.filter((r) => r.cvdFails.length).length} | ${set.filter((r) => r.smells.length).length} | ${set.filter((r) => !r.toneFails.length && !r.cvdFails.length && !r.smells.length).length} |`,
  );
}
w();

w("### Worst pairings (every trio with a tone-identical pair, < 1.5:1)");
w();
w("A pair at ≈1:1 has no tone hierarchy at all: the two roles are told apart");
w("by hue alone, so they read as the same weight side by side and vanish into");
w("one another in greyscale.");
w();
w("| Primary | Source | Branch | Tone failures | CVD collapses |");
w("| --- | --- | --- | --- | --- |");
for (const r of [...toneToneIdentical].sort(
  (a, b) => Math.min(...a.toneFails.map((f) => f.ratio)) - Math.min(...b.toneFails.map((f) => f.ratio)),
)) {
  const tone = r.toneFails.map((f) => `${f.pair} ${fmtRatio(f.ratio)}`).join("<br>");
  const cvd = r.cvdFails.map((f) => `${f.pair} → ${f.types.join(", ")}`).join("<br>") || "—";
  w(`| \`${r.hex}\` | ${r.source} | ${r.branch} | ${tone} | ${cvd} |`);
}
w();

w("## All tone failures (roles below 3:1)");
w();
w("| Primary | Source | Branch | Pair | Ratio | Dichromacies that collapse it |");
w("| --- | --- | --- | --- | ---: | --- |");
for (const r of toneFailTrios) {
  for (const f of r.toneFails) {
    const cvd = r.cvdFails.find((c) => c.pair === f.pair);
    w(
      `| \`${r.hex}\` | ${r.source} | ${r.branch} | ${f.pair} | ${fmtRatio(f.ratio)} | ${cvd ? cvd.types.join(", ") : "—"} |`,
    );
  }
}
w();

if (cvdOnlyTrios.length) {
  w("## Hue-only pairs: pass tone, collapse under a dichromacy");
  w();
  w("| Primary | Source | Pair | Ratio | Normal diff | Collapses under |");
  w("| --- | --- | --- | ---: | ---: | --- |");
  for (const r of cvdOnlyTrios) {
    for (const f of r.cvdOnly) {
      w(
        `| \`${r.hex}\` | ${r.source} | ${f.pair} | ${fmtRatio(f.ratio)} | ${f.normalDiff.toFixed(0)} | ${f.types.join(", ")} |`,
      );
    }
  }
  w();
}

w("## Muddy pairs (3:1–4.5:1)");
w();
w("Distinguishable under attention, but weak as adjacent surfaces or role");
w("markers.");
w();
w("| Primary | Source | Pair | Ratio |");
w("| --- | --- | --- | ---: |");
for (const r of results) {
  for (const f of r.toneWarns) {
    w(`| \`${r.hex}\` | ${r.source} | ${f.pair} | ${fmtRatio(f.ratio)} |`);
  }
}
w();

if (smellTrios.length) {
  w("## Construction smells");
  w();
  w("| Primary | Source | Issue |");
  w("| --- | --- | --- |");
  for (const r of smellTrios) {
    for (const s of r.smells) w(`| \`${r.hex}\` | ${r.source} | ${s} |`);
  }
  w();
}

w("## Method notes");
w();
w(`- Tone: WCAG contrast ratio between the two role colours. FAIL < ${TONE_FAIL}:1 (the`);
w("  non-text distinguishability bar), WARN between 3:1 and 4.5:1. Ratio is a");
w("  lightness measure — it deliberately says nothing about hue.");
w(`- CVD: \`differenceScore\` (0–100) under each chromatic dichromacy in \`CVD_TYPES\``);
w(`  threshold \`${CVD_DIFF_THRESHOLD}\` — the same convention as the site's own`);
w('  "Are two colors distinguishable?" tool on `/color-blindness-simulator`.');
w("- Construction: `companions.ts` promises split-complement hues with");
w("  lightness chosen to contrast the primary's value; a retint or a washed-out");
w("  companion breaks that promise regardless of ratios.");
w(`- Gamut: \`${totalBoundary}\` outputs sit on the sRGB boundary — \`oklchToHex\``);
w("  reduces chroma to fit while preserving hue and lightness, so these are");
w("  saturation losses, not hue shifts.");
w();

console.log(out.join("\n"));
