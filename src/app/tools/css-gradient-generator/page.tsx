import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { CssGradientGenerator } from "@/components/tools/css-gradient-generator";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/css-gradient-generator");

const TOOL = findTool("/tools/css-gradient-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Pick a gradient type: linear, radial or conic.",
        "Click the gradient bar to add color stops, then drag or adjust each one.",
        "Copy the generated CSS and paste it into your stylesheet.",
      ]}
    >
      <CssGradientGenerator />
    </ToolShell>
  );
}
