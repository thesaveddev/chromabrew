import type { DesignSystem } from "../types";
import type { ExportAdapter } from "./adapter";
import { TOKEN_GROUPS } from "./css";

function varsBlock(
  system: DesignSystem,
  selector: string,
  mode: "light" | "dark",
  valueOf: (hex: string) => string,
): string {
  const tokens = system.themes[mode];
  const lines = [`${selector} {`];
  for (const group of TOKEN_GROUPS) {
    for (const id of group.tokens) {
      const hex = tokens[id as keyof typeof tokens];
      if (!hex) continue;
      lines.push(`  --${id}: ${valueOf(hex)};`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

/**
 * Tailwind CSS v4 theme output. Uses the current `@theme inline` +
 * `@custom-variant dark` convention so `bg-background`, `text-primary`,
 * `dark:` variants and friends work out of the box.
 */
export const tailwindAdapter: ExportAdapter = {
  id: "tailwind",
  name: "Tailwind CSS v4",
  description: "Theme variables for Tailwind v4 (@theme inline).",
  generate(system: DesignSystem) {
    const light = varsBlock(system, ":root", "light", (h) => h.toLowerCase());
    const dark = varsBlock(system, ".dark", "dark", (h) => h.toLowerCase());

    const themeLines: string[] = [];
    for (const group of TOKEN_GROUPS) {
      for (const id of group.tokens) {
        themeLines.push(`  --color-${id}: var(--${id});`);
      }
    }
    for (const step of system.primitives.colors.scale) {
      themeLines.push(`  --color-brand-${step.step}: ${step.hex};`);
    }

    // Typography — native v4 `--text-*` namespace with line-height pairs.
    const { typography, radius, shadows } = system.primitives;
    themeLines.push(`  --font-heading: ${typography.fontFamily.heading};`);
    themeLines.push(`  --font-sans: ${typography.fontFamily.sans};`);
    themeLines.push(`  --font-mono: ${typography.fontFamily.mono};`);
    for (const [name, step] of Object.entries(typography.fontSize)) {
      themeLines.push(`  --text-${name}: ${step.size};`);
      themeLines.push(`  --text-${name}--line-height: ${step.lineHeight};`);
    }
    // Radius & shadows use their native v4 namespaces.
    for (const [name, value] of Object.entries(radius)) {
      themeLines.push(`  --radius-${name}: ${value};`);
    }
    for (const [name, value] of Object.entries(shadows)) {
      themeLines.push(`  --shadow-${name}: ${value};`);
    }
    // Spacing intentionally left at the Tailwind v4 default multiplier so
    // all built-in padding/margin/gap utilities keep working.

    const code = `@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

${light}

${dark}

@theme inline {
${themeLines.join("\n")}
}

:root {
  --radius: var(--radius-md);
}
`;

    return { code, language: "css", suggestedFilename: "tailwind-theme.css" };
  },
};
