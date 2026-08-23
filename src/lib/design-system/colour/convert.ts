import type { ColourValue, Hsl, Oklch, Rgb } from "../types";

const HEX_SHORT = /^#?([0-9a-f]{3})$/i;
const HEX_LONG = /^#?([0-9a-f]{6})$/i;
const RGB_FN =
  /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*(?:0?\.\d+|1|100%)\s*)?\)$/i;
const HSL_FN =
  /^hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*(?:[,/]\s*(?:0?\.\d+|1|100%)\s*)?\)$/i;

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

export const round = (v: number, decimals = 0): number => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

/* ------------------------------------------------------------------ */
/* sRGB primitives (channels 0–255)                                    */
/* ------------------------------------------------------------------ */

export function isValidHex(input: string): boolean {
  return HEX_SHORT.test(input.trim()) || HEX_LONG.test(input.trim());
}

export function normalizeHex(input: string): string | null {
  const value = input.trim();
  const short = value.match(HEX_SHORT);
  if (short) {
    const [r, g, b] = short[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const long = value.match(HEX_LONG);
  if (long) return `#${long[1].toLowerCase()}`;
  return null;
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Invalid hex colour: ${hex}`);
  const n = parseInt(normalized.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (v: number) =>
    clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

/* ------------------------------------------------------------------ */
/* HSL                                                                 */
/* ------------------------------------------------------------------ */

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      break;
    case gn:
      h = ((bn - rn) / d + 2) * 60;
      break;
    default:
      h = ((rn - gn) / d + 4) * 60;
  }
  return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
}

export function hexToHsl(hex: string): Hsl {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(h: number, s: number, l: number): string {
  return rgbToHex(hslToRgb({ h, s, l }));
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = (((h % 360) + 360) % 360) / 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  if (sn === 0) {
    const v = ln * 255;
    return { r: v, g: v, b: v };
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const channel = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return {
    r: channel(hn + 1 / 3) * 255,
    g: channel(hn) * 255,
    b: channel(hn - 1 / 3) * 255,
  };
}

/* ------------------------------------------------------------------ */
/* OKLCH (Björn Ottosson's OKLab matrices)                             */
/* ------------------------------------------------------------------ */

const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const toSrgb = (c: number): number =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const rn = toLinear(r / 255);
  const gn = toLinear(g / 255);
  const bn = toLinear(b / 255);

  const l = 0.4122214708 * rn + 0.5363325363 * gn + 0.0514459929 * bn;
  const m = 0.2119034982 * rn + 0.6806995451 * gn + 0.1073969566 * bn;
  const s = 0.0883024619 * rn + 0.2817188376 * gn + 0.6299787005 * bn;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c, h: c < 1e-6 ? 0 : round(h, 2) };
}

function oklabToLinearSrgb(L: number, A: number, B: number): RgbLinear {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.291485548 * B;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

interface RgbLinear {
  r: number;
  g: number;
  b: number;
}

const isInGamut = ({ r, g, b }: RgbLinear, eps = 1e-4): boolean =>
  r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;

/**
 * Convert OKLCH to sRGB hex, gamut-mapping by reducing chroma (binary
 * search) when the requested colour falls outside sRGB. Lightness is
 * clamped to the valid range first.
 */
export function oklchToHex({ l, c, h }: Oklch): string {
  const L = clamp(l, 0, 1);
  const hueRad = (h * Math.PI) / 180;

  const attempt = (chroma: number): RgbLinear => {
    const a = Math.cos(hueRad) * chroma;
    const b = Math.sin(hueRad) * chroma;
    return oklabToLinearSrgb(L, a, b);
  };

  let chroma = Math.max(0, c);
  if (!isInGamut(attempt(chroma))) {
    // Binary search the largest in-gamut chroma.
    let lo = 0;
    let hi = chroma;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (isInGamut(attempt(mid))) lo = mid;
      else hi = mid;
    }
    chroma = lo;
  }

  const lin = attempt(chroma);
  return rgbToHex({
    r: toSrgb(clamp(lin.r, 0, 1)) * 255,
    g: toSrgb(clamp(lin.g, 0, 1)) * 255,
    b: toSrgb(clamp(lin.b, 0, 1)) * 255,
  });
}

/** Build an OKLCH colour safely (clamps + gamut maps). */
export function oklch(l: number, c: number, h: number): string {
  return oklchToHex({ l, c, h });
}

/* ------------------------------------------------------------------ */
/* Parsing & formatting                                                */
/* ------------------------------------------------------------------ */

/**
 * Parse any user-supplied colour (HEX, `rgb()` or `hsl()` string).
 * Returns null instead of throwing so callers can surface validation
 * errors cleanly.
 */
export function parseColour(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (isValidHex(value)) return normalizeHex(value);

  const rgbMatch = value.match(RGB_FN);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    const channels = [+r, +g, +b];
    if (channels.some((v) => v > 255)) return null;
    return rgbToHex({ r: channels[0], g: channels[1], b: channels[2] });
  }

  const hslMatch = value.match(HSL_FN);
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    if (+s > 100 || +l > 100) return null;
    return rgbToHex(hslToRgb({ h: +h, s: +s, l: +l }));
  }

  return null;
}

export function toColourValue(hex: string): ColourValue {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Invalid hex colour: ${hex}`);
  const rgb = hexToRgb(normalized);
  return {
    hex: normalized,
    rgb,
    hsl: rgbToHsl(rgb),
    oklch: rgbToOklch(rgb),
  };
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${round(r)}, ${round(g)}, ${round(b)})`;
}

export function formatHsl({ h, s, l }: Hsl): string {
  return `hsl(${round(h)}, ${round(s)}%, ${round(l)}%)`;
}

export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${round(l, 3)} ${round(c, 3)} ${round(h, 1)})`;
}

/** Perceptual distance between two colours in OKLab space (0–~1). */
export function oklabDistance(a: string, b: string): number {
  const la = rgbToOklch(hexToRgb(a));
  const lb = rgbToOklch(hexToRgb(b));
  const aa = la.c === 0 ? 0 : (la.h * Math.PI) / 180;
  const ab = lb.c === 0 ? 0 : (lb.h * Math.PI) / 180;
  const ax = Math.cos(aa) * la.c;
  const ay = Math.sin(aa) * la.c;
  const bx = Math.cos(ab) * lb.c;
  const by = Math.sin(ab) * lb.c;
  return Math.sqrt((la.l - lb.l) ** 2 + (ax - bx) ** 2 + (ay - by) ** 2);
}
