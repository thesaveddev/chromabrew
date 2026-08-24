import type {
  RadiusStyle,
  RadiusTokens,
  ShadowTokens,
  SpacingScale,
  TypeScaleRatio,
  TypographyTokens,
} from "./primitives/generate";

export type ThemeMode = "light" | "dark";

export type PaletteStrategyId =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "monochromatic"
  | "tetradic";

/** Post-generation adjustments, all expressed in friendly units. */
export interface Refinement {
  /** -50…50 (%) */
  brightness: number;
  /** -50…50 (%) */
  saturation: number;
  /** -180…180 (degrees) */
  hueShift: number;
  /** -50 (cool) … 50 (warm) (%) */
  temperature: number;
}

export type DarkBackgroundStyle = "tinted" | "solid-black" | "custom";

export type FontPairingId =
  | "system"
  | "grotesque"
  | "editorial"
  | "humanist"
  | "geometric"
  | "technical";

export interface GeneratorConfig {
  primary: string;
  secondary: string;
  accent: string;
  paletteStrategy: PaletteStrategyId;
  /** Number of swatches in the generated palette (3–10). */
  paletteSize: number;
  /** Indices locked against regeneration (and refinement). */
  lockedIndices: number[];
  /** Manual overrides keyed by palette index. */
  paletteOverrides: Record<number, string>;
  radiusStyle: RadiusStyle;
  typeRatio: TypeScaleRatio;
  refinement: Refinement;
  darkBackground: DarkBackgroundStyle;
  /** Background hex when darkBackground is "custom". */
  customDarkBg?: string;
  fontPairing: FontPairingId;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** A colour resolved into every format we surface in the UI. */
export interface ColourValue {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  oklch: Oklch;
}

/** One step of the generated brand scale (50…950). */
export interface ScaleStep {
  /** Scale ordinal, e.g. 50, 100 … 950. */
  step: number;
  hex: string;
  oklch: Oklch;
  /**
   * True when this step is the exact colour the user supplied, i.e. the
   * engine pinned the source colour rather than deriving it.
   */
  isSource: boolean;
}

export interface PaletteColour {
  hex: string;
  /** Stable role label for UI display, e.g. "Complement". */
  role: string;
  /** Index of the swatch; used for lock identity across regeneration. */
  index: number;
  locked: boolean;
  /** True when the user manually overrode the generated value. */
  edited: boolean;
}

export type SemanticTokenId =
  | "background"
  | "background-subtle"
  | "surface"
  | "surface-raised"
  | "surface-muted"
  | "foreground"
  | "foreground-muted"
  | "foreground-subtle"
  | "primary"
  | "primary-hover"
  | "primary-active"
  | "primary-foreground"
  | "secondary"
  | "secondary-hover"
  | "secondary-foreground"
  | "accent"
  | "accent-foreground"
  | "border"
  | "border-muted"
  | "border-strong"
  | "input"
  | "input-border"
  | "focus-ring"
  | "success"
  | "success-foreground"
  | "warning"
  | "warning-foreground"
  | "danger"
  | "danger-foreground"
  | "info"
  | "info-foreground";

export type ThemeTokens = Record<SemanticTokenId, string>;

export type WcagLevel = "AA" | "AAA";

export interface ContrastGrade {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export interface AccessibilityCheck {
  id: string;
  label: string;
  foregroundHex: string;
  backgroundHex: string;
  mode: ThemeMode;
  grade: ContrastGrade;
}

export interface AccessibilityReport {
  checks: AccessibilityCheck[];
  /** Overall result for the key UI pairings per mode. */
  summary: Record<ThemeMode, { passed: boolean; failing: number }>;
}

export interface DesignSystemMetadata {
  name: string;
  sourceKind: "hex" | "rgb" | "hsl" | "image" | "palette";
  generatorVersion: string;
}

/**
 * The canonical internal representation of a generated design system.
 * Previews and export adapters must consume this structure and must never
 * recalculate colours independently.
 */
export interface DesignSystem {
  metadata: DesignSystemMetadata;
  source: {
    input: string;
    primary: ColourValue;
  };
  configuration: GeneratorConfig;
  primitives: {
    colors: {
      scale: ScaleStep[];
      palette: PaletteColour[];
      accentSeed: ColourValue;
    };
    typography: TypographyTokens;
    spacing: SpacingScale;
    radius: RadiusTokens;
    shadows: ShadowTokens;
  };
  themes: Record<ThemeMode, ThemeTokens>;
  accessibility: AccessibilityReport;
}

export type {
  SpacingScale,
  RadiusTokens,
  ShadowTokens,
  TypographyTokens,
  TypeStep,
  TypeScaleRatio,
  RadiusStyle,
} from "./primitives/generate";
