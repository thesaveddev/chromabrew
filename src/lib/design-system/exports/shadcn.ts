import type { DesignSystem } from "../types";
import type { ExportAdapter } from "./adapter";
import { toOklchString } from "./css";

/** shadcn variable name → our semantic token id. */
const SHADCN_MAP: Array<[string, string]> = [
  ["background", "background"],
  ["foreground", "foreground"],
  ["card", "surface"],
  ["card-foreground", "foreground"],
  ["popover", "surface-raised"],
  ["popover-foreground", "foreground"],
  ["primary", "primary"],
  ["primary-foreground", "primary-foreground"],
  ["secondary", "secondary"],
  ["secondary-foreground", "secondary-foreground"],
  ["muted", "surface-muted"],
  ["muted-foreground", "foreground-muted"],
  ["accent", "accent"],
  ["accent-foreground", "accent-foreground"],
  ["destructive", "danger"],
  ["border", "border"],
  ["input", "input-border"],
  ["ring", "focus-ring"],
  ["sidebar", "background-subtle"],
  ["sidebar-foreground", "foreground"],
  ["sidebar-primary", "primary"],
  ["sidebar-primary-foreground", "primary-foreground"],
  ["sidebar-accent", "surface-muted"],
  ["sidebar-accent-foreground", "foreground"],
  ["sidebar-border", "border-muted"],
  ["sidebar-ring", "focus-ring"],
];

/**
 * shadcn/ui theme output following current conventions: oklch values in
 * `:root` / `.dark`, including chart and sidebar variables.
 */
export const shadcnAdapter: ExportAdapter = {
  id: "shadcn",
  name: "shadcn/ui",
  description: "CSS variables following current shadcn/ui theming conventions.",
  generate(system: DesignSystem) {
    const blockFor = (mode: "light" | "dark"): string => {
      const selector = mode === "light" ? ":root" : ".dark";
      const tokens = system.themes[mode];
      const lines = [`${selector} {`];
      for (const [shadcnName, tokenId] of SHADCN_MAP) {
        const hex = tokens[tokenId as keyof typeof tokens];
        if (!hex) continue;
        lines.push(`  --${shadcnName}: ${toOklchString(hex)};`);
      }
      // Chart colours come from the palette when available so they are
      // actually distinguishable.
      const chartSource =
        system.primitives.colors.palette.length >= 5
          ? system.primitives.colors.palette.slice(0, 5)
          : system.primitives.colors.scale
              .filter((s) => [300, 500, 600, 700, 900].includes(s.step))
              .map((s) => ({ hex: s.hex }));
      chartSource.slice(0, 5).forEach((swatch, i) => {
        lines.push(`  --chart-${i + 1}: ${toOklchString(swatch.hex)};`);
      });
      lines.push("  --radius: 0.625rem;");
      lines.push("}");
      return lines.join("\n");
    };

    const header = `/*\n  ${system.metadata.name} — shadcn/ui theme\n  Source: ${system.source.primary.hex}\n  Paste into your global stylesheet (Tailwind v4 + shadcn/ui).\n*/\n`;

    return {
      code: `${header}${blockFor("light")}\n\n${blockFor("dark")}\n`,
      language: "css",
      suggestedFilename: "shadcn-theme.css",
    };
  },
};
