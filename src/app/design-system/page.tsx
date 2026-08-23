import type { Metadata } from "next";
import { configFromParams } from "@/lib/design-system/share";
import { GeneratorWorkspace } from "@/components/generator/generator-client";

export const metadata: Metadata = {
  title: "Design system generator",
  description:
    "Turn one colour into an accessible design system: colour scale, palette, semantic tokens, light and dark themes, WCAG checks, live UI previews and production-ready exports. Free, no account needed.",
  alternates: { canonical: "/design-system" },
};

export default async function DesignSystemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <GeneratorWorkspace initialConfig={configFromParams(params)} />
  );
}
