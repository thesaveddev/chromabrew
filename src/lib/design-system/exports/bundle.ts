import type { DesignSystem } from "../types";
import type { ExportAdapter } from "./adapter";
import { cssAdapter } from "./css";
import { jsonAdapter } from "./json";
import { tailwindAdapter } from "./tailwind";
import { shadcnAdapter } from "./shadcn";
import { muiAdapter } from "./mui";
import { figmaAdapter } from "./figma";
import { w3cAdapter } from "./w3c";
import { penpotAdapter } from "./penpot";
import { createZip, bytesToBase64 } from "@/lib/zip";

/**
 * Bundles the most widely used formats into a single .zip so a design
 * system can be handed straight to a developer or imported into a suite
 * of design tools at once.
 */
export const bundleAdapter: ExportAdapter = {
  id: "zip",
  name: "Bundle (.zip)",
  description:
    "All key formats in one download — CSS, JSON, Tailwind, shadcn/ui, MUI, Figma, W3C and Penpot tokens.",
  generate(system: DesignSystem) {
    const adapters = [
      cssAdapter,
      jsonAdapter,
      tailwindAdapter,
      shadcnAdapter,
      muiAdapter,
      figmaAdapter,
      w3cAdapter,
      penpotAdapter,
    ];

    const files = adapters.map((adapter) => {
      const result = adapter.generate(system);
      const dir = groupDir(adapter.id);
      return {
        path: `${dir}/${result.suggestedFilename}`,
        content: result.code,
      };
    });

    files.unshift({
      path: "README.txt",
      content: [
        "ChromaBrew design system export",
        `Generated from ${system.source.primary.hex}`,
        `Version ${system.metadata.generatorVersion}`,
        "",
        "Files:",
        ...files.slice(1).map((f) => `  - ${f.path}`),
        "",
        "Design tools:",
        "  - figma-tokens.json : Figma Tokens Studio",
        "  - design-tokens-w3c.json : W3C/DTCG (Tokens Studio, Style Dictionary)",
        "  - penpot-tokens.json : Penpot Design Tokens",
      ].join("\n"),
    });

    const zip = createZip(files);
    return {
      code: bytesToBase64(zip),
      language: "json",
      suggestedFilename: "chromabrew-design-system.zip",
      binary: true,
      mimeType: "application/zip",
    };
  },
};

function groupDir(id: string): string {
  const map: Record<string, string> = {
    css: "css",
    json: "json",
    tailwind: "tailwind",
    shadcn: "shadcn",
    mui: "mui",
    figma: "design-tools/figma",
    w3c: "design-tools/w3c-dtcg",
    penpot: "design-tools/penpot",
  };
  return map[id] ?? "other";
}
