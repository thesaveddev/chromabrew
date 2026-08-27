import { findPost, BLOG_POSTS } from "./posts";
import { TOOLS, type ToolDefinition } from "./tools";

export { findPost };

/** Same formatting as the client card, shared server-side. */
export function formatPostDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Resolve a post's relatedHrefs to full tool definitions (in a stable order). */
export function getRelatedTools(hrefs: string[]): ToolDefinition[] {
  const byHref = new Map(TOOLS.map((tool) => [tool.href, tool]));
  const seen = new Set<string>();
  const result: ToolDefinition[] = [];
  for (const href of hrefs) {
    const tool = byHref.get(href);
    if (tool && !seen.has(href)) {
      seen.add(href);
      result.push(tool);
    }
  }
  return result;
}

export function allPostSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}
