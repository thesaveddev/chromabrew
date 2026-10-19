import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { livePosts } from "@/lib/posts";
import { PALETTE_THEMES, GALLERY_PALETTES } from "@/lib/palettes";
import { NAMED_COLORS } from "@/lib/colors";
import { BRAND_PALETTES } from "@/lib/brand-palettes";
import { brandSlug } from "@/lib/brand-pages";
import { siteUrl } from "@/lib/site-url";

/**
 * Only content with a real modification date carries a `lastModified`.
 *
 * Stamping every URL with the build time was worse than omitting it: a date
 * that moves on each deploy without the content changing is the pattern Google
 * learns to distrust, and it threw away the one signal that genuinely helps —
 * when an article actually changed. `changeFrequency` is omitted because Google
 * states it is ignored.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; lastModified?: Date }[] = [
    { path: "/", priority: 1 },
    { path: "/design-system", priority: 0.9 },
    { path: "/tools", priority: 0.8 },
    { path: "/audit", priority: 0.8 },
    { path: "/color-tools", priority: 0.6 },
    { path: "/blog", priority: 0.8 },
    { path: "/pricing", priority: 0.5 },
    { path: "/about", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
    { path: "/palettes", priority: 0.8 },
    ...PALETTE_THEMES.map((theme) => ({ path: `/palettes/${theme.slug}`, priority: 0.6 })),
    ...GALLERY_PALETTES.map((palette) => ({
      path: `/palettes/${palette.theme}/${palette.slug}`,
      priority: 0.6,
    })),
    { path: "/colors", priority: 0.8 },
    ...NAMED_COLORS.map((color) => ({ path: `/colors/${color.slug}`, priority: 0.6 })),
    { path: "/brands", priority: 0.8 },
    ...BRAND_PALETTES.map((brand) => ({
      path: `/brands/${brandSlug(brand.name)}`,
      priority: 0.5,
    })),
    ...TOOLS.map((tool) => ({ path: tool.href, priority: 0.7 })),
    ...livePosts().map((post) => ({
      path: `/blog/${post.slug}`,
      priority: 0.6,
      lastModified: new Date(`${post.updatedAt ?? post.publishedAt}T00:00:00Z`),
    })),
  ];
  return routes.map(({ path, priority, lastModified }) => ({
    // The home page canonicalises without a trailing slash, so the sitemap
    // lists it the same way instead of publishing a second spelling of it.
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
    ...(lastModified ? { lastModified } : {}),
    priority,
  }));
}
