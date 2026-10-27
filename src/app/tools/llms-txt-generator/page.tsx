import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { LlmsTxtTool } from "@/components/tools/llms-txt-tool";
import { toolMetadata } from "@/components/tools/tool-metadata";

export const metadata: Metadata = toolMetadata("/tools/llms-txt-generator");

const TOOL = findTool("/tools/llms-txt-generator")!;

export default function Page() {
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter your site name, homepage and a one-line description of what it does.",
        "List up to five key pages you want AI answers to cite, and choose which crawlers may read the site.",
        "Copy or download llms.txt and ai.txt, upload both to your site root, and re-run the website audit to confirm they are reachable.",
      ]}
    >
      <LlmsTxtTool />
    </ToolShell>
  );
}
