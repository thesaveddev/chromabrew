import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { TailwindColourTool } from "@/components/tools/export-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/tailwind-color-generator");

const TOOL = findTool("/tools/tailwind-color-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter your brand colour.",
        "A full 50â€“950 perceptual scale is generated and emitted as Tailwind CSS v4 @theme variables.",
        "Copy the snippet into your global stylesheet â€” bg-brand-500 style utilities become available immediately.",
      ]}
    >
      <TailwindColourTool />
    </ToolShell>
  );
}
