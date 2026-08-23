import type { Metadata } from "next";
import { GeneratorWorkspace } from "@/components/generator/generator-client";

export const metadata: Metadata = {
  title: "Design system generator",
  description:
    "Turn one colour into an accessible design system: colour scale, palette, semantic tokens, light and dark themes, WCAG checks, live UI previews and production-ready exports. Free, no account needed.",
  alternates: { canonical: "/design-system" },
};

/**
 * Statically prerendered shell. Shareable-URL state (?primary=…&strategy=…)
 * is hydrated client-side after mount, so the route stays fully static.
 */
export default function DesignSystemPage() {
  return <GeneratorWorkspace />;
}
