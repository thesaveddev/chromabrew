import type { CSSProperties } from "react";
import type { ThemeTokens } from "@/lib/design-system/types";

/** Map semantic tokens onto `--ds-*` custom properties for a subtree. */
export function tokensToStyle(tokens: ThemeTokens): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [id, hex] of Object.entries(tokens)) {
    vars[`--ds-${id}`] = hex;
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
