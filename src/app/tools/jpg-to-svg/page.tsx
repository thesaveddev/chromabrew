import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { JpgToSvgConverter } from "@/components/tools/jpg-to-svg";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/jpg-to-svg");

const TOOL = findTool("/tools/jpg-to-svg")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Upload one or more JPG, PNG or raster images.",
        "Adjust the color count to balance quality and file size.",
        "Convert them all at once and download each SVG or all as a .zip.",
      ]}
    >
      <JpgToSvgConverter />
    </ToolShell>
  );
}
