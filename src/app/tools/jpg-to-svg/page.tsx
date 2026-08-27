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
        "Upload a JPG, PNG or any raster image.",
        "Adjust the color count to balance quality and file size.",
        "Download the resulting SVG.",
      ]}
    >
      <JpgToSvgConverter />
    </ToolShell>
  );
}
