import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { SvgToJpgConverter } from "@/components/tools/svg-to-jpg";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/svg-to-jpg");

const TOOL = findTool("/tools/svg-to-jpg")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Upload one or more SVG files — or paste SVG code to add it to the batch.",
        "Choose a scale (1x–4x) applied to every file.",
        "Convert them all at once and download each JPG or all as a .zip.",
      ]}
    >
      <SvgToJpgConverter />
    </ToolShell>
  );
}
