/**
 * Sitemap builders — the curated site only.
 *
 * One flat sitemap cannot hold a million URLs (50,000 per file, and a build
 * that inlines them all would never finish), so the sitemap is an index of
 * chunk documents. The index advertises `core.xml` alone: hubs, the curated
 * palettes, colors, brands, tools and dated posts. The minted palette chunks
 * are derived, never stored, and never listed — a sitemap entry is a claim
 * that a URL is worth a crawl, and a template-assembled tail is not. Those
 * pages still render (and answer `noindex`) for anything already holding a
 * link, so the index can shrink without the routes disappearing.
 */

import { TOOLS } from "./tools";
import { livePosts } from "./posts";
import { PALETTE_THEMES, GALLERY_PALETTES } from "./palettes";
import { MINTED_PER_THEME, mintedSlug } from "./palette-mint";
import { NAMED_COLORS } from "./colors";
import { BRAND_PALETTES } from "./brand-palettes";
import { brandSlug } from "./brand-pages";
import { siteUrl } from "./site-url";

export interface SitemapUrl {
  url: string;
  lastModified?: Date;
}

export const CORE_SITEMAP_NAME = "core";

/**
 * Chunk names the index advertises: `core`, and nothing programmatic.
 * The `palettes-<theme>` chunks still resolve under `/sitemaps/[name]` so a
 * stale chunk URL keeps working — it just has no way in from here.
 */
export function sitemapChunkNames(): string[] {
  return [CORE_SITEMAP_NAME];
}

/** Absolute URL of a chunk sitemap. */
export function chunkUrl(name: string): string {
  return `${siteUrl}/sitemaps/${name}.xml`;
}

/**
 * Everything except minted detail pages: hubs, themes, the curated catalog,
 * colors, brands, tools, and dated posts. Small and stable — the list only
 * changes when content does.
 */
export function coreSitemapUrls(): SitemapUrl[] {
  const hubs: { path: string; priority?: never }[] = [
    { path: "/" },
    { path: "/design-system" },
    { path: "/figma" },
    { path: "/generate" },
    { path: "/tools" },
    { path: "/audit" },
    { path: "/color-tools" },
    { path: "/blog" },
    { path: "/pricing" },
    { path: "/about" },
    { path: "/contact" },
    { path: "/privacy" },
    { path: "/terms" },
    { path: "/palettes" },
  ];
  return [
    ...hubs.map(({ path }) => ({ url: path === "/" ? siteUrl : `${siteUrl}${path}` })),
    ...PALETTE_THEMES.map((theme) => ({ url: `${siteUrl}/palettes/${theme.slug}` })),
    ...GALLERY_PALETTES.map((palette) => ({
      url: `${siteUrl}/palettes/${palette.theme}/${palette.slug}`,
    })),
    { url: `${siteUrl}/colors` },
    ...NAMED_COLORS.map((color) => ({ url: `${siteUrl}/colors/${color.slug}` })),
    { url: `${siteUrl}/brands` },
    ...BRAND_PALETTES.map((brand) => ({ url: `${siteUrl}/brands/${brandSlug(brand.name)}` })),
    ...TOOLS.map((tool) => ({ url: `${siteUrl}${tool.href}` })),
    ...livePosts().map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(`${post.updatedAt ?? post.publishedAt}T00:00:00Z`),
    })),
  ];
}

/** All minted palette URLs for one theme, in index order. */
export function themeChunkUrls(themeSlug: string): string[] {
  const urls: string[] = new Array(MINTED_PER_THEME);
  for (let index = 0; index < MINTED_PER_THEME; index++) {
    urls[index] = `${siteUrl}/palettes/${themeSlug}/${mintedSlug(themeSlug, index)}`;
  }
  return urls;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A `<urlset>` document for one chunk. No changefreq: crawlers ignore it. */
export function renderUrlset(urls: readonly SitemapUrl[]): string {
  const entries = urls
    .map(({ url, lastModified }) =>
      lastModified
        ? `<url><loc>${escapeXml(url)}</loc><lastmod>${lastModified.toISOString()}</lastmod></url>`
        : `<url><loc>${escapeXml(url)}</loc></url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

/** The `/sitemap.xml` index: one entry per chunk sitemap. */
export function renderSitemapIndex(names: readonly string[]): string {
  const entries = names
    .map((name) => `<sitemap><loc>${escapeXml(chunkUrl(name))}</loc></sitemap>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}
