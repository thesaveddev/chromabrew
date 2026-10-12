import type { Metadata } from "next";
import { GeneratorWorkspace } from "@/components/generator/generator-client";
import { DesignSystemContent } from "@/components/generator/design-system-content";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Design system generator",
  description:
    "Turn one color into an accessible design system: color scale, palette, semantic tokens, light and dark themes, WCAG checks, live UI previews and production-ready exports. Free, no account needed.",
  alternates: { canonical: "/design-system" },
  openGraph: {
    title: "Design System Generator — from one color to a full theme · ChromaBrew",
    description:
      "Turn one color into an accessible design system: color scale, palette, semantic tokens, light and dark themes, WCAG checks, live UI previews and production-ready exports. Free, no account needed.",
    url: "/design-system",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Design System Generator — from one color to a full theme · ChromaBrew",
    description:
      "Accessible palettes, semantic tokens, light and dark themes, WCAG checks and production-ready exports from one color. Free, no sign-up.",
    images: [defaultOgImage.url],
  },
};

/**
 * Statically prerendered shell. Shareable-URL state (?primary=…&strategy=…)
 * and project loading (?project=…) are hydrated client-side after mount.
 */
export default function DesignSystemPage() {
  return (
    <>
      <GeneratorWorkspace />
      <DesignSystemContent />
    </>
  );
}
