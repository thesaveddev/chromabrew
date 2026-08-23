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

  // Seeds for secondary (muted, same hue) and accent (hue-rotated) roles.
  const accentSeed = toColourValue(
    // +30° analogous rotation in OKLCH space.
    rotateHue(primaryValue.hex, 30),
  );
  const secondarySeed = primaryValue;

  const palette = generatePalette(primaryValue.hex, config.paletteStrategy, {
    overrides: config.paletteOverrides,
  });

  const themes = {
    light: generateTheme(
      { primaryHex: primaryValue.hex, scale, accentSeedHex: accentSeed.hex, secondarySeedHex: secondarySeed.hex },
      "light",
    ),
    dark: generateTheme(
      { primaryHex: primaryValue.hex, scale, accentSeedHex: accentSeed.hex, secondarySeedHex: secondarySeed.hex },
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
        accentSeed: accentSeed,
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
