import type { CSSProperties } from "react";
import type {
  DesignSystem,
  ThemeMode,
  ThemeTokens,
} from "@/lib/design-system/types";

/** Map semantic tokens onto `--ds-*` custom properties for a subtree. */
export function tokensToStyle(tokens: ThemeTokens): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [id, hex] of Object.entries(tokens)) {
    vars[`--ds-${id}`] = hex;
  }
  return vars as CSSProperties;
}

/** Inject semantic tokens plus radius/shadow/font primitives for one mode. */
export function systemToStyle(system: DesignSystem, mode: ThemeMode): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [id, hex] of Object.entries(system.themes[mode])) {
    vars[`--ds-${id}`] = hex;
  }
  const { typography } = system.primitives;
  vars["--ds-font-heading"] = typography.fontFamily.heading;
  vars["--ds-font-sans"] = typography.fontFamily.sans;
  vars["--ds-font-mono"] = typography.fontFamily.mono;
  for (const [name, value] of Object.entries(system.primitives.radius)) {
    vars[`--ds-radius-${name}`] = value;
  }
  for (const [name, value] of Object.entries(system.primitives.shadows)) {
    vars[`--ds-shadow-${name}`] = value;
  }
  return vars as CSSProperties;
}

/** Chart series colours derived deterministically from the palette/scale. */
export function chartColours(
  palette: { hex: string }[],
  scale: { step: number; hex: string }[],
): string[] {
  if (palette.length >= 4) return palette.slice(0, 4).map((p) => p.hex);
  const preferred = [400, 500, 600, 700];
  return preferred.map(
    (step) => scale.find((s) => s.step === step)?.hex ?? scale[0].hex,
  );
}
