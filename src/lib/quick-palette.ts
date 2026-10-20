import { generatePalette, PALETTE_STRATEGIES } from "@/lib/design-system/palette/generate";
import {
  hexToRgb,
  normalizeHex,
  oklchToHex,
  rgbToOklch,
} from "@/lib/design-system/colour/convert";
import { randomPleasantHex } from "@/lib/design-system/colour/refine";
import type { PaletteStrategyId } from "@/lib/design-system/types";

const HEX_CHARS = "0123456789abcdef";

export function randomHex(): string {
  let hex = "#";
  for (let i = 0; i < 6; i++) {
    hex += HEX_CHARS[Math.floor(Math.random() * 16)];
  }
  return hex;
}

/** The vivid anchor colour shuffles start from (see quickPalette). */
export function randomPleasantColour(): string {
  return randomPleasantHex();
}

/** Which harmony a shuffle runs: a fixed strategy or a fresh random one. */
export type StrategyChoice = PaletteStrategyId | "random";

/**
 * Live tuning applied on top of the generated palette. Locked colours are
 * always exempt — a keeper stays byte-for-byte.
 */
export interface PaletteSettings {
  /** Degrees to rotate every unlocked colour (−180…180). */
  hueShift: number;
  /** OKLCH lightness offset, −100…100 mapped to ±0.25. */
  brightness: number;
  /** Chroma multiplier in percent (100 = untouched). */
  vibrance: number;
  /** Lightness spread around the palette mean in percent (100 = untouched). */
  contrast: number;
}

export const DEFAULT_PALETTE_SETTINGS: PaletteSettings = {
  hueShift: 0,
  brightness: 0,
  vibrance: 100,
  contrast: 100,
};

export function settingsAreDefault(s: PaletteSettings): boolean {
  return (
    s.hueShift === DEFAULT_PALETTE_SETTINGS.hueShift &&
    s.brightness === DEFAULT_PALETTE_SETTINGS.brightness &&
    s.vibrance === DEFAULT_PALETTE_SETTINGS.vibrance &&
    s.contrast === DEFAULT_PALETTE_SETTINGS.contrast
  );
}

const normalizeAngle = (deg: number): number => ((deg % 360) + 360) % 360;
const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/**
 * Apply the tuning sliders to a palette deterministically: spread lightness
 * around the unlocked mean (contrast), lift or sink it (brightness), scale
 * chroma (vibrance), then rotate the hue — in that order, so dragging one
 * slider never reinterprets another. Locked indices pass through verbatim.
 *
 * Same inputs, same output — the UI can recompute on every slider tick
 * without the palette shimmering under the pointer.
 */
export function applyPaletteSettings(
  colors: string[],
  locked: boolean[],
  settings: PaletteSettings,
): string[] {
  if (settingsAreDefault(settings)) return [...colors];

  const free = colors
    .map((_, i) => i)
    .filter((i) => !locked[i] && colors[i]);
  if (free.length === 0) return [...colors];

  const parsed = free.map((i) => ({ i, ...rgbToOklch(hexToRgb(colors[i])) }));
  const meanL = parsed.reduce((sum, v) => sum + v.l, 0) / parsed.length;

  const out = [...colors];
  for (const v of parsed) {
    const spread = meanL + (v.l - meanL) * (settings.contrast / 100);
    const l = clamp(spread + settings.brightness / 400, 0.04, 0.97);
    const c = clamp(v.c * (settings.vibrance / 100), 0, 0.32);
    const h = normalizeAngle(v.h + settings.hueShift);
    out[v.i] = oklchToHex({ l, c, h });
  }
  return out;
}

/**
 * Generate a fast, varied palette the way explorative generators do: pick a
 * vivid anchor colour (mid-lightness, clearly chromatic — raw random hex is
 * often a muddy grey, which is what makes unguided generators look dull) and
 * run the perceptual (OKLCH) engine with a harmony strategy. Locked colors
 * are preserved verbatim at their indices.
 */
export function quickPalette(
  size: number,
  locked: (string | null)[],
  strategy: StrategyChoice = "random",
): string[] {
  const count = Math.min(8, Math.max(2, Math.round(size)));
  const chosen: PaletteStrategyId =
    strategy === "random"
      ? PALETTE_STRATEGIES[Math.floor(Math.random() * PALETTE_STRATEGIES.length)].id
      : strategy;
  const swatches = generatePalette(randomPleasantHex(), chosen, { size: count });
  return Array.from({ length: count }, (_, i) => {
    const keep = locked[i];
    if (keep && normalizeHex(keep)) return normalizeHex(keep) as string;
    return swatches[i].hex;
  });
}

export function parseQuickPalette(value: string | null): string[] | null {
  if (!value) return null;
  const colors = value
    .split("-")
    .map((part) => normalizeHex(part.startsWith("#") ? part : `#${part}`))
    .filter((hex): hex is string => hex !== null);
  if (colors.length < 2 || colors.length > 8) return null;
  return colors;
}

export function serializeQuickPalette(colors: string[]): string {
  return colors.map((c) => c.replace("#", "")).join("-");
}
