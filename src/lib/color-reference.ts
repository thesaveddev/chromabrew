import {
  hexToRgb,
  hexToHsl,
  hslToHex,
  rgbToOklch,
  rgbToCmyk,
  formatRgb,
  formatHsl,
  formatOklch,
  formatCmyk,
  normalizeHex,
} from "@/lib/design-system/colour/convert";
import { generateScale } from "@/lib/design-system/colour/scale";
import { contrastRatio } from "@/lib/design-system/colour/contrast";
import { closestNamedColour, dominantHue } from "@/lib/css-colors";

/**
 * Computed color reference: every fact a `/colors/[slug]` or `/brands/[slug]`
 * page shows that is not hand-written copy.
 *
 * All values derive from the single hex through the same engine the tools
 * use, so reference pages can never disagree with the converter, the shade
 * generator, or the contrast checker. Pages add curation (descriptions,
 * uses, related links) on top; this module owns the math.
 */
export interface ColorFormats {
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
  cmyk: string;
}

export interface ScaleStop {
  step: number;
  hex: string;
  isSource: boolean;
}

export interface Harmony {
  name: string;
  blurb: string;
  colors: string[];
}

export interface ContrastVerdict {
  background: string;
  backgroundName: string;
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
}

export interface ColorReference {
  hex: string;
  formats: ColorFormats;
  hueFamily: string;
  closestName: string;
  scale: ScaleStop[];
  harmonies: Harmony[];
  contrast: ContrastVerdict[];
}

function rotateHue(h: number, degrees: number): number {
  return ((h + degrees) % 360 + 360) % 360;
}

export function buildColorReference(rawHex: string): ColorReference | null {
  const hex = normalizeHex(rawHex);
  if (!hex) return null;

  const rgb = hexToRgb(hex);
  const hsl = hexToHsl(hex);
  const oklch = rgbToOklch(rgb);
  const cmyk = rgbToCmyk(rgb);
  const closest = closestNamedColour(hex);

  const harmony = (name: string, blurb: string, hues: number[]): Harmony => ({
    name,
    blurb,
    colors: hues.map((h) => hslToHex(h, hsl.s, hsl.l)),
  });

  return {
    hex,
    formats: {
      hex,
      rgb: formatRgb(rgb),
      hsl: formatHsl(hsl),
      oklch: formatOklch(oklch),
      cmyk: formatCmyk(cmyk),
    },
    hueFamily: dominantHue(hex),
    closestName: closest?.name ?? "—",
    scale: generateScale(hex).map((step) => ({
      step: step.step,
      hex: step.hex,
      isSource: step.isSource,
    })),
    harmonies: [
      harmony("Complementary", "Maximum contrast — use one side for action, the other sparingly.", [hsl.h, rotateHue(hsl.h, 180)]),
      harmony("Analogous", "Neighbors on the wheel — calm, cohesive, hard to get wrong.", [
        rotateHue(hsl.h, -30),
        hsl.h,
        rotateHue(hsl.h, 30),
      ]),
      harmony("Triadic", "Three evenly spaced hues — vibrant, needs one clear leader.", [
        hsl.h,
        rotateHue(hsl.h, 120),
        rotateHue(hsl.h, 240),
      ]),
    ],
    contrast: ([
      { background: "#ffffff", backgroundName: "white" },
      { background: "#000000", backgroundName: "black" },
    ] as const).map(({ background, backgroundName }) => {
      const ratio = contrastRatio(hex, background);
      return {
        background,
        backgroundName,
        ratio: Math.round(ratio * 100) / 100,
        aaNormal: ratio >= 4.5,
        aaLarge: ratio >= 3,
      };
    }),
  };
}

/** URL-safe slug for brand names ("Microsoft Teams" → "microsoft-teams"). */
export function slugifyBrand(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
