import {
  hexToRgb,
  oklch,
  rgbToOklch,
} from "../colour/convert";
import {
  AA_NORMAL,
  contrastRatio,
  fixContrast,
  grade,
} from "../colour/contrast";
import type {
  AccessibilityCheck,
  AccessibilityReport,
  Oklch,
  ScaleStep,
  SemanticTokenId,
  ThemeMode,
  ThemeTokens,
} from "../types";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clampL = (v: number): number => Math.min(1, Math.max(0, v));

function setLightness(hex: string, l: number): string {
  const source = rgbToOklch(hexToRgb(hex));
  return oklch(clampL(l), source.c, source.h);
}

/**
 * Pick the member of `pool` closest to `reference` (in lightness) that
 * satisfies `validate`. Falls back to the closest member overall.
 */
function pickClosest(
  pool: string[],
  reference: string,
  validate: (hex: string) => boolean,
): string {
  const ref = rgbToOklch(hexToRgb(reference));
  const scored = pool
    .map((hex) => ({ hex, l: rgbToOklch(hexToRgb(hex)).l }))
    .sort((a, b) => Math.abs(a.l - ref.l) - Math.abs(b.l - ref.l));
  const passing = scored.find((candidate) => validate(candidate.hex));
  return passing?.hex ?? scored[0].hex;
}

/** Choose a foreground for `value`: first candidate meeting AA wins;
 * otherwise the highest-scoring candidate is used. */
export function pickForeground(candidates: string[], value: string): string {
  for (const candidate of candidates) {
    if (contrastRatio(candidate, value) >= AA_NORMAL) return candidate;
  }
  return [...candidates].sort(
    (a, b) => contrastRatio(b, value) - contrastRatio(a, value),
  )[0];
}

interface StatusSpec {
  id: "success" | "warning" | "danger" | "info";
  hue: number;
}

const STATUS_SPECS: StatusSpec[] = [
  { id: "success", hue: 145 },
  { id: "warning", hue: 85 },
  { id: "danger", hue: 25 },
  { id: "info", hue: 245 },
];

/**
 * Build a status colour/foreground pair. Foreground flips between white
 * and near-black based on measured contrast — never assumed.
 */
function statusPair(
  spec: StatusSpec,
  mode: ThemeMode,
  neutralDarkFg: string,
): { value: string; foreground: string } {
  const value: Oklch =
    mode === "light"
      ? { l: spec.id === "warning" ? 0.795 : 0.585, c: 0.16, h: spec.hue }
      : { l: spec.id === "warning" ? 0.82 : 0.75, c: 0.15, h: spec.hue };
  const valueHex = oklch(value.l, value.c, value.h);

  const white = "#ffffff";
  if (contrastRatio(valueHex, white) >= AA_NORMAL) {
    return { value: valueHex, foreground: white };
  }
  if (contrastRatio(valueHex, neutralDarkFg) >= AA_NORMAL) {
    return { value: valueHex, foreground: neutralDarkFg };
  }

  const fixedLight = fixContrast(valueHex, white);
  if (!fixedLight.unachievable) {
    return { value: fixedLight.hex, foreground: white };
  }
  const fixedDark = fixContrast(valueHex, neutralDarkFg);
  return { value: fixedDark.hex, foreground: neutralDarkFg };
}

/* ------------------------------------------------------------------ */
/* Theme generation                                                    */
/* ------------------------------------------------------------------ */

export interface ThemeGenerationInput {
  primaryHex: string;
  scale: ScaleStep[];
  /** Hue-shifted seeds derived from the palette engine. */
  accentSeedHex: string;
  secondarySeedHex: string;
}

export function generateTheme(
  input: ThemeGenerationInput,
  mode: ThemeMode,
): ThemeTokens {
  const { primaryHex, scale, accentSeedHex, secondarySeedHex } = input;
  const primaryOklch = rgbToOklch(hexToRgb(primaryHex));
  const h = primaryOklch.h;

  // Neutrals are tinted with a fraction of the brand chroma.
  const tint = (fraction: number, cap = 0.012): number =>
    Math.min(cap, primaryOklch.c * fraction);

  /* --- backgrounds & surfaces ------------------------------------- */
  const background =
    mode === "light" ? oklch(0.993, tint(0.12), h) : oklch(0.148, tint(0.55), h);
  const backgroundSubtle =
    mode === "light" ? oklch(0.968, tint(0.2), h) : oklch(0.178, tint(0.6), h);
  const surface =
    mode === "light" ? oklch(0.995, tint(0.06), h) : oklch(0.196, tint(0.6), h);
  const surfaceRaised = mode === "light" ? "#ffffff" : oklch(0.226, tint(0.65), h);
  const surfaceMuted =
    mode === "light" ? oklch(0.972, tint(0.22), h) : oklch(0.172, tint(0.5), h);

  /* --- foreground --------------------------------------------------- */
  const fgChroma = Math.min(0.03, primaryOklch.c * 0.35);
  const foreground =
    mode === "light"
      ? oklch(0.185, Math.min(0.028, fgChroma), h)
      : oklch(0.945, Math.min(0.014, primaryOklch.c * 0.18), h);
  const foregroundMuted =
    mode === "light"
      ? oklch(0.425, Math.min(0.024, fgChroma * 0.85), h)
      : oklch(0.72, Math.min(0.012, primaryOklch.c * 0.15), h);
  const foregroundSubtle =
    mode === "light"
      ? oklch(0.565, Math.min(0.02, fgChroma * 0.7), h)
      : oklch(0.562, Math.min(0.01, primaryOklch.c * 0.12), h);

  /* --- borders & inputs --------------------------------------------- */
  const borderMuted =
    mode === "light"
      ? oklch(0.925, tint(0.35, 0.01), h)
      : oklch(0.262, tint(0.5, 0.01), h);
  const border =
    mode === "light"
      ? oklch(0.9, tint(0.4, 0.012), h)
      : oklch(0.302, tint(0.55, 0.012), h);
  const borderStrong =
    mode === "light"
      ? oklch(0.815, tint(0.5, 0.016), h)
      : oklch(0.392, tint(0.6, 0.016), h);
  const inputBg = mode === "light" ? "#ffffff" : oklch(0.196, tint(0.6), h);

  /* --- primary ------------------------------------------------------- */
  const scaleHexes = scale.map((s) => s.hex);
  const whiteCandidate = "#ffffff";
  const darkCandidate =
    mode === "light" ? oklch(0.205, 0.02, h) : oklch(0.165, 0.015, h);
  const fgCandidates = [whiteCandidate, darkCandidate];

  // The primary must (a) read against the background and (b) support at
  // least one foreground at AA.
  const usableAsRole = (hex: string): boolean =>
    contrastRatio(hex, background) >= AA_NORMAL &&
    fgCandidates.some((fg) => contrastRatio(fg, hex) >= AA_NORMAL);

  const primaryPool =
    mode === "light" ? [primaryHex, ...scaleHexes] : [...scaleHexes, primaryHex];
  const primaryBase = pickClosest(primaryPool, primaryHex, usableAsRole);

  const baseL = rgbToOklch(hexToRgb(primaryBase)).l;
  const primaryHover =
    mode === "light"
      ? setLightness(primaryBase, baseL - 0.04)
      : setLightness(primaryBase, baseL + 0.05);
  const primaryActive =
    mode === "light"
      ? setLightness(primaryBase, baseL - 0.08)
      : setLightness(primaryBase, Math.max(0.1, baseL - 0.03));

  const primaryForeground = pickForeground(fgCandidates, primaryBase);

  /* --- secondary ------------------------------------------------------ */
  const secondarySeed = rgbToOklch(hexToRgb(secondarySeedHex));
  const secondaryHue = secondarySeed.c < 0.008 ? h : secondarySeed.h;
  const secondaryChromaCap = mode === "light" ? 0.009 : 0.012;
  const secondary = oklch(
    mode === "light" ? 0.962 : 0.235,
    Math.min(secondaryChromaCap, secondarySeed.c * 0.3),
    secondaryHue,
  );
  const secondaryHover = oklch(
    mode === "light" ? 0.928 : 0.275,
    Math.min(secondaryChromaCap + 0.002, secondarySeed.c * 0.35),
    secondaryHue,
  );
  const secondaryForeground =
    mode === "light" ? foreground : oklch(0.94, 0.008, secondaryHue);

  /* --- accent --------------------------------------------------------- */
  const accentSeed = rgbToOklch(hexToRgb(accentSeedHex));
  const accentPool: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const l = mode === "light" ? 0.28 + i * 0.062 : 0.42 + i * 0.052;
    accentPool.push(oklch(clampL(l), accentSeed.c, accentSeed.h));
  }
  const accentReferenceL =
    mode === "light"
      ? Math.min(0.62, Math.max(0.4, primaryOklch.l))
      : 0.75;
  const accentReference = oklch(accentReferenceL, accentSeed.c, accentSeed.h);
  const accent = pickClosest(accentPool, accentReference, usableAsRole);
  const accentForeground = pickForeground(fgCandidates, accent);

  /* --- status colours --------------------------------------------------- */
  const success = statusPair(STATUS_SPECS[0], mode, darkCandidate);
  const warning = statusPair(STATUS_SPECS[1], mode, darkCandidate);
  const danger = statusPair(STATUS_SPECS[2], mode, darkCandidate);
  const info = statusPair(STATUS_SPECS[3], mode, darkCandidate);

  return {
    background,
    "background-subtle": backgroundSubtle,
    surface,
    "surface-raised": surfaceRaised,
    "surface-muted": surfaceMuted,
    foreground,
    "foreground-muted": foregroundMuted,
    "foreground-subtle": foregroundSubtle,
    primary: primaryBase,
    "primary-hover": primaryHover,
    "primary-active": primaryActive,
    "primary-foreground": primaryForeground,
    secondary,
    "secondary-hover": secondaryHover,
    "secondary-foreground": secondaryForeground,
    accent,
    "accent-foreground": accentForeground,
    border,
    "border-muted": borderMuted,
    "border-strong": borderStrong,
    input: inputBg,
    "input-border": border,
    "focus-ring": primaryBase,
    success: success.value,
    "success-foreground": success.foreground,
    warning: warning.value,
    "warning-foreground": warning.foreground,
    danger: danger.value,
    "danger-foreground": danger.foreground,
    info: info.value,
    "info-foreground": info.foreground,
  };
}

export function semanticTokenIds(): SemanticTokenId[] {
  return [
    "background",
    "background-subtle",
    "surface",
    "surface-raised",
    "surface-muted",
    "foreground",
    "foreground-muted",
    "foreground-subtle",
    "primary",
    "primary-hover",
    "primary-active",
    "primary-foreground",
    "secondary",
    "secondary-hover",
    "secondary-foreground",
    "accent",
    "accent-foreground",
    "border",
    "border-muted",
    "border-strong",
    "input",
    "input-border",
    "focus-ring",
    "success",
    "success-foreground",
    "warning",
    "warning-foreground",
    "danger",
    "danger-foreground",
    "info",
    "info-foreground",
  ];
}

/* ------------------------------------------------------------------ */
/* Accessibility report                                                */
/* ------------------------------------------------------------------ */

interface CheckPairDefinition {
  id: string;
  label: string;
  fg: SemanticTokenId;
  bg: SemanticTokenId;
}

const CHECK_PAIRS: CheckPairDefinition[] = [
  { id: "body", label: "Body text on page background", fg: "foreground", bg: "background" },
  { id: "muted-text", label: "Muted text on page background", fg: "foreground-muted", bg: "background" },
  { id: "card-text", label: "Body text on cards", fg: "foreground", bg: "surface" },
  { id: "primary-button", label: "Primary button", fg: "primary-foreground", bg: "primary" },
  { id: "secondary-button", label: "Secondary button", fg: "secondary-foreground", bg: "secondary" },
  { id: "accent-element", label: "Accent element", fg: "accent-foreground", bg: "accent" },
  { id: "success-badge", label: "Success badge", fg: "success-foreground", bg: "success" },
  { id: "warning-badge", label: "Warning badge", fg: "warning-foreground", bg: "warning" },
  { id: "danger-badge", label: "Danger badge", fg: "danger-foreground", bg: "danger" },
  { id: "info-badge", label: "Info badge", fg: "info-foreground", bg: "info" },
];

/** Maps a check id (without mode suffix) to its semantic token ids. */
export const CHECK_PAIR_TOKENS: Record<
  string,
  { fg: SemanticTokenId; bg: SemanticTokenId }
> = Object.fromEntries(
  CHECK_PAIRS.map((p) => [p.id, { fg: p.fg, bg: p.bg }]),
);

export function buildAccessibilityReport(
  themes: Record<ThemeMode, ThemeTokens>,
): AccessibilityReport {
  const checks: AccessibilityCheck[] = [];
  const summary: AccessibilityReport["summary"] = {
    light: { passed: true, failing: 0 },
    dark: { passed: true, failing: 0 },
  };

  for (const mode of ["light", "dark"] as const) {
    const tokens = themes[mode];
    for (const pair of CHECK_PAIRS) {
      const foregroundHex = tokens[pair.fg];
      const backgroundHex = tokens[pair.bg];
      checks.push({
        id: `${pair.id}-${mode}`,
        label: pair.label,
        foregroundHex,
        backgroundHex,
        mode,
        grade: grade(contrastRatio(foregroundHex, backgroundHex)),
      });
    }
    const failing = checks.filter((c) => c.mode === mode && !c.grade.aaNormal).length;
    summary[mode] = { passed: failing === 0, failing };
  }

  return { checks, summary };
}
