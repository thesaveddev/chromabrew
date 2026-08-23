export interface ToolDefinition {
  href: string;
  navLabel: string;
  title: string;
  metaTitle: string;
  description: string;
  /** Short card copy for grids. */
  blurb: string;
}

/**
 * Registry of Phase 1 free tools. Each entry maps to a route under /tools
 * and must provide genuine, working functionality — never a thin page.
 */
export const TOOLS: ToolDefinition[] = [
  {
    href: "/tools/color-palette-generator",
    navLabel: "Colour palette generator",
    title: "Colour palette generator",
    metaTitle: "Colour Palette Generator — complementary, triadic & more",
    description:
      "Generate complementary, analogous, triadic, split-complementary, monochromatic and tetradic palettes from any colour. Free and instant.",
    blurb: "Six palette strategies from one colour.",
  },
  {
    href: "/tools/shade-generator",
    navLabel: "Shade generator",
    title: "Shade & tint scale generator",
    metaTitle: "Shade Generator — perceptual 50–950 colour scales",
    description:
      "Create perceptually even 50–950 shade scales in OKLCH from a single brand colour. Copy HEX values or the full Tailwind theme.",
    blurb: "Perceptual 50–950 scales in OKLCH.",
  },
  {
    href: "/tools/contrast-checker",
    navLabel: "Contrast checker",
    title: "WCAG contrast checker",
    metaTitle: "Contrast Checker — WCAG AA & AAA contrast ratios",
    description:
      "Check the contrast ratio between two colours against WCAG 2.x AA and AAA thresholds for normal and large text, then fix failures instantly.",
    blurb: "WCAG 2.x ratios with one-click fixes.",
  },
  {
    href: "/tools/hex-to-rgb",
    navLabel: "HEX to RGB",
    title: "HEX to RGB converter",
    metaTitle: "HEX to RGB Converter — instant, accurate, free",
    description:
      "Convert any HEX colour to RGB with live preview. Paste a hex code or pick a colour and copy the rgb() value instantly.",
    blurb: "Instant HEX → rgb() conversion.",
  },
  {
    href: "/tools/rgb-to-hex",
    navLabel: "RGB to HEX",
    title: "RGB to HEX converter",
    metaTitle: "RGB to HEX Converter — instant, accurate, free",
    description:
      "Convert any RGB colour to its HEX value with sliders and a live preview. Copy clean six-digit hex codes instantly.",
    blurb: "Instant rgb() → #hex conversion.",
  },
  {
    href: "/tools/hex-to-hsl",
    navLabel: "HEX to HSL",
    title: "HEX to HSL converter",
    metaTitle: "HEX to HSL Converter — instant, accurate, free",
    description:
      "Convert HEX colours to HSL with hue, saturation and lightness readouts plus OKLCH equivalents for modern CSS.",
    blurb: "HEX → hsl() with OKLCH readout.",
  },
  {
    href: "/tools/tailwind-color-generator",
    navLabel: "Tailwind colour generator",
    title: "Tailwind colour generator",
    metaTitle: "Tailwind Colour Generator — v4 @theme palettes from one colour",
    description:
      "Generate Tailwind CSS v4 @theme colour variables from a single brand colour, with a full 50–950 perceptual scale ready to paste.",
    blurb: "Tailwind v4 @theme output from one colour.",
  },
  {
    href: "/tools/shadcn-theme-generator",
    navLabel: "shadcn/ui theme generator",
    title: "shadcn/ui theme generator",
    metaTitle: "shadcn/ui Theme Generator — oklch themes from your brand colour",
    description:
      "Build a complete shadcn/ui theme in current oklch format from one brand colour — light and dark modes, charts and sidebar tokens included.",
    blurb: "Current-convention shadcn themes.",
  },
  {
    href: "/tools/dark-mode-generator",
    navLabel: "Dark mode generator",
    title: "Dark mode generator",
    metaTitle: "Dark Mode Generator — accessible dark themes from any colour",
    description:
      "Turn any brand colour into an accessible dark theme with semantic tokens — never a mechanical inversion of your light mode.",
    blurb: "Semantic dark themes, not inversions.",
  },
  {
    href: "/tools/design-token-generator",
    navLabel: "Design token generator",
    title: "Design token generator",
    metaTitle: "Design Token Generator — semantic JSON & CSS tokens",
    description:
      "Generate structured design tokens — primitives and semantic roles for light and dark themes — as DTCG-style JSON or CSS variables.",
    blurb: "DTCG-style JSON + CSS tokens.",
  },
];

export function findTool(href: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.href === href);
}
