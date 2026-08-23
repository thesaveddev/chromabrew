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

    const code = `@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

${light}

${dark}

@theme inline {
${themeLines.join("\n")}
}

:root {
  --radius: 0.625rem;
}
`;

    return { code, language: "css", suggestedFilename: "tailwind-theme.css" };
  },
};
