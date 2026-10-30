import { notFound } from "next/navigation";
import { themeBySlug } from "@/lib/palettes";
import { fetchCommunityEntries } from "@/lib/gallery-server";
import { siteUrl } from "@/lib/site-url";
import {
  CORE_SITEMAP_NAME,
  coreSitemapUrls,
  renderUrlset,
  themeChunkUrls,
  type SitemapUrl,
} from "@/lib/sitemap";

/**
 * Chunk sitemaps, derived on demand and cached for a day. `core.xml` is the
 * only one the index advertises; the per-theme minted chunks still answer so
 * a URL a crawler already holds keeps resolving (and keeps showing those
 * pages' `noindex`). A 20,000-URL chunk renders in well under a second — the
 * same deterministic mint that serves the pages lists them.
 */
export const revalidate = 86400;

interface Props {
  params: Promise<{ name: string }>;
}

export async function GET(_request: Request, { params }: Props): Promise<Response> {
  const { name } = await params;

  if (name === `${CORE_SITEMAP_NAME}.xml`) {
    return xml(renderUrlset([...coreSitemapUrls(), ...(await communitySitemapUrls())]));
  }

  const match = /^palettes-(.+)\.xml$/.exec(name);
  const theme = match ? themeBySlug(match[1]) : undefined;
  if (!theme) notFound();

  const urls = themeChunkUrls(theme.slug).map((url) => ({ url }));
  return xml(renderUrlset(urls));
}

function xml(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

/**
 * Indexable community palette pages, newest 500 considered, gate-qualified
 * and curated best-first — the same loader as the gallery grid and the entry
 * pages, so a listed URL always renders and the order always agrees.
 */
async function communitySitemapUrls(): Promise<SitemapUrl[]> {
  const entries = await fetchCommunityEntries(500);
  return entries.map((entry) => ({
    url: `${siteUrl}/gallery/${entry.id}`,
    lastModified: new Date(entry.updatedAt),
  }));
}
