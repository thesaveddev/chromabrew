export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolDefinition {
  href: string;
  navLabel: string;
  title: string;
  metaTitle: string;
  description: string;
  /** Short card copy for grids. */
  blurb: string;
  /** Genuine Q&As rendered on the page and emitted as FAQPage JSON-LD. */
  faqs: ToolFaq[];
}

/**
 * Registry of Phase 1 free tools. Each entry maps to a route under /tools
 * and must provide genuine, working functionality — never a thin page.
 */
export const TOOLS: ToolDefinition[] = [
  {
    href: "/tools/color-palette-generator",
    navLabel: "Color palette generator",
    title: "Color palette generator",
    metaTitle: "Color Palette Generator — complementary, triadic & more",
    description:
      "Generate complementary, analogous, triadic, split-complementary, monochromatic and tetradic palettes from any color. Free and instant.",
    blurb: "Six palette strategies from one color.",
    faqs: [
      {
        q: "How does the color palette generator work?",
        a: "Pick or paste any color and choose one of six harmony strategies — complementary, analogous, triadic, split-complementary, monochromatic or tetradic. The palette is computed in OKLCH so every swatch stays perceptually consistent.",
      },
      {
        q: "Which palette harmonies are supported?",
        a: "All six classic color harmonies: complementary, analogous, triadic, split-complementary, monochromatic and tetradic. Switching strategies regenerates instantly.",
      },
      {
        q: "Is this palette generator free?",
        a: "Yes — completely free with no account required. Everything runs in your browser; your colors are never uploaded.",
      },
    ],
  },
  {
    href: "/tools/shade-generator",
    navLabel: "Shade generator",
    title: "Shade & tint scale generator",
    metaTitle: "Shade Generator — perceptual 50–950 color scales",
    description:
      "Create perceptually even 50–950 shade scales in OKLCH from a single brand color. Copy HEX values or the full Tailwind theme.",
    blurb: "Perceptual 50–950 scales in OKLCH.",
    faqs: [
      {
        q: "Why generate shades in OKLCH instead of plain HEX?",
        a: "Stepping raw HEX values produces scales where some steps look identical and others jump wildly. OKLCH is perceptually uniform, so each step from 50 to 950 feels evenly spaced to the eye.",
      },
      {
        q: "Can I use these shades as a Tailwind color scale?",
        a: "Yes — the 50–950 steps map directly onto Tailwind's scale naming, and you can copy a ready-to-paste Tailwind v4 @theme block from this tool.",
      },
      {
        q: "How many shades do I get?",
        a: "Eleven steps (50, 100, 200 … 900, 950) covering tints, the base color and shades, all derived from your single input color.",
      },
    ],
  },
  {
    href: "/tools/contrast-checker",
    navLabel: "Contrast checker",
    title: "WCAG contrast checker",
    metaTitle: "Contrast Checker — WCAG AA & AAA contrast ratios",
    description:
      "Check the contrast ratio between two colors against WCAG 2.x AA and AAA thresholds for normal and large text, then fix failures instantly.",
    blurb: "WCAG 2.x ratios with one-click fixes.",
    faqs: [
      {
        q: "What contrast ratios does WCAG require?",
        a: "WCAG 2.x AA needs at least 4.5:1 for normal text and 3:1 for large text (18pt+, or 14pt bold). AAA raises those to 7:1 and 4.5:1 respectively. This tool grades both levels.",
      },
      {
        q: "How is the contrast ratio calculated?",
        a: "With the WCAG 2.x relative-luminance formula: both colors are converted to linear sRGB, luminance is computed, and the ratio is (lighter + 0.05) / (darker + 0.05).",
      },
      {
        q: "Can it fix failing combinations?",
        a: "Yes — when a pair fails, the tool can suggest the nearest adjusted color that passes, applied with one click instead of manual trial and error.",
      },
    ],
  },
  {
    href: "/tools/hex-to-rgb",
    navLabel: "HEX to RGB",
    title: "HEX to RGB converter",
    metaTitle: "HEX to RGB Converter — instant, accurate, free",
    description:
      "Convert any HEX color to RGB with live preview. Paste a hex code or pick a color and copy the rgb() value instantly.",
    blurb: "Instant HEX → rgb() conversion.",
    faqs: [
      {
        q: "How do I convert HEX to RGB?",
        a: "Each HEX pair is a base-16 number: split #47003A into 47, 00 and 3A, then convert each to decimal (71, 0, 58). Paste a code here and the rgb() equivalent updates live.",
      },
      {
        q: "Does it support 3-digit shorthand like #F00?",
        a: "Yes. Three-digit HEX is expanded by doubling each digit (#F00 → #FF0000) before conversion.",
      },
      {
        q: "What else does the converter show?",
        a: "Besides rgb(), you get an OKLCH readout — the modern CSS color space used by newer design systems — plus a live preview swatch.",
      },
    ],
  },
  {
    href: "/tools/rgb-to-hex",
    navLabel: "RGB to HEX",
    title: "RGB to HEX converter",
    metaTitle: "RGB to HEX Converter — instant, accurate, free",
    description:
      "Convert any RGB color to its HEX value with sliders and a live preview. Copy clean six-digit hex codes instantly.",
    blurb: "Instant rgb() → #hex conversion.",
    faqs: [
      {
        q: "How is RGB converted to HEX?",
        a: "Each channel (0–255) is written in base 16 and the three pairs are joined: rgb(199, 121, 208) becomes #C779D0. Values outside 0–255 are clamped.",
      },
      {
        q: "Will I always get a six-digit code?",
        a: "Yes — output is always a clean six-digit hex with the # prefix, ready to paste into CSS, Figma or Tailwind config.",
      },
      {
        q: "Can I adjust channels visually?",
        a: "Yes — red, green and blue sliders update the HEX value and preview live as you drag.",
      },
    ],
  },
  {
    href: "/tools/hex-to-hsl",
    navLabel: "HEX to HSL",
    title: "HEX to HSL converter",
    metaTitle: "HEX to HSL Converter — instant, accurate, free",
    description:
      "Convert HEX colors to HSL with hue, saturation and lightness readouts plus OKLCH equivalents for modern CSS.",
    blurb: "HEX → hsl() with OKLCH readout.",
    faqs: [
      {
        q: "How does HEX to HSL conversion work?",
        a: "The HEX values are first expanded to normalized RGB, then hue is derived from the dominant channel difference, saturation from the spread between min and max, and lightness from their average.",
      },
      {
        q: "Why would I use HSL over HEX?",
        a: "HSL separates hue, saturation and lightness, which makes it easy to build consistent variations of one color — darker hover states or desaturated backgrounds — while keeping the same hue.",
      },
      {
        q: "Does it also show OKLCH?",
        a: "Yes — alongside hsl() you get the OKLCH equivalent, useful for modern CSS where perceptually uniform adjustments matter.",
      },
    ],
  },
  {
    href: "/tools/tailwind-color-generator",
    navLabel: "Tailwind color generator",
    title: "Tailwind color generator",
    metaTitle: "Tailwind Color Generator — v4 @theme palettes from one color",
    description:
      "Generate Tailwind CSS v4 @theme color variables from a single brand color, with a full 50–950 perceptual scale ready to paste.",
    blurb: "Tailwind v4 @theme output from one color.",
    faqs: [
      {
        q: "Does this support Tailwind CSS v4?",
        a: "Yes — output uses Tailwind v4's native @theme block with --color-* variables, so you can paste it straight into your CSS entry file; utilities like bg-brand-600 just work.",
      },
      {
        q: "Where do the 50–950 steps come from?",
        a: "Your brand color is expanded into an eleven-step perceptual scale in OKLCH, so tints and shades stay visually even instead of washing out or muddying.",
      },
      {
        q: "Can I rename the generated color?",
        a: "Yes — change the scale name before copying and every variable and utility reference follows along.",
      },
    ],
  },
  {
    href: "/tools/shadcn-theme-generator",
    navLabel: "shadcn/ui theme generator",
    title: "shadcn/ui theme generator",
    metaTitle: "shadcn/ui Theme Generator — oklch themes from your brand color",
    description:
      "Build a complete shadcn/ui theme in current oklch format from one brand color — light and dark modes, charts and sidebar tokens included.",
    blurb: "Current-convention shadcn themes.",
    faqs: [
      {
        q: "Does it output the current shadcn/ui token format?",
        a: "Yes — themes are emitted in oklch() with the current token set including chart-1…5 and sidebar variables, matching what recent shadcn/ui projects expect.",
      },
      {
        q: "Do I get both light and dark themes?",
        a: "Every generation produces a matched .root and .dark pair with accessible foregrounds, so switching modes never breaks contrast.",
      },
      {
        q: "How do I apply the theme?",
        a: "Paste the CSS into your global stylesheet (e.g. globals.css). The variables override shadcn's defaults everywhere — buttons, cards, dialogs and charts pick them up automatically.",
      },
    ],
  },
  {
    href: "/tools/dark-mode-generator",
    navLabel: "Dark mode generator",
    title: "Dark mode generator",
    metaTitle: "Dark Mode Generator — accessible dark themes from any color",
    description:
      "Turn any brand color into an accessible dark theme with semantic tokens — never a mechanical inversion of your light mode.",
    blurb: "Semantic dark themes, not inversions.",
    faqs: [
      {
        q: "Why isn't dark mode just inverted light mode?",
        a: "Inverted themes look harsh because surfaces need different elevation logic in the dark: raised layers get lighter, not darker, and saturated accents need desaturating. This tool derives proper dark semantics from your brand color instead.",
      },
      {
        q: "Are the generated dark themes accessible?",
        a: "Yes — foreground/background pairs are checked against WCAG contrast thresholds and adjusted automatically, and the report shows the measured ratios honestly.",
      },
      {
        q: "What tokens are included?",
        a: "Backgrounds, surfaces, borders, inputs, primary/secondary/accent actions and status colors — exported as CSS variables or JSON, ready for Tailwind v4 or plain CSS.",
      },
    ],
  },
  {
    href: "/tools/design-token-generator",
    navLabel: "Design token generator",
    title: "Design token generator",
    metaTitle: "Design Token Generator — semantic JSON & CSS tokens",
    description:
      "Generate structured design tokens — primitives and semantic roles for light and dark themes — as DTCG-style JSON or CSS variables.",
    blurb: "DTCG-style JSON + CSS tokens.",
    faqs: [
      {
        q: "What's the difference between primitive and semantic tokens?",
        a: "Primitives are the raw scale (brand-500, gray-100); semantic tokens map roles to primitives (background, button-primary). Components consume semantics, so retheming means swapping mappings, not hunting hard-coded values.",
      },
      {
        q: "Which export formats are supported?",
        a: "DTCG-style JSON for design tools and token pipelines, plus plain CSS custom properties for direct use. Both cover light and dark themes.",
      },
      {
        q: "Can I version or regenerate tokens later?",
        a: "Yes — save a system to your account and regenerate any time; every save keeps a version snapshot you can roll back to.",
      },
    ],
  },
];

export function findTool(href: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.href === href);
}
