import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { PaletteTool } from "@/components/tools/palette-tool";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/color-palette-generator");

const TOOL = findTool("/tools/color-palette-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter or pick your base colour â€” HEX, rgb() and hsl() input are all accepted.",
        "Choose a palette strategy such as complementary, triadic or analogous.",
        "Copy any swatch as HEX, or jump into the generator to turn the palette into a complete design system.",
      ]}
    >
      <PaletteTool />
    </ToolShell>
  );
}
