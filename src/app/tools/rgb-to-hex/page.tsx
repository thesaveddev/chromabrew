import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ConverterTool } from "@/components/tools/contrast-and-convert-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/rgb-to-hex");

const TOOL = findTool("/tools/rgb-to-hex")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Paste an RGB value such as rgb(71, 0, 58).",
        "The six-digit HEX equivalent updates live as you type.",
        "Copy the clean hex code with one click.",
      ]}
    >
      <ConverterTool mode="rgb-to-hex" />
    </ToolShell>
  );
}
