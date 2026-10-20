import { describe, expect, it } from "vitest";
import { buildDesignSystem } from "../../src/lib/design-system/index";
import { DEFAULT_CONFIG } from "../../src/lib/design-system/share";
import { buildTokenPlan } from "./token-plan";

const designSystem = buildDesignSystem(DEFAULT_CONFIG);
const plan = buildTokenPlan(designSystem);

describe("buildTokenPlan", () => {
  it("names the collection after the primary colour", () => {
    expect(plan.collectionName).toBe("ChromaBrew #47003A");
    expect(plan.modes).toEqual(["Light", "Dark"]);
  });

  it("maps the full 50–950 scale with identical values in both modes", () => {
    const scale = plan.variables.filter((v) => v.name.startsWith("scale/"));
    expect(scale).toHaveLength(designSystem.primitives.colors.scale.length);
    expect(scale.map((v) => v.name)).toContain("scale/50");
    expect(scale.map((v) => v.name)).toContain("scale/950");
    for (const variable of scale) {
      expect(variable.values.Light).toBe(variable.values.Dark);
    }
    // Values track the engine, never recomputed here.
    expect(scale[0].values.Light).toBe(designSystem.primitives.colors.scale[0].hex);
  });

  it("maps every palette swatch under palette/", () => {
    const palette = plan.variables.filter((v) => v.name.startsWith("palette/"));
    expect(palette).toHaveLength(designSystem.primitives.colors.palette.length);
    for (const variable of palette) {
      expect(variable.name).toMatch(/^palette\/[a-z0-9-]+$/);
    }
  });

  it("maps every semantic token with per-mode values from the engine", () => {
    const semantic = plan.variables.filter((v) => v.name.startsWith("semantic/"));
    expect(semantic).toHaveLength(Object.keys(designSystem.themes.light).length);
    const background = semantic.find((v) => v.name === "semantic/background");
    expect(background).toBeDefined();
    expect(background!.values.Light).toBe(designSystem.themes.light.background);
    expect(background!.values.Dark).toBe(designSystem.themes.dark.background);
    // The dark theme must actually differ, or the second mode is pointless.
    expect(background!.values.Dark).not.toBe(background!.values.Light);
  });

  it("produces unique variable names and complete values", () => {
    expect(new Set(plan.variables.map((v) => v.name)).size).toBe(plan.variables.length);
    for (const variable of plan.variables) {
      expect(variable.values.Light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(variable.values.Dark).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("stays deterministic for the same input", () => {
    expect(buildTokenPlan(buildDesignSystem(DEFAULT_CONFIG))).toEqual(plan);
  });
});
