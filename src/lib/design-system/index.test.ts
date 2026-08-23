import { describe, expect, it } from "vitest";
import { buildDesignSystem, DEFAULT_PRIMARY } from "./index";
import { configFromParams, configToQueryString } from "./share";
import { cssAdapter } from "./exports/css";
import { jsonAdapter } from "./exports/json";
import { tailwindAdapter } from "./exports/tailwind";
import { shadcnAdapter } from "./exports/shadcn";

describe("buildDesignSystem â€” critical workflow integration", () => {
  const system = buildDesignSystem({
    primary: "#47003a",
    secondary: "#7c3aed",
    accent: "#f59e0b",
    paletteStrategy: "complementary",
    radiusStyle: "soft",
    typeRatio: 1.25,
    lockedIndices: [],
    paletteOverrides: {},
  });

  it("records the source colour", () => {
    expect(system.source.primary.hex).toBe("#47003a");
  });

  it("derives scale â†’ palette â†’ themes â†’ accessibility in order", () => {
    expect(system.primitives.colors.scale).toHaveLength(11);
    expect(system.primitives.colors.palette.length).toBeGreaterThanOrEqual(2);
    expect(system.themes.light.background).not.toBe(
      system.themes.dark.background,
    );
    expect(system.accessibility.checks.length).toBeGreaterThan(0);
  });

  it("is deterministic for identical configs", () => {
    const again = buildDesignSystem({
      primary: "#47003a",
      secondary: "#7c3aed",
      accent: "#f59e0b",
      paletteStrategy: "complementary",
      radiusStyle: "soft",
      typeRatio: 1.25,
      lockedIndices: [],
      paletteOverrides: {},
    });
    expect(again.themes.light).toEqual(system.themes.light);
    expect(again.primitives.colors.scale).toEqual(system.primitives.colors.scale);
  });
});

describe("shareable URL codec", () => {
  it("round-trips configuration", () => {
    const config = {
      primary: "#47003a",
      secondary: "#7c3aed",
      accent: "#f59e0b",
      paletteStrategy: "triadic" as const,
      lockedIndices: [1, 2],
      paletteOverrides: { 3: "#123456" },
      radiusStyle: "round" as const,
      typeRatio: 1.333 as const,
    };
    const url = configToQueryString(config);
    expect(url.startsWith("/design-system?")).toBe(true);

    const search = new URLSearchParams(url.split("?")[1]);
    const decoded = configFromParams(search);
    expect(decoded.primary).toBe("#47003a");
    expect(decoded.paletteStrategy).toBe("triadic");
    expect(decoded.lockedIndices).toEqual([1, 2]);
    expect(decoded.paletteOverrides[3]).toBe("#123456");
    expect(decoded.radiusStyle).toBe("round");
    expect(decoded.typeRatio).toBe(1.333);
  });

  it("parses the documented share format ?primary=47003A", () => {
    const decoded = configFromParams(new URLSearchParams("primary=47003A"));
    expect(decoded.primary).toBe("#47003a");
  });

  it("falls back safely on garbage input", () => {
    const decoded = configFromParams(
      new URLSearchParams("primary=zzz&strategy=hack&locked=99,-4"),
    );
    expect(decoded.primary).toBe(DEFAULT_PRIMARY);
    expect(decoded.paletteStrategy).toBe("complementary");
    expect(decoded.lockedIndices).toEqual([]);
  });
});

describe("export adapters", () => {
  const system = buildDesignSystem({
    primary: "#47003a",
    secondary: "#7c3aed",
    accent: "#f59e0b",
    paletteStrategy: "complementary",
    radiusStyle: "soft",
    typeRatio: 1.25,
    lockedIndices: [],
    paletteOverrides: {},
  });

  it("CSS adapter emits :root and .dark blocks with all tokens", () => {
    const result = cssAdapter.generate(system);
    expect(result.language).toBe("css");
    expect(result.code).toContain(":root {");
    expect(result.code).toContain(".dark {");
    expect(result.code).toContain("--background:");
    expect(result.code).toContain("--primary-hover:");
    expect(result.code).toContain("--success-foreground:");
  });

  it("CSS adapter emits primitive tokens for typography, spacing, radius and shadows", () => {
    const result = cssAdapter.generate(system);
    expect(result.code).toContain("--font-size-base: 1rem;");
    expect(result.code).toContain("--font-size-2xl-line-height:");
    expect(result.code).toContain("--space-4: 0.25rem;");
    expect(result.code).toContain("--radius-lg:");
    expect(result.code).toContain("--shadow-md:");
    // Primitives are mode-independent — emitted once.
    expect(result.code.split("--radius-sm:").length - 1).toBe(1);
  });

  it("JSON adapter emits valid DTCG-style tokens", () => {
    const result = jsonAdapter.generate(system);
    expect(result.suggestedFilename).toBe("design-tokens.json");
    const parsed = JSON.parse(result.code) as Record<string, unknown>;
    expect(parsed.primitive).toBeDefined();
    expect(parsed.semantic).toBeDefined();
    const semantic = parsed.semantic as Record<string, Record<string, { $value: string }>>;
    expect(semantic.light["primary"].$value).toMatch(/^#/);
    expect(semantic.dark["background"].$value).toMatch(/^#/);
    // Brand scale included.
    const primitive = parsed.primitive as {
      color: { brand: Record<string, { $value: string }> };
      typography: {
        fontFamily: Record<string, unknown>;
        fontSize: Record<string, { size: { $value: string } }>;
      };
      spacing: Record<string, { $value: string }>;
      radius: Record<string, { $value: string }>;
      shadow: Record<string, unknown>;
    };
    expect(Object.keys(primitive.color.brand)).toHaveLength(11);
    expect(primitive.color.brand["950"].$value).toBe("#47003a");
    expect(primitive.typography.fontSize.base.size.$value).toBe("1rem");
    expect(primitive.spacing["16"].$value).toBe("1rem");
    expect(Object.keys(primitive.radius)).toContain("xl");
    expect(Object.keys(primitive.shadow)).toEqual(["sm", "md", "lg", "xl"]);
  });

  it("Tailwind adapter emits v4 @theme output", () => {
    const result = tailwindAdapter.generate(system);
    expect(result.code).toContain('@import "tailwindcss";');
    expect(result.code).toContain("@custom-variant dark (&:is(.dark *));");
    expect(result.code).toContain("@theme inline {");
    expect(result.code).toContain("--color-primary: var(--primary);");
    expect(result.code).toContain("--color-brand-500: #");
    // Typography/radius/shadow primitives use native v4 namespaces.
    expect(result.code).toContain("--text-base: 1rem;");
    expect(result.code).toContain("--text-sm--line-height:");
    expect(result.code).toContain("--radius-lg: 0.75rem;");
    expect(result.code).toContain("--shadow-xl: 0 8px 16px");
    expect(result.code).toContain("--radius: var(--radius-md);");
  });

  it("shadcn adapter emits oklch variables with current conventions", () => {
    const result = shadcnAdapter.generate(system);
    expect(result.code).toContain("--card: oklch(");
    expect(result.code).toContain("--popover-foreground: oklch(");
    expect(result.code).toContain("--chart-5: oklch(");
    expect(result.code).toContain("--radius: 0.625rem;");
    expect(result.code).toContain(".dark {");
    // Current shadcn has no separate destructive foreground variable.
    expect(result.code).not.toContain("--destructive-foreground");
  });

  it("every adapter is deterministic and non-empty", () => {
    for (const adapter of [cssAdapter, jsonAdapter, tailwindAdapter, shadcnAdapter]) {
      const a = adapter.generate(system);
      const b = adapter.generate(system);
      expect(a.code.length).toBeGreaterThan(100);
      expect(a.code).toBe(b.code);
    }
  });
});
