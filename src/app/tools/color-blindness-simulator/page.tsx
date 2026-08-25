import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ColorBlindnessSimulator } from "@/components/tools/color-blindness-simulator";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/color-blindness-simulator");

const TOOL = findTool("/tools/color-blindness-simulator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter or pick a color in HEX, rgb() or hsl() format.",
        "The tool instantly shows how that color appears under each type of color blindness.",
        "Use the results to choose palettes that work for everyone — not just people with full color vision.",
      ]}
    >
      <ColorBlindnessSimulator />
    </ToolShell>
  );
}
