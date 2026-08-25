import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { DesignTokenTool } from "@/components/tools/export-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/design-token-generator");

const TOOL = findTool("/tools/design-token-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter your brand color.",
        "The generator produces DTCG-style JSON with a primitive brand scale, palette roles and full semantic token sets for light and dark themes.",
        "Copy the JSON into your token pipeline or design tools that support the format.",
      ]}
    >
      <DesignTokenTool />
    </ToolShell>
  );
}
