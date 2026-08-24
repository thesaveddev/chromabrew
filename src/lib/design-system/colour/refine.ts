import { hexToRgb, oklchToHex, rgbToOklch } from "./convert";
import type { Oklch, Refinement } from "../types";

const NEUTRAL_CHROMA = 0.02;

export const ZERO_REFINEMENT: Refinement = {
  brightness: 0,
  saturation: 0,
  hueShift: 0,
  temperature: 0,
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function normaliseHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Apply refinement adjustments to a single colour in OKLCH space.
 * Zeroed refinement fields leave the colour untouched.
 */
export function applyRefinement(hex: string, refinement: Refinement): string {
  const { brightness, saturation, hueShift, temperature } = refinement;
  const inert =
    (brightness ?? 0) === 0 &&
    (saturation ?? 0) === 0 &&
    (hueShift ?? 0) === 0 &&
    (temperature ?? 0) === 0;
  if (inert) return hex;

  const source = rgbToOklch(hexToRgb(hex));
  let { l, c, h } = source;

  // Brightness: ±50% moves lightness by up to ±0.25.
  l = clamp(l + ((brightness ?? 0) / 100) * 0.5, 0.02, 0.99);

  // Saturation: relative chroma scaling; floor keeps near-greys alive.
  if ((saturation ?? 0) !== 0) {
    c = clamp(c * (1 + saturation / 100), source.c > NEUTRAL_CHROMA ? 0.008 : 0, 0.37);
  }

  // Hue shift.
  h = normaliseHue(h + (hueShift ?? 0));

  // Temperature: rotate toward warm (~70° amber) or cool (~260° blue).
  if ((temperature ?? 0) !== 0) {
    const t = temperature / 100;
    const target = t > 0 ? 70 : 260;
    const strength = Math.abs(t) * 40;
    let delta = target - h;
    if (t < 0) delta = ((delta + 180) % 360 + 360) % 360 - 180;
    delta = clamp(delta, -180, 180);
    h = normaliseHue(h + delta * (strength / 40));
    c = clamp(c * (1 + Math.abs(t) * 0.15), 0, 0.37);
  }

  return oklchToHex({ l, c, h });
}

/** OKLCH-space random colour with pleasant, usable bounds. */
export function randomPleasantHex(
  hue?: number,
  l = 0.45 + Math.random() * 0.25,
  c = 0.09 + Math.random() * 0.13,
): string {
  const value: Oklch = {
    l: clamp(l, 0.25, 0.85),
    c,
    h: normaliseHue(hue ?? Math.random() * 360),
  };
  return oklchToHex(value);
}

/**
 * A harmonised random trio: random primary, secondary nearby,
 * accent further away — so "Random" always yields something coherent.
 */
export function randomTrio(): { primary: string; secondary: string; accent: string } {
  const baseHue = Math.random() * 360;
  return {
    primary: randomPleasantHex(baseHue),
    secondary: randomPleasantHex(normaliseHue(baseHue + (Math.random() < 0.5 ? -35 : 35))),
    accent: randomPleasantHex(
      normaliseHue(baseHue + 150 + Math.random() * 60),
      0.55 + Math.random() * 0.2,
      0.14 + Math.random() * 0.08,
    ),
  };
}
