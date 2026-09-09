import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ColourNames } from "@/components/tools/colour-names";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/color-names");

const TOOL = findTool("/tools/color-names")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Type or pick any colour in HEX, RGB or HSL and the tool finds the closest of the 148 CSS named colours, measured in OKLab.",
        "Copy the name straight into your CSS, or copy the hex and open it in the design system generator as the primary seed.",
        "Browse the full list, search by name, and click any swatch to see its closest-name card.",
      ]}
    >
      <ColourNames />
    </ToolShell>
  );
}