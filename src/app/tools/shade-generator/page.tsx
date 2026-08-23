import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ShadeTool } from "@/components/tools/shared-tool-ui";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/shade-generator");

const TOOL = findTool("/tools/shade-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter or pick your brand colour.",
        "The tool generates a perceptually even 50–950 scale in OKLCH, pinning your exact colour at its natural step.",
        "Copy individual values as HEX, or copy the whole scale into your design tokens.",
      ]}
    >
      <ShadeTool />
    </ToolShell>
  );
}
