/**
 * ChromaBrew Figma plugin — entry point.
 *
 * Runs ChromaBrew's actual design-system engine (bundled from
 * `src/lib/design-system`) inside Figma: the user enters or selects a brand
 * colour, and the 50–950 scale, harmony palette and semantic tokens land as
 * local variables in a Light/Dark collection. Nothing leaves the plugin —
 * the manifest declares `networkAccess: none`.
 */
import { buildDesignSystem } from "../../src/lib/design-system/index";
import { normalizeHex } from "../../src/lib/design-system/colour/convert";
import { DEFAULT_CONFIG } from "../../src/lib/design-system/share";
import { buildTokenPlan, type TokenPlan } from "./token-plan";

type GenerateMessage = { type: "generate"; hex: string };
type ToUi = { type: "prefill"; hex: string } | { type: "error"; message: string };

figma.showUI(__html__, { width: 300, height: 176, themeColors: true });

/** Prefill from the first solid fill in the current selection, if any. */
function selectedSolidHex(): string | null {
  try {
    const node = figma.currentPage.selection[0];
    if (!node || !("fills" in node) || !Array.isArray(node.fills)) return null;
    const solid = node.fills.find((fill) => fill.type === "SOLID" && fill.visible !== false);
    if (!solid || solid.type !== "SOLID") return null;
    const { r, g, b } = solid.color;
    return `#${[r, g, b]
      .map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0"))
      .join("")}`;
  } catch {
    return null;
  }
}

/** Figma variable colour values are RGBA floats in 0–1. */
function toRgba(hex: string): RGBA {
  const bare = hex.replace(/^#/, "");
  const full = bare.length === 3 ? bare.split("").map((c) => c + c).join("") : bare;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) throw new Error(`Cannot parse "${hex}" as a colour`);
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
    a: 1,
  };
}

function modeIdFor(collection: VariableCollection, name: string): string {
  const existing = collection.modes.find((mode) => mode.name === name);
  if (existing) return existing.modeId;
  if (name === "Light") {
    // A fresh collection carries one default mode; make it Light.
    const fallback = collection.modes[0];
    if (fallback) {
      collection.renameMode(fallback.modeId, "Light");
      return fallback.modeId;
    }
  }
  return collection.addMode(name);
}

/**
 * Create (or update, on re-run) the collection for this plan. Idempotent:
 * variable names are matched inside the collection, so regenerating with a
 * tweaked palette refreshes values instead of duplicating entries.
 */
function applyTokenPlan(plan: TokenPlan): number {
  const collection =
    figma.variables
      .getLocalVariableCollections()
      .find((candidate) => candidate.name === plan.collectionName) ??
    figma.variables.createVariableCollection(plan.collectionName);

  const modeIds = new Map(plan.modes.map((mode) => [mode, modeIdFor(collection, mode)]));
  const locals = figma.variables.getLocalVariables("COLOR");

  for (const planned of plan.variables) {
    const existing = locals.find(
      (variable) =>
        variable.variableCollectionId === collection.id && variable.name === planned.name,
    );
    const variable =
      existing ?? figma.variables.createVariable(planned.name, collection, "COLOR");
    for (const mode of plan.modes) {
      variable.setValueForMode(modeIds.get(mode)!, toRgba(planned.values[mode]));
    }
  }
  return plan.variables.length;
}

figma.ui.postMessage({ type: "prefill", hex: selectedSolidHex() ?? DEFAULT_CONFIG.primary } satisfies ToUi);

figma.ui.onmessage = (raw: unknown) => {
  const message = raw as GenerateMessage;
  if (message?.type !== "generate") return;
  try {
    const hex = normalizeHex(message.hex);
    if (!hex) {
      figma.ui.postMessage({
        type: "error",
        message: `"${message.hex}" is not a valid hex colour — try #47003a.`,
      } satisfies ToUi);
      return;
    }
    const designSystem = buildDesignSystem({ ...DEFAULT_CONFIG, primary: hex });
    const plan = buildTokenPlan(designSystem);
    const count = applyTokenPlan(plan);
    figma.notify(
      `ChromaBrew: ${count} variables added to "${plan.collectionName}" (Light + Dark)`,
    );
    figma.closePlugin();
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Generation failed.",
    } satisfies ToUi);
  }
};
