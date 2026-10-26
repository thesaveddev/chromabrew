import type { Metadata } from "next";
import { findTool } from "@/lib/tools";
import { ToolShell } from "@/components/tools/tool-shell";
import { PaletteTool } from "@/components/tools/palette-tool";
import { toolMetadata } from "@/components/tools/tool-metadata";
import { parseColour } from "@/lib/design-system/colour/convert";

export const metadata: Metadata = toolMetadata("/tools/color-palette-generator");

const TOOL = findTool("/tools/color-palette-generator")!;

const FALLBACK = "#47003a";

/** Gallery deep-links pass ?color=<hex> so variations start from that palette. */
function initialFromSearchParams(searchParams?: Record<string, string | string[] | undefined>): string {
  const rawValue = searchParams?.color ?? searchParams?.primary;
  const raw = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (!raw) return FALLBACK;
  const candidate = raw.trim();
  if (!candidate) return FALLBACK;
  const hexish = candidate.startsWith("#") ? candidate : `#${candidate}`;
  return parseColour(hexish) ?? parseColour(candidate) ?? FALLBACK;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initial = initialFromSearchParams(
    searchParams ? await searchParams : undefined,
  );
  return (
    <ToolShell
      tool={TOOL}
      usage={[
        "Enter or pick your base color — HEX, rgb() and hsl() input are all accepted.",
        "Choose a palette strategy such as complementary, triadic or analogous.",
        "Copy any swatch as HEX, or jump into the generator to turn the palette into a complete design system.",
      ]}
    >
      <PaletteTool key={initial} initial={initial} />
    </ToolShell>
  );
}
