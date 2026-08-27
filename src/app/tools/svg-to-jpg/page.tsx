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
        "Upload an SVG file or paste SVG code.",
        "Preview the image live.",
        "Choose a scale (1x–4x) and download the JPG.",
      ]}
    >
      <SvgToJpgConverter />
    </ToolShell>
  );
}
