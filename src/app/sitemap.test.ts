import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { TOOLS } from "@/lib/tools";
import { livePosts } from "@/lib/posts";
import { PALETTE_THEMES, GALLERY_PALETTES } from "@/lib/palettes";
import { NAMED_COLORS } from "@/lib/colors";
import { BRAND_PALETTES } from "@/lib/brand-palettes";
import { brandSlug } from "@/lib/brand-pages";
import { siteUrl } from "@/lib/site-url";

/** The hand-listed hub routes, which carry no honest modification date. */
const HUBS = ["/", "/design-system", "/generate", "/tools", "/audit", "/color-tools", "/blog", "/pricing", "/about", "/contact", "/privacy", "/terms"];

describe("sitemap", () => {
  const entries = sitemap();
  const byUrl = new Map(entries.map((entry) => [entry.url, entry]));

  it("lists every indexable route exactly once", () => {
    const expected =
      HUBS.length +
      TOOLS.length +
      livePosts().length +
      1 +
      PALETTE_THEMES.length +
      GALLERY_PALETTES.length +
      1 +
      NAMED_COLORS.length +
      1 +
      BRAND_PALETTES.length;
    expect(entries).toHaveLength(expected);

    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(entries).toHaveLength(byUrl.size);
  });

  it("spells the home URL the way the canonical does", () => {
    // The root layout canonicalises "/" to the origin without a trailing slash,
    // so a second spelling here would publish two URLs for one page.
    expect(byUrl.has(siteUrl)).toBe(true);
    expect(byUrl.has(`${siteUrl}/`)).toBe(false);
    expect(byUrl.get(siteUrl)?.url).toBe(siteUrl);
  });

  it("stamps a real modification date on posts and nothing else", () => {
    // A lastModified that moves on every deploy without the content changing is
    // the pattern search engines learn to distrust, so only content with a real
    // date publishes one.
    for (const post of livePosts()) {
      const entry = byUrl.get(`${siteUrl}/blog/${post.slug}`);
      expect(entry, `missing sitemap entry for ${post.slug}`).toBeDefined();
      const expected = new Date(`${post.updatedAt ?? post.publishedAt}T00:00:00Z`);
      expect(entry!.lastModified).toEqual(expected);
    }

    for (const tool of TOOLS) {
      const entry = byUrl.get(`${siteUrl}${tool.href}`);
      expect(entry, `missing sitemap entry for ${tool.href}`).toBeDefined();
      expect("lastModified" in entry!).toBe(false);
    }

    for (const theme of PALETTE_THEMES) {
      const entry = byUrl.get(`${siteUrl}/palettes/${theme.slug}`);
      expect(entry, `missing sitemap entry for theme ${theme.slug}`).toBeDefined();
      expect("lastModified" in entry!).toBe(false);
    }

    for (const palette of GALLERY_PALETTES) {
      const entry = byUrl.get(`${siteUrl}/palettes/${palette.theme}/${palette.slug}`);
      expect(entry, `missing sitemap entry for palette ${palette.slug}`).toBeDefined();
      expect("lastModified" in entry!).toBe(false);
    }

    for (const color of NAMED_COLORS) {
      const entry = byUrl.get(`${siteUrl}/colors/${color.slug}`);
      expect(entry, `missing sitemap entry for color ${color.slug}`).toBeDefined();
      expect("lastModified" in entry!).toBe(false);
    }

    for (const brand of BRAND_PALETTES) {
      const entry = byUrl.get(`${siteUrl}/brands/${brandSlug(brand.name)}`);
      expect(entry, `missing sitemap entry for brand ${brand.name}`).toBeDefined();
      expect("lastModified" in entry!).toBe(false);
    }

    for (const hub of HUBS) {
      const entry = byUrl.get(hub === "/" ? siteUrl : `${siteUrl}${hub}`);
      expect(entry, `missing sitemap entry for ${hub}`).toBeDefined();
      expect("lastModified" in entry!).toBe(false);
    }
  });

  it("does not claim a change frequency, which crawlers ignore", () => {
    for (const entry of entries) {
      expect("changeFrequency" in entry).toBe(false);
    }
  });

  it("keeps every URL on the canonical origin with one spelling per path", () => {
    for (const entry of entries) {
      expect(entry.url.startsWith(siteUrl)).toBe(true);
      // Everything after the origin, which must never contain a double slash.
      expect(entry.url.slice(siteUrl.length)).not.toContain("//");
    }
    // No path carries a trailing slash: the home entry reduces to the origin
    // itself, so every other path is a bare "/segment" form.
    const paths = entries.map((entry) => entry.url.slice(siteUrl.length));
    expect(paths.filter((path) => path.endsWith("/"))).toEqual([]);
    expect(paths[0]).toBe("");
  });

  it("is deterministic — two calls produce the same document", () => {
    // No module-scope `new Date()`: the output depends on content dates only.
    expect(sitemap()).toEqual(sitemap());
  });
});
