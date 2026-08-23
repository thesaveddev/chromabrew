import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { DarkModeTool } from "@/components/tools/export-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/dark-mode-generator");

const TOOL = findTool("/tools/dark-mode-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter your brand colour.",
        "The tool constructs a semantic dark theme â€” lighter primaries, tinted neutrals and status colours with verified contrast.",
        "Copy the .dark CSS block, or open the generator to preview the theme on real interfaces.",
      ]}
    >
      <DarkModeTool />
    </ToolShell>
  );
}
