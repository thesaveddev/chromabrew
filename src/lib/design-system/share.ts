import { normalizeHex, parseColour } from "./colour/convert";
import { ZERO_REFINEMENT } from "./colour/refine";
import {
  normaliseRadiusStyle,
  normaliseTypeRatio,
} from "./primitives/generate";
import type {
  DarkBackgroundStyle,
  FontPairingId,
  GeneratorConfig,
  PaletteStrategyId,
  Refinement,
} from "./types";

const STRATEGIES: PaletteStrategyId[] = [
  "complementary",
  "analogous",
  "triadic",
  "split-complementary",
  "monochromatic",
  "tetradic",
];

const DARK_BACKGROUNDS: DarkBackgroundStyle[] = ["tinted", "solid-black", "custom"];

const FONT_PAIRING_IDS: FontPairingId[] = [
  "system",
  "grotesque",
  "editorial",
  "humanist",
  "geometric",
  "technical",
];

export const DEFAULT_CONFIG: GeneratorConfig = {
  primary: "#47003a",
  secondary: "#7c3aed",
  accent: "#f59e0b",
  paletteStrategy: "complementary",
  paletteSize: 6,
  lockedIndices: [],
  paletteOverrides: {},
  radiusStyle: "soft",
  typeRatio: 1.25,
  refinement: { ...ZERO_REFINEMENT },
  darkBackground: "tinted",
  customDarkBg: undefined,
  fontPairing: "system",
};

/** Clamp a persisted/partial config into a complete, valid one. */
export function normaliseConfig(config: Partial<GeneratorConfig>): GeneratorConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    lockedIndices: Array.isArray(config.lockedIndices) ? config.lockedIndices : [],
    paletteOverrides: config.paletteOverrides ?? {},
    paletteSize: Math.min(10, Math.max(3, Math.round(config.paletteSize ?? DEFAULT_CONFIG.paletteSize))),
    refinement: { ...ZERO_REFINEMENT, ...(config.refinement ?? {}) },
    darkBackground:
      config.darkBackground && DARK_BACKGROUNDS.includes(config.darkBackground)
        ? config.darkBackground
        : DEFAULT_CONFIG.darkBackground,
    fontPairing:
      config.fontPairing && FONT_PAIRING_IDS.includes(config.fontPairing)
        ? config.fontPairing
        : DEFAULT_CONFIG.fontPairing,
  };
}

function parseIndices(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => Number.parseInt(part, 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < 12);
}

function parseOverrides(value: string | null): Record<number, string> {
  if (!value) return {};
  const overrides: Record<number, string> = {};
  value.split(",").forEach((entry) => {
    const [rawIndex, rawHex] = entry.split(":");
    const index = Number.parseInt(rawIndex ?? "", 10);
    const hex = normalizeHex(rawHex ?? "");
    if (Number.isInteger(index) && index >= 0 && index < 12 && hex) {
      overrides[index] = hex;
    }
  });
  return Object.keys(overrides).length ? overrides : {};
}

/** Read generator configuration from URL search params (forgiving). */
export function configFromParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): GeneratorConfig {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    const v = params[key];
    return Array.isArray(v) ? v[0] ?? null : v ?? null;
  };

  const primaryParam = get("primary") ?? get("p");
  const primary =
    (primaryParam &&
      (normalizeHex(primaryParam.startsWith("#") ? primaryParam : `#${primaryParam}`) ||
        parseColour(primaryParam))) ||
    null;

  const secondaryParam = get("secondary") ?? get("sec");
  const secondary =
    (secondaryParam &&
      (normalizeHex(secondaryParam.startsWith("#") ? secondaryParam : `#${secondaryParam}`) ||
        parseColour(secondaryParam))) ||
    null;

  const accentParam = get("accent") ?? get("acc");
  const accent =
    (accentParam &&
      (normalizeHex(accentParam.startsWith("#") ? accentParam : `#${accentParam}`) ||
        parseColour(accentParam))) ||
    null;

  const strategyParam = get("strategy") ?? get("s");
  const strategy =
    strategyParam && STRATEGIES.includes(strategyParam as PaletteStrategyId)
      ? (strategyParam as PaletteStrategyId)
      : DEFAULT_CONFIG.paletteStrategy;

  const radius = normaliseRadiusStyle(get("radius"));
  const ratio = normaliseTypeRatio(get("ratio"));

  const refinement: Refinement = {
    brightness: parseRange(get("bright"), -50, 50),
    saturation: parseRange(get("sat"), -50, 50),
    hueShift: parseRange(get("hue"), -180, 180),
    temperature: parseRange(get("temp"), -50, 50),
  };

  const darkParam = get("dbg");
  const darkBackground =
    darkParam && DARK_BACKGROUNDS.includes(darkParam as DarkBackgroundStyle)
      ? (darkParam as DarkBackgroundStyle)
      : DEFAULT_CONFIG.darkBackground;
  const customDarkBg = normalizeHex(get("dbghex") ?? "") ?? undefined;

  const fontsParam = get("fonts");
  const fontPairing =
    fontsParam && FONT_PAIRING_IDS.includes(fontsParam as FontPairingId)
      ? (fontsParam as FontPairingId)
      : DEFAULT_CONFIG.fontPairing;

  return {
    primary: primary ?? DEFAULT_CONFIG.primary,
    secondary: secondary ?? DEFAULT_CONFIG.secondary,
    accent: accent ?? DEFAULT_CONFIG.accent,
    paletteStrategy: strategy,
    paletteSize: parseSize(get("size")),
    lockedIndices: parseIndices(get("locked")),
    paletteOverrides: parseOverrides(get("custom")),
    radiusStyle: radius ?? DEFAULT_CONFIG.radiusStyle,
    typeRatio: ratio ?? DEFAULT_CONFIG.typeRatio,
    refinement,
    darkBackground,
    customDarkBg,
    fontPairing,
  };
}

function parseRange(value: string | null, min: number, max: number): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function parseSize(value: string | null): number {
  if (!value) return DEFAULT_CONFIG.paletteSize;
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n)) return DEFAULT_CONFIG.paletteSize;
  return Math.min(10, Math.max(3, n));
}

/** Encode configuration into canonical query params. */
export function paramsFromConfig(config: GeneratorConfig): Record<string, string> {
  const params: Record<string, string> = {
    primary: config.primary.replace("#", ""),
    secondary: config.secondary.replace("#", ""),
    accent: config.accent.replace("#", ""),
    strategy: config.paletteStrategy,
    radius: config.radiusStyle,
    ratio: String(config.typeRatio),
  };
  if (config.lockedIndices.length) {
    params.locked = [...config.lockedIndices].sort((a, b) => a - b).join(",");
  }
  const overrideEntries = Object.entries(config.paletteOverrides);
  if (overrideEntries.length) {
    params.custom = overrideEntries
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([index, hex]) => `${index}:${hex.replace("#", "")}`)
      .join(",");
  }
  if (config.paletteSize !== DEFAULT_CONFIG.paletteSize) {
    params.size = String(config.paletteSize);
  }
  const { refinement } = config;
  if (refinement.brightness) params.bright = String(refinement.brightness);
  if (refinement.saturation) params.sat = String(refinement.saturation);
  if (refinement.hueShift) params.hue = String(refinement.hueShift);
  if (refinement.temperature) params.temp = String(refinement.temperature);
  if (config.darkBackground !== "tinted") {
    params.dbg = config.darkBackground;
  }
  if (config.customDarkBg && config.darkBackground === "custom") {
    params.dbghex = config.customDarkBg.replace("#", "");
  }
  if (config.fontPairing !== "system") {
    params.fonts = config.fontPairing;
  }
  return params;
}

export function configToQueryString(config: GeneratorConfig): string {
  const params = paramsFromConfig(config);
  const search = new URLSearchParams(params);
  return `/design-system?${search.toString()}`;
}
