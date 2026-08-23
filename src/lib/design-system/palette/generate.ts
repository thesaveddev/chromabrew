import { hexToRgb, oklchToHex, rgbToOklch } from "../colour/convert";
import type { PaletteColour, PaletteStrategyId } from "../types";

interface StrategyDefinition {
  id: PaletteStrategyId;
  label: string;
  description: string;
  /** Hue offsets applied to the primary hue (0 included implicitly). */
  hueOffsets: number[];
  roles: string[];
  /** Optional lightness adjustments per offset (same length). */
  lightnessDeltas?: number[];
  chromaMultipliers?: number[];
}

export const PALETTE_STRATEGIES: StrategyDefinition[] = [
  {
    id: "complementary",
    label: "Complementary",
    description: "Two hues opposite each other — high contrast, energetic.",
    hueOffsets: [0, 180],
    roles: ["Primary", "Complement"],
  },
  {
    id: "analogous",
    label: "Analogous",
    description: "Neighbouring hues — harmonious and calm.",
    hueOffsets: [-30, 0, 30],
    roles: ["Analogous −30°", "Primary", "Analogous +30°"],
  },
  {
    id: "triadic",
    label: "Triadic",
    description: "Three evenly spaced hues — balanced and vibrant.",
    hueOffsets: [0, 120, 240],
    roles: ["Primary", "Triad +120°", "Triad +240°"],
  },
  {
    id: "split-complementary",
    label: "Split complementary",
    description: "A base plus the two neighbours of its complement.",
    hueOffsets: [0, 150, 210],
    roles: ["Primary", "Split A", "Split B"],
  },
  {
    id: "monochromatic",
    label: "Monochromatic",
    description: "One hue explored through lightness and chroma.",
    hueOffsets: [0, 0, 0],
    roles: ["Tint", "Primary", "Shade"],
    lightnessDeltas: [0.14, 0, -0.14],
    chromaMultipliers: [0.85, 1, 1.05],
  },
  {
    id: "tetradic",
    label: "Tetradic",
    description: "Four hues in a rectangle — rich but demanding.",
    hueOffsets: [0, 90, 180, 270],
    roles: ["Primary", "Second", "Third", "Fourth"],
  },
];

export function getStrategy(id: PaletteStrategyId): StrategyDefinition {
  const found = PALETTE_STRATEGIES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown palette strategy: ${id}`);
  return found;
}

const normalizeHue = (h: number): number => ((h % 360) + 360) % 360;

/**
 * Generate a palette for a strategy. Locked indices keep their current
 * value; manual overrides are respected verbatim.
 */
export function generatePalette(
  primaryHex: string,
  strategyId: PaletteStrategyId,
  options: {
    overrides?: Record<number, string>;
  } = {},
): PaletteColour[] {
  const source = rgbToOklch(hexToRgb(primaryHex));
  const strategy = getStrategy(strategyId);

  return strategy.hueOffsets.map((offset, index) => {
    const override = options.overrides?.[index];
    if (override) {
      return { hex: override.toLowerCase(), role: strategy.roles[index], index, locked: false, edited: true };
    }

    const l = Math.min(
      1,
      Math.max(0, source.l + (strategy.lightnessDeltas?.[index] ?? 0)),
    );
    const c = source.c * (strategy.chromaMultipliers?.[index] ?? 1);
    const h = normalizeHue(source.h + offset);
    // Monochromatic palettes collapse onto the primary when deltas are
    // zero; nudge chroma so swatches remain distinct.
    let hex = oklchToHex({ l, c, h });
    if (
      strategy.id === "monochromatic" &&
      index !== 1 &&
      hex.toLowerCase() === oklchToHex({ l: source.l, c: source.c, h: source.h }).toLowerCase()
    ) {
      hex = oklchToHex({
        l,
        c: Math.min(0.32, c * (index === 0 ? 0.6 : 1.4) + 0.01),
        h,
      });
    }

    return { hex, role: strategy.roles[index], index, locked: false, edited: false };
  });
}

/**
 * Regenerate a palette while preserving previously locked or edited
 * swatches from `previous`.
 */
export function regeneratePalette(
  primaryHex: string,
  strategyId: PaletteStrategyId,
  previous: PaletteColour[],
): PaletteColour[] {
  const fresh = generatePalette(primaryHex, strategyId);
  return fresh.map((swatch) => {
    const prior = previous.find((p) => p.index === swatch.index);
    if (prior?.locked && !prior.edited) {
      return { ...prior };
    }
    if (prior?.edited) {
      return { ...swatch, hex: prior.hex, edited: true };
    }
    return swatch;
  });
}
