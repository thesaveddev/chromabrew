import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { AlphaChannelTool } from "@/components/tools/alpha-channel-tool";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/alpha-channel");

const TOOL = findTool("/tools/alpha-channel")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Pick a color and adjust the opacity slider.",
        "Use quick presets for common opacity values.",
        "Copy the HEX8 or RGBA value.",
      ]}
    >
      <AlphaChannelTool />
    </ToolShell>
  );
}
