/**
 * WCAG 2.1 SC 1.4.3 (Contrast — Minimum) helpers.
 *
 * The colour maths is not reimplemented here. It comes from the design system —
 * `relativeLuminance` and `grade` from `colour/contrast`, `oklabDistance` from
 * `colour/convert` — so a ratio reported by the free contrast checker, by the
 * design-system generator and by an audit finding is produced by one
 * implementation, and cannot drift between them.
 */

import { oklabDistance } from "@/lib/design-system/colour/convert";
import { grade, relativeLuminance } from "@/lib/design-system/colour/contrast";

export interface ContrastResult {
  ratio: number;
  passes: {
    aaNormal: boolean;
    aaLarge: boolean;
    aaaNormal: boolean;
    aaaLarge: boolean;
  };
}

/** `null` means the colour could not be read, which is not the same as black. */
function luminance(hex: string): number | null {
  try {
    return relativeLuminance(hex);
  } catch {
    return null;
  }
}

/**
 * Nothing that cannot be measured may report a pass. Treating an unreadable
 * colour as black would claim a 21:1 success for text nobody can see, so an
 * unreadable pair fails every criterion instead.
 */
const UNMEASURABLE: ContrastResult = {
  ratio: 0,
  passes: { aaNormal: false, aaLarge: false, aaaNormal: false, aaaLarge: false },
};

export function contrastRatio(fg: string, bg: string): ContrastResult {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  if (l1 === null || l2 === null) {
    return { ratio: UNMEASURABLE.ratio, passes: { ...UNMEASURABLE.passes } };
  }

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const { aaNormal, aaLarge, aaaNormal, aaaLarge } = grade(ratio);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: { aaNormal, aaLarge, aaaNormal, aaaLarge },
  };
}

/**
 * Perceptual distance in OKLab space (0–~1), or `null` when either colour is
 * unreadable — returning 0 would claim two colours are identical. Deliberately
 * named for what it measures: this is the same distance the palette generator
 * and the colour-name matcher use, not a CIE DeltaE.
 */
export function perceptualDistance(a: string, b: string): number | null {
  try {
    return oklabDistance(a, b);
  } catch {
    return null;
  }
}
