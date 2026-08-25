import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ConverterTool } from "@/components/tools/contrast-and-convert-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/hex-to-rgb");

const TOOL = findTool("/tools/hex-to-rgb")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Paste a HEX value such as #47003A or pick a color.",
        "The rgb() equivalent updates live as you type.",
        "Copy the result with one click â€” an OKLCH readout is included for modern CSS.",
      ]}
    >
      <ConverterTool mode="hex-to-rgb" />
    </ToolShell>
  );
}
