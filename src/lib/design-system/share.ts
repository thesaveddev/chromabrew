import { normalizeHex, parseColour } from "./colour/convert";
import {
  normaliseRadiusStyle,
  normaliseTypeRatio,
} from "./primitives/generate";
import type { GeneratorConfig, PaletteStrategyId } from "./types";

const STRATEGIES: PaletteStrategyId[] = [
  "complementary",
  "analogous",
  "triadic",
  "split-complementary",
  "monochromatic",
  "tetradic",
];

export const DEFAULT_CONFIG: GeneratorConfig = {
  primary: "#47003a",
  paletteStrategy: "complementary",
  lockedIndices: [],
  paletteOverrides: {},
  radiusStyle: "soft",
  typeRatio: 1.25,
};

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

  const strategyParam = get("strategy") ?? get("s");
  const strategy =
    strategyParam && STRATEGIES.includes(strategyParam as PaletteStrategyId)
      ? (strategyParam as PaletteStrategyId)
      : DEFAULT_CONFIG.paletteStrategy;

  const radius = normaliseRadiusStyle(get("radius"));
  const ratio = normaliseTypeRatio(get("ratio"));

  return {
    primary: primary ?? DEFAULT_CONFIG.primary,
    paletteStrategy: strategy,
    lockedIndices: parseIndices(get("locked")),
    paletteOverrides: parseOverrides(get("custom")),
    radiusStyle: radius ?? DEFAULT_CONFIG.radiusStyle,
    typeRatio: ratio ?? DEFAULT_CONFIG.typeRatio,
  };
}

/** Encode configuration into canonical query params. */
export function paramsFromConfig(config: GeneratorConfig): Record<string, string> {
  const params: Record<string, string> = {
    primary: config.primary.replace("#", ""),
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
  return params;
}

export function configToQueryString(config: GeneratorConfig): string {
  const params = paramsFromConfig(config);
  const search = new URLSearchParams(params);
  return `/design-system?${search.toString()}`;
}
