import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { AiPaletteTool } from "@/components/tools/ai-palette-tool";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/ai-palette-suggestion");

const TOOL = findTool("/tools/ai-palette-suggestion")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Describe your brand in plain words — industry, mood, audience, anything that matters.",
        "Pick from 5 suggested palettes, each pairing a starting color with a harmony strategy.",
        "Open any suggestion in the design system generator to preview it on real interfaces and export tokens, themes and CSS.",
      ]}
    >
      <AiPaletteTool />
    </ToolShell>
  );
}
