import { renderSitemapIndex, sitemapChunkNames } from "@/lib/sitemap";

/**
 * `/sitemap.xml` is an index, not a listing: it names the curated `core`
 * document — hubs, curated palettes, colors, brands, tools and posts. The
 * minted palette chunks are deliberately absent, because their pages carry
 * `noindex` and a sitemap entry would invite a crawl of a million
 * template-assembled pages. Chunks are still derived on demand by
 * `/sitemaps/[name]`, so nothing already holding a chunk URL breaks.
 */
export const revalidate = 86400;

export function GET(): Response {
  return new Response(renderSitemapIndex(sitemapChunkNames()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
