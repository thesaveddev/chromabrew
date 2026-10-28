/**
 * Sitemap builders for a million palette pages.
 *
 * One flat sitemap cannot hold a million URLs (50,000 per file, and a build
 * that inlines them all would never finish), so the sitemap is an index:
 * `/sitemap.xml` lists one `core.xml` plus one chunk per theme, each chunk
 * holding that theme's 20,000 minted palette URLs. Chunks are derived, never
 * stored — the same deterministic engine that renders the pages lists them,
 * so the sitemap and the site can never disagree about what exists.
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

/** Chunk names: `core` plus one `palettes-<theme>` per theme. */
export function sitemapChunkNames(): string[] {
  return [CORE_SITEMAP_NAME, ...PALETTE_THEMES.map((theme) => `palettes-${theme.slug}`)];
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
