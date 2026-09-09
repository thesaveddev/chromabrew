import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ColourConverter } from "@/components/tools/contrast-and-convert-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/color-converter");

const TOOL = findTool("/tools/color-converter")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Paste any color — HEX, rgb() or hsl() — or pick one from the swatch.",
        "All four formats (HEX, RGB, HSL, OKLCH) update live with one-click copy for each.",
        "Use the button to seed the full design system generator with the same color.",
      ]}
    >
      <ColourConverter />
    </ToolShell>
  );
}