import { hexToRgb, oklchToHex, rgbToOklch } from "./convert";
import type { Oklch, ScaleStep } from "../types";

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * Target OKLCH lightness anchors per scale step. Chosen so that steps read
 * like professional perceptual scales (Tailwind/Radix-like spacing) rather
 * than naive white/black mixes.
 */
const LIGHTNESS_ANCHORS: Record<number, number> = {
  50: 0.977,
  100: 0.946,
  200: 0.902,
  300: 0.845,
  400: 0.765,
  500: 0.684,
  600: 0.605,
  700: 0.52,
  800: 0.44,
  900: 0.365,
  950: 0.268,
};

/**
 * Chroma multipliers relative to the source colour's chroma. Mid tones can
 * carry more chroma than extreme tints/shades without looking artificial.
 */
const CHROMA_CURVE: Record<number, number> = {
  50: 0.32,
  100: 0.48,
  200: 0.64,
  300: 0.8,
  400: 0.92,
  500: 1,
  600: 1.04,
  700: 1,
  800: 0.92,
  900: 0.82,
  950: 0.68,
};

/** Interpolate between neighbouring anchors for non-pinned steps. */
function targetLightness(step: number): number {
  return LIGHTNESS_ANCHORS[step] ?? 0.5;
}

function chromaFor(step: number, baseChroma: number): number {
  const multiplier = CHROMA_CURVE[step] ?? 1;
  // Very light/dark anchors physically cannot hold much chroma; the gamut
  // mapper caps this anyway, but scaling early keeps hues consistent.
  return baseChroma * multiplier;
}

/**
 * Generate an 11-step perceptual scale (50–950) from one brand colour.
 *
 * - Hue is preserved throughout.
 * - Lightness follows the anchor curve.
 * - The source colour itself is pinned exactly at its nearest step so the
 *   brand value survives verbatim.
 * - Out-of-gamut requests are gamut-mapped by reducing chroma, never by
 *   shifting hue.
 */
export function generateScale(primaryHex: string): ScaleStep[] {
  const source = rgbToOklch(hexToRgb(primaryHex));

  let pinnedStep: number = SCALE_STEPS[0];
    let bestDistance = Infinity;
  for (const step of SCALE_STEPS) {
    const d = Math.abs(LIGHTNESS_ANCHORS[step] - source.l);
    if (d < bestDistance) {
      bestDistance = d;
      pinnedStep = step;
    }
  }

  return SCALE_STEPS.map((step) => {
    if (step === pinnedStep) {
      return { step, hex: oklchToHex(source), oklch: source, isSource: true };
    }
    const requested: Oklch = {
      l: targetLightness(step),
      c: chromaFor(step, source.c),
      h: source.h,
    };
    const hex = oklchToHex(requested);
    return { step, hex, oklch: rgbToOklch(hexToRgb(hex)), isSource: false };
  });
}

/** The scale member conventionally used to represent "the" brand colour. */
export function representativeScaleStep(): number {
  return 600;
}
