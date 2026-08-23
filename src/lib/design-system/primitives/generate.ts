export type TypeScaleRatio = 1.2 | 1.25 | 1.333;
export type RadiusStyle = "sharp" | "soft" | "round";

export const TYPE_RATIOS: Record<string, TypeScaleRatio> = {
  compact: 1.2,
  normal: 1.25,
  generous: 1.333,
};

export const RADIUS_STYLES: RadiusStyle[] = ["sharp", "soft", "round"];

export interface TypeStep {
  /** rem value, e.g. "1rem". */
  size: string;
  lineHeight: number;
  letterSpacing: string;
}

export interface TypographyTokens {
  fontFamily: { sans: string; mono: string };
  fontSize: Record<
    "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl",
    TypeStep
  >;
}

/** Ordered step names from smallest to the display sizes. */
const TYPE_STEPS = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
] as const;

const BASE_INDEX = TYPE_STEPS.indexOf("base");
const BASE_REM = 1;
const BASE_LINE_HEIGHT = 1.5;

/**
 * Generate a ratio-based type scale around a 1rem body size. Line heights
 * tighten as sizes grow (display text needs less leading than body).
 */
export function generateTypography(ratio: TypeScaleRatio): TypographyTokens {
  const fontSize = {} as TypographyTokens["fontSize"];
  TYPE_STEPS.forEach((name, index) => {
    const exponent = index - BASE_INDEX;
    const rem = BASE_REM * ratio ** exponent;
    let lineHeight: number;
    if (exponent <= -1) lineHeight = 1.45;
    else if (exponent === 0) lineHeight = BASE_LINE_HEIGHT;
    else if (exponent === 1) lineHeight = 1.4;
    else if (exponent === 2) lineHeight = 1.3;
    else lineHeight = 1.15;
    const letterSpacing =
      exponent >= 3 ? "-0.02em" : exponent === 2 ? "-0.01em" : "0em";
    fontSize[name] = {
      size: `${round(rem)}rem`,
      lineHeight,
      letterSpacing,
    };
  });

  return {
    fontFamily: {
      sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    },
    fontSize,
  };
}

function round(rem: number): number {
  return Math.round(rem * 1000) / 1000;
}

/* ------------------------------------------------------------------ */
/* Spacing                                                             */
/* ------------------------------------------------------------------ */

/** 4px-base spacing scale keyed by pixel size ("4" = 0.25rem â€¦ "96" = 24rem). */
const SPACING_MULTIPLIERS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] as const;

export type SpacingScale = Record<string, string>;

export function generateSpacing(): SpacingScale {
  const scale: SpacingScale = {};
  for (const m of SPACING_MULTIPLIERS) {
    scale[String(m * 4)] = `${m * 0.25}rem`;
  }
  return scale;
}

/* ------------------------------------------------------------------ */
/* Radius                                                              */
/* ------------------------------------------------------------------ */

export interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

const RADIUS_PRESETS: Record<RadiusStyle, Omit<RadiusTokens, "full">> = {
  sharp: { sm: "0.125rem", md: "0.125rem", lg: "0.25rem", xl: "0.25rem" },
  soft: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1rem" },
  round: { sm: "0.375rem", md: "0.75rem", lg: "1rem", xl: "1.5rem" },
};

export function generateRadius(style: RadiusStyle): RadiusTokens {
  return { ...RADIUS_PRESETS[style], full: "9999px" };
}

/* ------------------------------------------------------------------ */
/* Shadows                                                             */
/* ------------------------------------------------------------------ */

export type ShadowTokens = Record<"sm" | "md" | "lg" | "xl", string>;

/**
 * Neutral elevation set shared by both themes — layered soft shadows
 * rather than coloured glows.
 */
export function generateShadows(): ShadowTokens {
  return {
    sm: "0 1px 2px 0 rgb(0 0 / 0.05)",
    md: "0 2px 4px -1px rgb(0 0 / 0.06), 0 4px 10px -2px rgb(0 0 / 0.07)",
    lg: "0 4px 8px -2px rgb(0 0 / 0.08), 0 12px 24px -6px rgb(0 0 / 0.1)",
    xl: "0 8px 16px -4px rgb(0 0 / 0.1), 0 24px 48px -12px rgb(0 0 / 0.14)",
  };
}

/* ------------------------------------------------------------------ */
/* Config helpers                                                      */
/* ------------------------------------------------------------------ */

export function normaliseTypeRatio(value: string | null): TypeScaleRatio | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  for (const candidate of Object.values(TYPE_RATIOS)) {
    if (Math.abs(candidate - parsed) < 0.001) return candidate;
  }
  return null;
}

export function normaliseRadiusStyle(value: string | null): RadiusStyle | null {
  return value && RADIUS_STYLES.includes(value as RadiusStyle)
    ? (value as RadiusStyle)
    : null;
}
