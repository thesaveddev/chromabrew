import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { WcagPaletteChecker } from "@/components/tools/wcag-palette-checker";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/wcag-palette-checker");

const TOOL = findTool("/tools/wcag-palette-checker")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Add your palette colors with names and hex values.",
        "Check the contrast matrix for failing pairs.",
        "Adjust colors until all pairs pass WCAG AA.",
      ]}
    >
      <WcagPaletteChecker />
    </ToolShell>
  );
}
