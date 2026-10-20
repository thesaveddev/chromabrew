/**
 * Pure planner: a ChromaBrew `DesignSystem` → the variable plan a Figma
 * plugin should create. Kept free of `figma.*` globals so it can be unit
 * tested in the root Vitest suite; `code.ts` only performs the API calls.
 *
 * Layout mirrors how the web app exports tokens:
 * - `scale/…`      the perceptual 50–950 ramp (identical in both modes)
 * - `palette/…`    harmony swatches by role (identical in both modes)
 * - `semantic/…`   token ids with per-mode values — Light and Dark modes
 */
import type { DesignSystem } from "../../src/lib/design-system/types";

export const TOKEN_PLAN_MODES = ["Light", "Dark"] as const;
export type TokenPlanMode = (typeof TOKEN_PLAN_MODES)[number];

export interface PlannedVariable {
  /** Figma groups variables into folders on "/". */
  name: string;
  /** Hex value per mode name. */
  values: Record<TokenPlanMode, string>;
}

export interface TokenPlan {
  collectionName: string;
  modes: readonly TokenPlanMode[];
  variables: PlannedVariable[];
}

function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "colour";
}

export function buildTokenPlan(designSystem: DesignSystem): TokenPlan {
  const variables: PlannedVariable[] = [];
  const taken = new Set<string>();

  // Figma refuses duplicate variable names inside one collection; roles are
  // unique in practice, but the plan must hold for any input.
  const claim = (base: string): string => {
    let name = base;
    for (let suffix = 2; taken.has(name); suffix += 1) name = `${base}-${suffix}`;
    taken.add(name);
    return name;
  };

  const both = (hex: string): PlannedVariable["values"] => ({ Light: hex, Dark: hex });

  for (const step of designSystem.primitives.colors.scale) {
    variables.push({ name: claim(`scale/${step.step}`), values: both(step.hex) });
  }

  for (const swatch of designSystem.primitives.colors.palette) {
    variables.push({ name: claim(`palette/${slugify(swatch.role)}`), values: both(swatch.hex) });
  }

  const { light, dark } = designSystem.themes;
  for (const [tokenId, lightHex] of Object.entries(light)) {
    variables.push({
      name: claim(`semantic/${tokenId}`),
      values: { Light: lightHex, Dark: dark[tokenId as keyof typeof dark] ?? lightHex },
    });
  }

  return {
    collectionName: `ChromaBrew ${designSystem.source.primary.hex.toUpperCase()}`,
    modes: TOKEN_PLAN_MODES,
    variables,
  };
}
