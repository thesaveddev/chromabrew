import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ConverterTool } from "@/components/tools/contrast-and-convert-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/hex-to-hsl");

const TOOL = findTool("/tools/hex-to-hsl")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Paste a HEX value or use the color picker.",
        "Read the hsl() equivalent, plus OKLCH for perceptual work in modern CSS.",
        "Copy either format instantly.",
      ]}
    >
      <ConverterTool mode="hex-to-hsl" />
    </ToolShell>
  );
}
