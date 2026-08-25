import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { CssShadowGenerator } from "@/components/tools/css-shadow-generator";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/css-shadow-generator");

const TOOL = findTool("/tools/css-shadow-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Choose box-shadow or text-shadow.",
        "Adjust offset, blur, spread and color with the sliders.",
        "Copy the generated CSS and paste it into your stylesheet.",
      ]}
    >
      <CssShadowGenerator />
    </ToolShell>
  );
}
