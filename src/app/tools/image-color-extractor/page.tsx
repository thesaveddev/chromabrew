import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ImageColorExtractor } from "@/components/tools/image-color-extractor";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/image-color-extractor");

const TOOL = findTool("/tools/image-color-extractor")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Drag-and-drop an image or click the upload area to select a file.",
        "The tool reads every pixel in your browser and clusters them into dominant colors.",
        "Copy any swatch as HEX, or grab the full set as CSS custom properties.",
      ]}
    >
      <ImageColorExtractor />
    </ToolShell>
  );
}
