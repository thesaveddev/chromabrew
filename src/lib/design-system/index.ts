import { generateScale } from "./colour/scale";
import { oklchToHex, toColourValue } from "./colour/convert";
import { generatePalette } from "./palette/generate";
import {
  generateRadius,
  generateShadows,
  generateSpacing,
  generateTypography,
} from "./primitives/generate";
import {
  buildAccessibilityReport,
  generateTheme,
} from "./tokens/generate";
import type { DesignSystem, GeneratorConfig } from "./types";

export const GENERATOR_VERSION = "1.1.0";

export const DEFAULT_PRIMARY = "#47003a";

/**
 * Deterministically build the canonical DesignSystem from a configuration.
 * This is the single entry point consumed by the generator UI, previews
 * and export adapters.
 */
export function buildDesignSystem(config: GeneratorConfig): DesignSystem {
  const primaryValue = toColourValue(config.primary);

  const scale = generateScale(primaryValue.hex);

  const palette = generatePalette(primaryValue.hex, config.paletteStrategy, {
    overrides: config.paletteOverrides,
  });

  // Derive secondary and accent from the palette strategy when the user
  // hasn't explicitly chosen them.  The palette swatches are ordered by
  // hue offset, so index 1 is typically the secondary and index 2 (or 1
  // for complementary) is the accent.
  const secondaryHex = config.secondary
    ? toColourValue(config.secondary).hex
    : palette.length >= 2
      ? palette[1].hex
      : primaryValue.hex;

  const accentHex = config.accent
    ? toColourValue(config.accent).hex
    : palette.length >= 3
      ? palette[2].hex
      : palette.length >= 2
        ? palette[1].hex
        : rotateHue(primaryValue.hex, 30);

  const themes = {
    light: generateTheme(
      { primaryHex: primaryValue.hex, scale, accentSeedHex: accentHex, secondarySeedHex: secondaryHex },
      "light",
    ),
    dark: generateTheme(
      { primaryHex: primaryValue.hex, scale, accentSeedHex: accentHex, secondarySeedHex: secondaryHex },
      "dark",
    ),
  };

  const accessibility = buildAccessibilityReport(themes);

  return {
    metadata: {
      name: `Design system ${primaryValue.hex.toUpperCase()}`,
      sourceKind: "hex",
      generatorVersion: GENERATOR_VERSION,
    },
    source: {
      input: config.primary,
      primary: primaryValue,
    },
    configuration: config,
    primitives: {
      colors: {
        scale,
        palette,
        accentSeed: toColourValue(accentHex),
      },
      typography: generateTypography(config.typeRatio),
      spacing: generateSpacing(),
      radius: generateRadius(config.radiusStyle),
      shadows: generateShadows(),
    },
    themes,
    accessibility,
  };
}

function rotateHue(hex: string, delta: number): string {
  const value = toColourValue(hex);
  const rotated = ((value.oklch.h + delta) % 360 + 360) % 360;
  return oklchToHex({ l: value.oklch.l, c: value.oklch.c, h: rotated });
}
