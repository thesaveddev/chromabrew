import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ShadcnThemeTool } from "@/components/tools/export-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/shadcn-theme-generator");

const TOOL = findTool("/tools/shadcn-theme-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter your brand color.",
        "A complete shadcn/ui theme is generated in the current oklch convention â€” light and dark blocks, chart and sidebar variables included.",
        "Paste it into your global stylesheet in a Tailwind v4 + shadcn/ui project.",
      ]}
    >
      <ShadcnThemeTool />
    </ToolShell>
  );
}
