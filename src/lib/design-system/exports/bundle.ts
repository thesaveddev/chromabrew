import type { DesignSystem, ThemeMode } from "../types";
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
import {
  exportDate,
  exportSlug,
  exportTitle,
  exportVersion,
  preparedForLine,
  type ExportContext,
} from "./context";

/**
 * Bundles the most widely used formats into a single .zip so a design
 * system can be handed straight to a developer, a design tool, or a client.
 *
 * With a packaging context the bundle reads as a client deliverable: every
 * file is named for the project, every file header carries the project name,
 * version and "prepared for" line, and a README.md presents the whole thing.
 * Without one it emits exactly what it always has, so existing downloads
 * never change shape.
 */
export const bundleAdapter: ExportAdapter = {
  id: "zip",
  name: "Bundle (.zip)",
  description:
    "All key formats in one download — CSS, JSON, Tailwind, shadcn/ui, MUI, Figma, W3C and Penpot tokens.",
  generate(system: DesignSystem, ctx?: ExportContext) {
    const slug = exportSlug(ctx);
    const title = exportTitle(ctx, system.metadata.name);
    const version = exportVersion(ctx);
    const date = exportDate(ctx);
    const preparedFor = preparedForLine(ctx);
    const hasProject = Boolean(ctx?.projectName?.trim());

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
      const result = adapter.generate(system, ctx);
      const dir = groupDir(adapter.id);
      // The adapter already slug-prefixes its own filename when a project is
      // named; the directory carries the slug too so the archive reads as one
      // deliverable instead of eight loose files.
      const dirPrefix = hasProject ? `${slug}/` : "";
      return {
        path: `${dirPrefix}${dir}/${result.suggestedFilename}`,
        content: result.code,
      };
    });

    const readmePath = hasProject ? `${slug}/README.md` : "README.md";
    files.unshift({ path: readmePath, content: buildReadme(system, ctx, files) });

    return {
      code: bytesToBase64(createZip(files)),
      language: "json",
      suggestedFilename: hasProject
        ? `${slug}-design-system-${version}.zip`
        : "chromabrew-design-system.zip",
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

function modeSummary(
  system: DesignSystem,
  mode: ThemeMode,
): { passing: number; total: number } {
  const checks = system.accessibility.checks.filter((check) => check.mode === mode);
  const failing = system.accessibility.summary[mode]?.failing ?? 0;
  return { passing: Math.max(0, checks.length - failing), total: checks.length };
}

/**
 * The presentation layer of the deliverable: what the project is, who it is
 * for, which version this is, what is inside and how to use each piece. Kept
 * factual — counts and filenames are computed from the same files that ship
 * in the archive, so the document cannot describe a bundle it is not in.
 */
function buildReadme(
  system: DesignSystem,
  ctx: ExportContext | undefined,
  files: Array<{ path: string; content: string }>,
): string {
  const title = exportTitle(ctx, system.metadata.name);
  const version = exportVersion(ctx);
  const date = exportDate(ctx);
  const preparedFor = preparedForLine(ctx);
  const light = modeSummary(system, "light");
  const dark = modeSummary(system, "dark");
  const clientLine = ctx?.clientName?.trim() ? `Prepared for: ${ctx.clientName.trim()}\n` : "";

  const listed = files
    .filter((file) => file.path !== "README.md" && !file.path.endsWith("/README.md"))
    .map((file) => `| \`${file.path}\` | ${describeFile(file.path)} |`)
    .join("\n");

  return [
    `# ${title} — Design System ${version}`,
    ``,
    `${clientLine}Generated: ${date}`,
    `Source colour: \`${system.source.primary.hex}\``,
    `Strategy: ${system.configuration.paletteStrategy} · radius: ${system.configuration.radiusStyle} · type ratio: ${system.configuration.typeRatio}`,
    ``,
    `## Accessibility`,
    ``,
    `Key text pairings measured against WCAG 2.x at export time:`,
    ``,
    `- Light theme: ${light.passing}/${light.total} pairings pass`,
    `- Dark theme: ${dark.passing}/${dark.total} pairings pass`,
    ``,
    `Re-check after overriding tokens — these numbers describe the values in this bundle.`,
    ``,
    `## Contents`,
    ``,
    `| File | Use it for |`,
    `| ---- | ---------- |`,
    listed,
    ``,
    `## Using the tokens`,
    ``,
    `- **Web (CSS / Tailwind / shadcn/ui):** drop the file into the project stylesheet. The \`.dark\` block (or Tailwind's \`dark:\` variant) switches themes.`,
    `- **Tokens pipeline (JSON / W3C DTCG):** feed the JSON into Style Dictionary or Tokens Studio; the structure follows the DTCG format.`,
    `- **Figma:** paste the Figma JSON into the Tokens Studio plugin (import from JSON).`,
    `- **Penpot:** import the Penpot JSON via Design Tokens > Import.`,
    `- **Material UI:** import \`theme\` from the MUI file and pass it to \`<ThemeProvider>\`.`,
    ``,
    `---`,
    ``,
    `Generated with ChromaBrew.`,
    ``,
  ].join("\n");
}

function describeFile(path: string): string {
  if (path.endsWith(".css") && path.includes("tailwind")) return "Tailwind CSS v4 theme (`@theme inline`)";
  if (path.endsWith("shadcn-theme.css")) return "shadcn/ui theme variables";
  if (path.endsWith(".css")) return "Plain CSS custom properties + `.dark` block";
  if (path.includes("figma")) return "Figma Tokens Studio import";
  if (path.includes("w3c")) return "W3C DTCG interchange (Style Dictionary, Tokens Studio)";
  if (path.includes("penpot")) return "Penpot Design Tokens import";
  if (path.includes("mui")) return "MUI v5+ `createTheme`";
  return "Structured design tokens (DTCG-style JSON)";
}
