import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://colorsmith.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1 },
    { path: "/design-system", priority: 0.9 },
    { path: "/tools", priority: 0.8 },
    ...TOOLS.map((tool) => ({ path: tool.href, priority: 0.7 })),
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route.priority,
  }));
}
