import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ColorMixer } from "@/components/tools/color-mixer";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/color-mixer");

const TOOL = findTool("/tools/color-mixer")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Pick or paste two colors.",
        "Drag the slider to blend at any ratio.",
        "Copy the HEX, RGB or HSL value.",
      ]}
    >
      <ColorMixer />
    </ToolShell>
  );
}
