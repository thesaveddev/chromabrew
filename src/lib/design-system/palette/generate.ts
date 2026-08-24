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
 * value; manual overrides are respected verbatim. `size` extends the
 * strategy's base swatches by cycling hue offsets with an alternating
 * lightness ramp so extended palettes stay varied.
 */
export function generatePalette(
  primaryHex: string,
  strategyId: PaletteStrategyId,
  options: {
    overrides?: Record<number, string>;
    size?: number;
  } = {},
): PaletteColour[] {
  const source = rgbToOklch(hexToRgb(primaryHex));
  const strategy = getStrategy(strategyId);
  const size = Math.max(
    strategy.hueOffsets.length,
    Math.min(10, Math.round(options.size ?? strategy.hueOffsets.length)),
  );

  return Array.from({ length: size }, (_, index) => {
    const override = options.overrides?.[index];
    if (override) {
      return { hex: override.toLowerCase(), role: roleFor(strategy, index), index, locked: false, edited: true };
    }

    const cycle = Math.floor(index / strategy.hueOffsets.length);
    const offsetIndex = index % strategy.hueOffsets.length;
    const cycleDelta = cycle % 2 === 0 ? -0.07 * Math.ceil(cycle / 2) : 0.09 * Math.ceil(cycle / 2);
    const l = Math.min(
      0.97,
      Math.max(0.12,
        source.l + (strategy.lightnessDeltas?.[offsetIndex] ?? 0) + cycleDelta),
    );
    const c = source.c * (strategy.chromaMultipliers?.[offsetIndex] ?? 1);
    const h = normalizeHue(source.h + strategy.hueOffsets[offsetIndex]);
    // Monochromatic palettes collapse onto the primary when deltas are
    // zero; nudge chroma so swatches remain distinct.
    let hex = oklchToHex({ l, c, h });
    if (
      strategy.id === "monochromatic" &&
      !(offsetIndex === 1 && cycle === 0) &&
      hex.toLowerCase() === oklchToHex({ l: source.l, c: source.c, h: source.h }).toLowerCase()
    ) {
      hex = oklchToHex({
        l,
        c: Math.min(0.32, c * (offsetIndex === 0 ? 0.6 : 1.4) + 0.01),
        h,
      });
    }

    return { hex, role: roleFor(strategy, index), index, locked: false, edited: false };
  });
}

function roleFor(strategy: StrategyDefinition, index: number): string {
  const base = strategy.roles[index % strategy.roles.length];
  const cycle = Math.floor(index / strategy.roles.length);
  return cycle === 0 ? base : `${base} ${cycle + 1}`;
}

/**
 * Regenerate a palette while preserving previously locked or edited
 * swatches from `previous`.
 */
export function regeneratePalette(
  primaryHex: string,
  strategyId: PaletteStrategyId,
  previous: PaletteColour[],
  options: { size?: number } = {},
): PaletteColour[] {
  const fresh = generatePalette(primaryHex, strategyId, { size: options.size });
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
