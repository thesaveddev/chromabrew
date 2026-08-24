import { generateScale } from "./colour/scale";
import { toColourValue } from "./colour/convert";
import { applyRefinement, ZERO_REFINEMENT } from "./colour/refine";
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
import { normaliseConfig } from "./share";
import type { DesignSystem, GeneratorConfig } from "./types";

export const GENERATOR_VERSION = "1.2.0";

export const DEFAULT_PRIMARY = "#47003a";

export { ZERO_REFINEMENT, normaliseConfig };

/** The refined seed colours actually driving generation. */
export function refinedSeeds(config: GeneratorConfig): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const r = config.refinement;
  return {
    primary: applyRefinement(config.primary, r),
    secondary: applyRefinement(config.secondary, r),
    accent: applyRefinement(config.accent, r),
  };
}

function resolveDarkBackgroundHex(config: GeneratorConfig): string | undefined {
  if (config.darkBackground === "solid-black") return "#000000";
  if (config.darkBackground === "custom" && config.customDarkBg) {
    try {
      return toColourValue(config.customDarkBg).hex;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Deterministically build the canonical DesignSystem from a configuration.
 * This is the single entry point consumed by the generator UI, previews
 * and export adapters.
 */
export function buildDesignSystem(input: GeneratorConfig): DesignSystem {
  const config = normaliseConfig(input);
  const seeds = refinedSeeds(config);

  const primaryValue = toColourValue(seeds.primary);

  const scale = generateScale(primaryValue.hex);

  // Locked swatches keep their unrefined colour (refinement exemption),
  // overrides are respected verbatim, everything else derives from the
  // refined primary.
  const basePalette = generatePalette(
    toColourValue(config.primary).hex,
    config.paletteStrategy,
    { overrides: config.paletteOverrides, size: config.paletteSize },
  );
  const refinedPalette = generatePalette(primaryValue.hex, config.paletteStrategy, {
    overrides: config.paletteOverrides,
    size: config.paletteSize,
  });
  const palette = basePalette.map((swatch, index) => {
    if (
      config.lockedIndices.includes(index) ||
      config.paletteOverrides[index]
    ) {
      return swatch;
    }
    return refinedPalette[index];
  });

  // Derive secondary and accent from the palette strategy when the user
  // hasn't explicitly chosen them.
  const secondaryHex = seeds.secondary;
  const accentHex = seeds.accent;

  const themes = {
    light: generateTheme(
      { primaryHex: primaryValue.hex, scale, accentSeedHex: accentHex, secondarySeedHex: secondaryHex },
      "light",
    ),
    dark: generateTheme(
      {
        primaryHex: primaryValue.hex,
        scale,
        accentSeedHex: accentHex,
        secondarySeedHex: secondaryHex,
        darkBackgroundHex: resolveDarkBackgroundHex(config),
      },
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
      typography: generateTypography(config.typeRatio, config.fontPairing),
      spacing: generateSpacing(),
      radius: generateRadius(config.radiusStyle),
      shadows: generateShadows(),
    },
    themes,
    accessibility,
  };
}
