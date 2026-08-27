import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { toolMetadata } from "@/components/tools/tool-metadata";
import { TypographyScaleGenerator } from "@/components/tools/typography-scale-generator";

export const metadata: Metadata = toolMetadata("/tools/typography-scale-generator");

const TOOL = findTool("/tools/typography-scale-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Set your base body size in pixels (16px is the common default).",
        "Choose a scale ratio — 1.25 (normal) is a good starting point; go steeper for landing pages, gentler for dense apps.",
        "Pick a font pairing, preview it live, then copy the CSS variables (rem-based) straight into your stylesheet.",
      ]}
    >
      <TypographyScaleGenerator />
    </ToolShell>
  );
}
