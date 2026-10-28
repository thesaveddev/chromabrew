import { describe, expect, it } from "vitest";
import {
  CORE_SITEMAP_NAME,
  chunkUrl,
  coreSitemapUrls,
  renderSitemapIndex,
  renderUrlset,
  sitemapChunkNames,
  themeChunkUrls,
} from "@/lib/sitemap";
import { TOOLS } from "@/lib/tools";
import { livePosts } from "@/lib/posts";
import { PALETTE_THEMES, GALLERY_PALETTES, MINTED_PER_THEME } from "@/lib/palettes";
import { parseMintedSlug } from "@/lib/palette-mint";
import { siteUrl } from "@/lib/site-url";

/**
 * The sitemap as an index plus derived chunks.
 *
 * A million palette URLs cannot live in one document (50,000 per file, and a
 * build that inlines them would never finish), so `/sitemap.xml` only lists
 * chunk names while `/sitemaps/[name]` derives each chunk from the same mint
 * that renders the pages. These tests pin the shape that keeps the sitemap
 * and the site from disagreeing: chunk inventory, URL counts, and the
 * round-trip that every listed palette URL actually resolves.
 */
describe("sitemap index", () => {
  it("lists the core chunk plus one chunk per theme", () => {
    const names = sitemapChunkNames();
    expect(names).toHaveLength(1 + PALETTE_THEMES.length);
    expect(names[0]).toBe(CORE_SITEMAP_NAME);
    expect(new Set(names).size).toBe(names.length);
    for (const theme of PALETTE_THEMES) {
      expect(names).toContain(`palettes-${theme.slug}`);
    }
  });

  it("renders a well-formed index pointing at the chunk routes", () => {
    const xml = renderSitemapIndex(sitemapChunkNames());
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(`<loc>${siteUrl}/sitemaps/core.xml</loc>`);
    expect(xml).toContain(`<loc>${siteUrl}/sitemaps/palettes-retro.xml</loc>`);
    expect(xml.match(/<sitemap>/g)).toHaveLength(1 + PALETTE_THEMES.length);
  });

  it("keeps every chunk URL on the canonical origin", () => {
    for (const name of sitemapChunkNames()) {
      expect(chunkUrl(name).startsWith(siteUrl)).toBe(true);
      expect(chunkUrl(name).slice(siteUrl.length)).not.toContain("//");
    }
  });
});

describe("core chunk", () => {
  it("lists every indexable non-minted route exactly once", () => {
    const entries = coreSitemapUrls();
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain(siteUrl);
    expect(urls).not.toContain(`${siteUrl}/`);
    expect(urls).toContain(`${siteUrl}/palettes`);
    for (const theme of PALETTE_THEMES) {
      expect(urls).toContain(`${siteUrl}/palettes/${theme.slug}`);
    }
    for (const palette of GALLERY_PALETTES) {
      expect(urls).toContain(`${siteUrl}/palettes/${palette.theme}/${palette.slug}`);
    }
    for (const tool of TOOLS) {
      expect(urls).toContain(`${siteUrl}${tool.href}`);
    }
  });

  it("stamps a real modification date on posts and nothing else", () => {
    const byUrl = new Map(coreSitemapUrls().map((entry) => [entry.url, entry]));
    for (const post of livePosts()) {
      const expected = new Date(`${post.updatedAt ?? post.publishedAt}T00:00:00Z`);
      expect(byUrl.get(`${siteUrl}/blog/${post.slug}`)?.lastModified).toEqual(expected);
    }
    expect(byUrl.get(`${siteUrl}/palettes/retro`)?.lastModified).toBeUndefined();
  });

  it("is deterministic", () => {
    expect(coreSitemapUrls()).toEqual(coreSitemapUrls());
  });
});

describe("theme chunks", () => {
  it("lists exactly the addressable minted URLs for a theme", () => {
    const urls = themeChunkUrls("retro");
    expect(urls).toHaveLength(MINTED_PER_THEME);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls.slice(0, 50)) {
      expect(url.startsWith(`${siteUrl}/palettes/retro/`)).toBe(true);
    }
  });

  it("lists URLs that resolve back through the mint", () => {
    for (const url of themeChunkUrls("ocean").slice(0, 25)) {
      const slug = url.split("/").pop()!;
      expect(parseMintedSlug("ocean", slug)).not.toBeNull();
    }
  });
});

describe("urlset rendering", () => {
  it("renders entries with dates only where they exist", () => {
    const xml = renderUrlset([
      { url: `${siteUrl}/tools` },
      { url: `${siteUrl}/blog/hi`, lastModified: new Date("2026-01-02T00:00:00Z") },
    ]);
    expect(xml).toContain("<urlset");
    expect(xml).toContain(`<loc>${siteUrl}/tools</loc>`);
    expect(xml).toContain("<lastmod>2026-01-02T00:00:00.000Z</lastmod>");
    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
    expect(xml).not.toContain("changefreq");
  });
});
