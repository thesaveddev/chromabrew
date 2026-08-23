import type { Metadata } from "next";
import { findTool } from "@/lib/tools";

/** Build unique page metadata from the tool registry. */
export function toolMetadata(href: string): Metadata {
  const tool = findTool(href);
  if (!tool) throw new Error(`Unknown tool route: ${href}`);
  return {
    title: tool.metaTitle,
    description: tool.description,
    alternates: { canonical: tool.href },
    openGraph: {
      title: `${tool.metaTitle} · ChromaBrew`,
      description: tool.description,
      url: tool.href,
      type: "website",
    },
  };
}
