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
 * Registry of free tools. Each entry maps to a route under /tools
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
  {
    href: "/tools/image-color-extractor",
    navLabel: "Image color extractor",
    title: "Image color extractor",
    metaTitle: "Image Color Extractor — extract palette from any photo",
    description:
      "Upload an image and instantly extract its dominant colors as a clean palette. Get HEX values, RGB readouts and a ready-to-use color scheme. Free, runs in your browser.",
    blurb: "Extract dominant colors from any image.",
    faqs: [
      {
        q: "How does the image color extractor work?",
        a: "Your image is drawn to an HTML Canvas element and every pixel is read directly in the browser. A median-cut algorithm clusters similar colors together to find the dominant palette. No image data is uploaded to any server.",
      },
      {
        q: "What formats are supported?",
        a: "Any image your browser can render: JPEG, PNG, GIF, WebP, SVG, and BMP. Drag-and-drop or click to upload.",
      },
      {
        q: "How many colors are extracted?",
        a: "By default the tool finds 6 dominant colors, which covers most design use cases. The algorithm groups visually similar pixels so each swatch represents a distinct region of the image.",
      },
    ],
  },
  {
    href: "/tools/color-blindness-simulator",
    navLabel: "Color blindness simulator",
    title: "Color blindness simulator",
    metaTitle: "Color Blindness Simulator — see how colors look to everyone",
    description:
      "Simulate how any color or palette appears to people with protanopia, deuteranopia, tritanopia and achromatopsia. Build truly accessible designs. Free, instant, browser-only.",
    blurb: "Simulate protanopia, deuteranopia & tritanopia.",
    faqs: [
      {
        q: "What types of color blindness does this simulate?",
        a: "Four types: protanopia (no red cones), deuteranopia (no green cones), tritanopia (no blue cones), and achromatopsia (total color blindness). Each uses peer-reviewed transformation matrices.",
      },
      {
        q: "How accurate is the simulation?",
        a: "The matrices are based on published research from Machado et al. (2009) and are the same ones used by major accessibility tools. They model the most common forms of each condition.",
      },
      {
        q: "Why does color accessibility matter?",
        a: "Roughly 8 % of men and 0.5 % of women have some form of color vision deficiency. If your interface relies on color alone to convey meaning, those users may be excluded. This tool helps you catch those issues early.",
      },
    ],
  },
  {
    href: "/tools/css-gradient-generator",
    navLabel: "CSS gradient generator",
    title: "CSS gradient generator",
    metaTitle: "CSS Gradient Generator — linear, radial & conic from any colors",
    description:
      "Build linear, radial and conic CSS gradients visually. Pick colors, adjust angles and stops, then copy production-ready CSS. Free, no sign-up, runs in your browser.",
    blurb: "Linear, radial & conic gradients visually.",
    faqs: [
      {
        q: "What gradient types are supported?",
        a: "Linear (any angle), radial (circle or ellipse), and conic (sweep from a center point). Switch between them with one click and the CSS updates live.",
      },
      {
        q: "Can I add more color stops?",
        a: "Yes — click anywhere on the gradient bar to add a new stop, drag to reposition, and click a stop to change its color. The generated CSS reflects every change instantly.",
      },
      {
        q: "Is the output production-ready?",
        a: "Yes — the CSS is clean, standard-compliant and ready to paste into any stylesheet. It includes fallback plain colors for older browsers when relevant.",
      },
    ],
  },
  {
    href: "/tools/color-mixer",
    navLabel: "Color mixer",
    title: "Color mixer",
    metaTitle: "Color Mixer — blend two colors at any ratio",
    description:
      "Blend two colors at any ratio with a live preview. Get HEX, RGB and HSL values for the mixed result, plus an 11-step blend scale. Free, instant, browser-only.",
    blurb: "Blend two colors at any ratio.",
    faqs: [
      {
        q: "How does color mixing work?",
        a: "Each RGB channel is interpolated linearly between the two input colors. At 50% you get an equal blend; at 75% the result leans toward the second color.",
      },
      {
        q: "What output formats are supported?",
        a: "The mixed color is shown in HEX, RGB and HSL, each with a one-click copy button. An 11-step scale from 0% to 100% is also provided.",
      },
      {
        q: "Can I use this to create color transitions?",
        a: "Yes — the 11-step blend scale is useful for creating smooth gradients or hover state transitions between two brand colors.",
      },
    ],
  },
  {
    href: "/tools/css-shadow-generator",
    navLabel: "CSS shadow generator",
    title: "CSS shadow generator",
    metaTitle: "CSS Shadow Generator — box-shadow & text-shadow visually",
    description:
      "Build box-shadow and text-shadow CSS visually. Adjust offset, blur, spread, color and opacity with sliders, then copy production-ready CSS. Free, no sign-up, runs in your browser.",
    blurb: "Visual box-shadow & text-shadow builder.",
    faqs: [
      {
        q: "What shadow types are supported?",
        a: "Box shadows (for elements) and text shadows (for text). Both support offset X/Y, blur radius, color and alpha. Box shadows also include spread radius.",
      },
      {
        q: "Is the output production-ready?",
        a: "Yes — the CSS uses standard rgba() color notation and is ready to paste into any stylesheet. It works in all modern browsers.",
      },
      {
        q: "Can I create layered shadows?",
        a: "This tool generates single shadows. For layered effects, generate multiple shadows and combine them with commas in your CSS.",
      },
    ],
  },
  {
    href: "/tools/alpha-channel",
    navLabel: "Alpha channel tool",
    title: "Alpha channel tool",
    metaTitle: "Alpha Channel Tool — HEX8, RGBA & opacity values",
    description:
      "Add transparency to any color. Get HEX8, RGBA and percentage opacity values with a live preview on white, gray and black backgrounds. Free, instant, browser-only.",
    blurb: "HEX8, RGBA & opacity from any color.",
    faqs: [
      {
        q: "What is HEX8?",
        a: "HEX8 is an 8-digit hex code where the last two digits represent alpha (transparency). For example, #3a86ff80 is blue at 50% opacity.",
      },
      {
        q: "How do I parse HEX8 back to a color?",
        a: "The first 6 digits are the color, the last 2 are the alpha channel in hex. #ff000080 = red at 50% opacity (0x80 = 128, 128/255 ≈ 50%).",
      },
      {
        q: "Why preview on multiple backgrounds?",
        a: "Transparency looks different depending on what's behind it. Previewing on white, gray and black helps you catch contrast issues before shipping.",
      },
    ],
  },
  {
    href: "/tools/wcag-palette-checker",
    navLabel: "WCAG palette checker",
    title: "WCAG color palette checker",
    metaTitle: "WCAG Palette Checker — check entire palettes for contrast",
    description:
      "Check an entire color palette for WCAG contrast violations. See every foreground/background pair in a matrix, spot failures instantly, and fix them. Free, instant, browser-only.",
    blurb: "Check full palettes for contrast issues.",
    faqs: [
      {
        q: "How is this different from the contrast checker?",
        a: "The contrast checker tests one pair at a time. This tool tests every combination in your palette at once, showing a matrix of contrast ratios and pass/fail grades.",
      },
      {
        q: "What does AA and AAA mean?",
        a: "WCAG AA requires 4.5:1 for normal text and 3:1 for large text. AAA requires 7:1 and 4.5:1. The matrix shows AA grades; hover for the full breakdown.",
      },
      {
        q: "How many colors can I add?",
        a: "As many as you need. The matrix scales automatically, though it becomes harder to read beyond about 8 colors.",
      },
    ],
  },
  {
    href: "/tools/svg-to-jpg",
    navLabel: "SVG to JPG",
    title: "SVG to JPG converter",
    metaTitle: "SVG to JPG Converter — export SVGs as JPG at any scale",
    description:
      "Convert SVG images to JPG instantly. Upload or paste SVG code, preview live, then export at 1x, 2x, 3x or 4x resolution. Free, no sign-up, runs in your browser.",
    blurb: "SVG → JPG at any scale.",
    faqs: [
      {
        q: "How does SVG to JPG conversion work?",
        a: "The SVG is rendered to an HTML Canvas element at your chosen scale, then exported as a JPEG at 92% quality. Everything happens in the browser — no server upload.",
      },
      {
        q: "What scale should I choose?",
        a: "1x is the original size. 2x doubles the dimensions (good for retina displays). 3x and 4x are for print or high-DPI use cases where you need extra sharpness.",
      },
      {
        q: "Does it support transparent backgrounds?",
        a: "JPG doesn't support transparency — the export adds a white background. If you need transparency, keep the SVG or export as PNG instead.",
      },
    ],
  },
];

export function findTool(href: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.href === href);
}
