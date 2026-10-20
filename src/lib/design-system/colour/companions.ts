import { hexToRgb, oklch, rgbToOklch } from "./convert";

/**
 * Companion derivation: pick a secondary and accent that *match* a primary
 * rather than merely offsetting it.
 *
 * The old fallback took the palette strategy's swatch[1]/swatch[2], which
 * pinned the accent to the primary's own hue (a retint, not a choice) and
 * only ever moved the secondary by a fixed hue offset. This module makes
 * role-based decisions instead, so changing the primary can categorically
 * change the companions — to an ink black, a red, a split-complement pair —
 * whichever actually suits the new primary:
 *
 * - Achromatic primary (white/grey → the user's palette carries no hue):
 *   the companions *become* the personality. Light primaries get an ink
 *   secondary + red accent; black gets a red secondary + azure accent.
 * - Chromatic primary: both companions sit on split-complement offsets
 *   (±150°/210° from the primary) so they're always clearly distinct from
 *   it and from each other, with lightness chosen to contrast the primary's
 *   own value — a pale primary gets deep companions, a deep primary gets
 *   lifted ones, a mid primary gets a deep secondary (button-like) with a
 *   vivid accent.
 *
 * Deterministic: same primary in, same trio out. Theme generation still
 * owns per-mode lightness adaptation and AA guarantees.
 */

const NEUTRAL_CHROMA = 0.035;
const PALE_LIGHTNESS = 0.78;
const DEEP_LIGHTNESS = 0.32;

const normalizeHue = (h: number): number => ((h % 360) + 360) % 360;
const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export interface Companions {
  secondary: string;
  accent: string;
}

export function deriveCompanions(primaryHex: string): Companions {
  const p = rgbToOklch(hexToRgb(primaryHex));

  // Achromatic primary: there is no hue to harmonise with, so the
  // companions carry the colour. White/grey → ink + red; black → red + azure.
  if (p.c < NEUTRAL_CHROMA) {
    if (p.l >= 0.5) {
      return {
        secondary: oklch(0.26, 0.03, 260),
        accent: oklch(0.55, 0.19, 25),
      };
    }
    return {
      secondary: oklch(0.55, 0.19, 25),
      accent: oklch(0.56, 0.15, 235),
    };
  }

  // Chromatic primary: split-complement offsets give every companion a hue
  // the primary doesn't have, while staying a recognised harmony. The two
  // offsets are 60° apart, so secondary and accent stay distinct too.
  const splitA = normalizeHue(p.h + 150); // supporting hue
  const splitB = normalizeHue(p.h + 210); // highlight hue
  const secondaryChroma = clamp(p.c, 0.09, 0.16);
  const accentChroma = clamp(p.c * 1.15, 0.13, 0.19);

  let secondaryL: number;
  let accentL: number;
  if (p.l >= PALE_LIGHTNESS) {
    // Washed-out primary: the companions supply the depth it lacks.
    secondaryL = 0.3;
    accentL = 0.52;
  } else if (p.l <= DEEP_LIGHTNESS) {
    // Near-black brand colour: the companions supply lightness.
    secondaryL = 0.6;
    accentL = 0.62;
  } else {
    // Mid primary: deep secondary reads as a supporting button; vivid accent.
    secondaryL = 0.33;
    accentL = 0.56;
  }

  return {
    secondary: oklch(secondaryL, secondaryChroma, splitA),
    accent: oklch(accentL, accentChroma, splitB),
  };
}
