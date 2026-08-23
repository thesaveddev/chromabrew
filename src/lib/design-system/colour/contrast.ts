import { hexToRgb, oklchToHex, rgbToOklch } from "./convert";
import type { ContrastGrade } from "../types";

/** WCAG 2.x relative luminance of a hex colour (0–1). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/**
 * WCAG 2.x contrast ratio between two hex colours (1–21).
 * Reference values: black/white = 21, #767676/white ≈ 4.54.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;
export const AAA_NORMAL = 7;
export const AAA_LARGE = 4.5;

export function grade(ratio: number): ContrastGrade {
  return {
    ratio,
    aaNormal: ratio >= AA_NORMAL,
    aaLarge: ratio >= AA_LARGE,
    aaaNormal: ratio >= AAA_NORMAL,
    aaaLarge: ratio >= AAA_LARGE,
  };
}

export function gradePair(foreground: string, background: string): ContrastGrade {
  return grade(contrastRatio(foreground, background));
}

export interface ContrastFixResult {
  hex: string;
  changed: boolean;
  ratio: number;
  /** True when the threshold could not be met even at the gamut extreme. */
  unachievable: boolean;
}

/**
 * Find the nearest colour to `hex` (preserving hue and most chroma) whose
 * contrast against `against` meets `threshold`. Contrast varies
 * monotonically along the OKLCH lightness axis for a fixed background, so a
 * binary search finds the minimal adjustment.
 */
export function fixContrast(
  hex: string,
  against: string,
  threshold: number = AA_NORMAL,
): ContrastFixResult {
  const initialRatio = contrastRatio(hex, against);
  if (initialRatio >= threshold) {
    return { hex, changed: false, ratio: initialRatio, unachievable: false };
  }

  const source = rgbToOklch(hexToRgb(hex));
  const candidateAt = (l: number): string =>
    oklchToHex({ l, c: source.c, h: source.h });
  const passes = (l: number): boolean =>
    contrastRatio(candidateAt(l), against) >= threshold;

  /**
   * Darkening: passing region is [0, t]; find t (largest passing lightness).
   * Precondition: passes(0).
   */
  const searchDown = (): number | null => {
    if (!passes(0)) return null;
    let lo = 0;
    let hi = source.l;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (passes(mid)) lo = mid;
      else hi = mid;
    }
    return lo;
  };

  /** Lightening: passing region is [t, 1]; find t (smallest passing). */
  const searchUp = (): number | null => {
    if (!passes(1)) return null;
    let lo = source.l;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (passes(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  };

  // Prefer moving away from the background luminance; fall back to the
  // opposite direction if needed.
  const againstIsLight = relativeLuminance(against) > relativeLuminance(hex);
  const primarySearch = againstIsLight ? searchDown : searchUp;
  const fallbackSearch = againstIsLight ? searchUp : searchDown;

  const found = primarySearch() ?? fallbackSearch();
  if (found !== null) {
    const finalHex = candidateAt(found);
    return {
      hex: finalHex,
      changed: true,
      ratio: contrastRatio(finalHex, against),
      unachievable: false,
    };
  }

  // Neither extreme passed at full chroma — sweep reduced-chroma greys at
  // both extremes (neutral colours have more luminance headroom).
  for (let step = 1; step <= 10; step++) {
    const reducedC = source.c * (1 - step / 10);
    for (const l of [1, 0]) {
      const candidate = oklchToHex({ l, c: reducedC, h: source.h });
      const ratio = contrastRatio(candidate, against);
      if (ratio >= threshold) {
        return { hex: candidate, changed: true, ratio, unachievable: false };
      }
    }
  }

  return { hex, changed: false, ratio: initialRatio, unachievable: true };
}
