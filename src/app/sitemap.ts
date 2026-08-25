import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { siteUrl } from "@/lib/site-url";

// Evaluated once at build time — the sitemap is a static artifact, so this
// is the honest last-modified date for every route in that build.
const buildDate = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1 },
    { path: "/design-system", priority: 0.9 },
    { path: "/pricing", priority: 0.8 },
    { path: "/tools", priority: 0.8 },
    ...TOOLS.map((tool) => ({ path: tool.href, priority: 0.7 })),
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: buildDate,
    changeFrequency: "monthly",
    priority: route.priority,
  }));
}
