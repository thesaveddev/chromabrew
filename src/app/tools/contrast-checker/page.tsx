import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { ContrastTool } from "@/components/tools/contrast-and-convert-tools";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/contrast-checker");

const TOOL = findTool("/tools/contrast-checker")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Set the text color and the background color behind it.",
        "Read the measured WCAG 2.x contrast ratio and pass/fail results for AA and AAA at normal and large text sizes.",
        "If a pair fails, use â€œFix contrastâ€ to get the nearest accessible text color that preserves the hue.",
      ]}
    >
      <ContrastTool />
    </ToolShell>
  );
}
