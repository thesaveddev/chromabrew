import { renderSitemapIndex, sitemapChunkNames } from "@/lib/sitemap";

/**
 * `/sitemap.xml` is an index, not a listing: one `core.xml` plus one chunk
 * per palette theme (20,000 minted URLs each). Chunks are derived on demand
 * by `/sitemaps/[name]`, so this document only enumerates their names.
 */
export const revalidate = 86400;

export function GET(): Response {
  return new Response(renderSitemapIndex(sitemapChunkNames()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
