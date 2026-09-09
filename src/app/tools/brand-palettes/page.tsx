import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { BrandPalettes } from "@/components/tools/brand-palettes";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/brand-palettes");

const TOOL = findTool("/tools/brand-palettes")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Search or filter by sector to find a brand whose colour fits the project.",
        "Copy the HEX value with one click, or open it in the full design system generator as the primary seed.",
        "Generate the scale, palette, tokens and themes, then export CSS, JSON, Tailwind or shadcn.",
      ]}
    >
      <BrandPalettes />
    </ToolShell>
  );
}