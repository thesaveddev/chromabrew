import type { Metadata } from "next";
import { GeneratorWorkspace } from "@/components/generator/generator-client";
import { DesignSystemContent } from "@/components/generator/design-system-content";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Design system generator — Figma variables & tokens",
  description:
    "Turn one color into an accessible design system: scale, palette, semantic tokens, light and dark themes, WCAG checks, Figma variables and Tokens Studio export, and production-ready code. Free.",
  keywords: [
    "design system generator",
    "figma design system generator",
    "figma variables",
    "figma design tokens",
    "figma tokens studio",
    "figma color palette generator",
    "export to figma",
  ],
  alternates: { canonical: "/design-system" },
  openGraph: {
    title: "Design System Generator — Figma variables from one color · ChromaBrew",
    description:
      "Turn one color into an accessible design system: scale, palette, semantic tokens, light and dark themes, WCAG checks, Figma variables export and production-ready code. Free.",
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
