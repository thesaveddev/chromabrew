export interface ToolFaq {
  q: string;
  a: string;
}

export type ToolCategory = "color" | "converter" | "css" | "image";

export interface ToolDefinition {
  href: string;
  navLabel: string;
  title: string;
  metaTitle: string;
  description: string;
  /** Short card copy for grids. */
  blurb: string;
  /** Two short, keyword-aware paragraphs rendered under the page intro. */
  intro: string[];
  /** Broad category used for related-tool grouping and the index page. */
  category: ToolCategory;
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
    intro: [
      "Generate a color palette from any base color using the six classic color-harmony rules — complementary, analogous, triadic, split-complementary, monochromatic and tetradic. Everything runs locally in your browser, so nothing is uploaded and there is no account to create.",
      "Every palette is computed in OKLCH, a perceptually uniform colour space, so the swatches stay visually balanced instead of drifting like raw-hex mixes. Change the base color or switch strategies and the palette regenerates instantly, with HEX values ready to copy.",
    ],
    category: "color",
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
    href: "/tools/brand-palettes",
    navLabel: "Brand color palettes",
    title: "Brand color palettes",
    metaTitle: "Brand Color Palettes — real brand colors as design seeds",
    description:
      "Browse reference colors for top brands and turn any of them into a full accessible design system. Search by sector, copy hex values, or use a brand color as the generator's primary seed.",
    blurb: "Real brand colors you can use as a design seed.",
    intro: [
      "Browse the anchor colors behind well-known brands and turn any of them into a full, accessible design system in one click. Each entry lists the most widely cited color for a mark, with the hex value ready to copy.",
      "Choose \"Use as seed\" and the design system generator derives a perceptual scale, semantic tokens, light and dark themes and production CSS from that single brand color.",
    ],
    category: "color",
    faqs: [
      {
        q: "Are these official brand colors?",
        a: "They are widely published reference values, not official brand guidelines. Confirm the current color with the brand's own materials before shipping anything in their identity.",
      },
      {
        q: "How do I turn a brand color into a design system?",
        a: "Click 'Use as seed' on any card. It opens the design system generator with that color pre-filled as the primary, so everything — scale, palette, tokens, themes and exports — derives from it.",
      },
      {
        q: "Why is only one color listed per brand?",
        a: "Most marks have a single anchor color. For brands with multi-color or gradient identities we list the most commonly cited anchor, which is the best single seed for palette generation.",
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
    intro: [
      "Turn any color into an eleven-step shade scale — 50 through 950 — computed in OKLCH so the steps are perceptually even. No more scales that look identical in the middle and jump at the ends.",
      "Copy plain HEX values or the complete Tailwind-ready @theme block. The step naming matches Tailwind exactly, so tints and shades map straight onto utility classes.",
    ],
    category: "color",
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
    intro: [
      "Check the WCAG contrast ratio between any two colors — foreground and background — and see whether the pair passes AA and AAA for normal and large text. The ratio uses the WCAG relative-luminance formula, the same numbers other accessibility tools report.",
      "When a combination fails, the contrast checker suggests the nearest accessible color that preserves your hue, so you can fix the pair instead of guessing.",
    ],
    category: "color",
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
    href: "/tools/color-converter",
    navLabel: "Color converter",
    title: "Color converter",
    metaTitle: "Color Converter — HEX, RGB, HSL, CMYK & OKLCH at once",
    description:
      "Convert between HEX, RGB, HSL, CMYK and OKLCH in one place. Paste any color in any format and copy all five equivalents instantly, with a live preview.",
    blurb: "HEX, RGB, HSL, CMYK & OKLCH in one converter.",
    intro: [
      "Convert any color between HEX, RGB, HSL, CMYK and OKLCH in a single converter. Type or paste a hex code, rgb() or hsl() — even a CSS color name like tomato — and read all five equivalents at once.",
      "One URL replaces three separate round-trip converters, and the live preview updates as you type. Copy any format, or seed the design system generator with the result.",
    ],
    category: "converter",
    faqs: [
      {
        q: "Which color formats are supported?",
        a: "Paste HEX, rgb() or hsl() — even CSS-color keywords you type are resolved. The tool shows HEX, RGB, HSL, CMYK and OKLCH simultaneously so you never convert twice.",
      },
      {
        q: "Why is there one converter instead of separate pages?",
        a: "HEX, RGB, HSL, CMYK and OKLCH describe the same color. One page that shows every format at once is faster than three one-way converters, and there is one URL to bookmark and link to.",
      },
      {
        q: "What's the difference between CMYK and the on-screen formats?",
        a: "CMYK is subtractive ink percentages used for print — packaging, stationery and brand collateral. On screen it is a translation, not a native language: your code and design system consume the HEX, RGB, HSL or OKLCH versions shown alongside it.",
      },
      {
        q: "Can I turn the result into a full design system?",
        a: "Yes — a one-click link seeds the design system generator with your color, deriving scale, palette, tokens, light and dark themes, and exports from it.",
      },
    ],
  },
  {
    href: "/tools/color-names",
    navLabel: "Color names",
    title: "CSS color names",
    metaTitle: "CSS Color Names — find the closest named colour to any color",
    description:
      "Find the closest of the 148 CSS named colors to any HEX, RGB or HSL color, measured in OKLab — with the dominant hue named for every color too. Browse, search and copy names or hex straight into your CSS.",
    blurb: "The 148 CSS names + dominant hue, closest first.",
    intro: [
      "Find the closest of the 148 CSS named colors to any hex, RGB or HSL value, measured in OKLab. An exact match lands at distance zero; neighboring keywords are ranked by how close they appear to the eye.",
      "Every color also gets its dominant hue named for it. Browse or search the full list of CSS named colors and copy the name or hex straight into your stylesheet.",
    ],
    category: "color",
    faqs: [
      {
        q: "How many named colors does CSS define?",
        a: "CSS Color Module Level 4 defines 148 named colors — the SVG keywords from aqua and black to yellowgreen (147 of them), plus rebeccapurple, and aliases like gray/grey and aqua/cyan that share a hex. Every one can be used as-is in any browser.",
      },
      {
        q: "How is the closest name chosen?",
        a: "Distances are measured in OKLab, a colour space built to match how humans perceive difference. An exact hex (like #ff6347 → tomato) lands at distance 0; neighbours are ranked by that perceptual distance.",
      },
      {
        q: "Should I use named colors in production?",
        a: "They are valid CSS, but only a handful are stable enough to lean on at scale — navy, crimson, tomato, rebeccapurple and a few greys. This tool shows the hex behind every name so you can lock values into tokens instead of magic strings.",
      },
      {
        q: "Can I turn a named color into a full design system?",
        a: "Yes — copy the hex, then one click seeds the design system generator, deriving scale, palette, tokens, themes and exports from that color.",
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
    intro: [
      "Generate a full 50–950 Tailwind color scale from a single brand color, emitted as a ready-to-paste Tailwind CSS v4 @theme block. The eleven steps are derived in OKLCH so tints and shades stay perceptually even.",
      "Name the scale before copying and every --color-* variable and utility class follows along — bg-brand-600 style utilities work the moment you paste. The same hex steps drop into a Tailwind v3 config too.",
    ],
    category: "css",
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
    intro: [
      "Build a complete shadcn/ui theme from one brand color in the current oklch() convention. The generator emits matched light and dark variable blocks, including chart-1…chart-5 and sidebar tokens.",
      "Paste the CSS into your global stylesheet and every shadcn component — buttons, cards, dialogs and charts — picks up the theme automatically.",
    ],
    category: "css",
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
    intro: [
      "Turn any brand color into an accessible dark theme with real semantic tokens — backgrounds, surfaces, borders, actions and status colors — rather than a mechanical inversion of your light mode.",
      "Foreground/background pairs are measured against WCAG contrast thresholds and adjusted automatically, and you can export the result as CSS variables or JSON for Tailwind v4 or plain CSS.",
    ],
    category: "color",
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
    intro: [
      "Generate structured design tokens — a primitive brand scale plus semantic roles for light and dark themes — and export them as DTCG-style JSON or plain CSS custom properties.",
      "Semantic tokens map roles like background, surface and primary to primitives, so retheming means swapping one mapping instead of hunting hard-coded hex values. Save a system to your account to regenerate it later, with version snapshots.",
    ],
    category: "css",
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
    intro: [
      "Extract the dominant colors from any image and get a clean palette with HEX values within seconds. The image is processed locally on a canvas — pixels are clustered with a median-cut algorithm and nothing is uploaded.",
      "Drag in a JPEG, PNG, GIF, WebP or SVG; the extractor returns the dominant colors plus RGB readouts you can use as a ready-made scheme.",
    ],
    category: "image",
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
    metaTitle: "Color Blindness Simulator — see colors as others see them",
    description:
      "Simulate any color and any image under all eight conditions — protanopia, deuteranopia, tritanopia, achromatopsia and the milder anomalous forms — and check whether a text/background pair stays distinguishable. Free, instant, browser-only, nothing uploaded.",
    blurb: "Simulate colors & images under all eight CVD types.",
    intro: [
      "See how any color — or a whole image — appears under all eight types of color vision deficiency: protanopia, deuteranopia, tritanopia, achromatopsia and the milder anomalous forms. Roughly 8% of men and 0.5% of women have some form of color blindness, so checking matters.",
      "Simulations run on a local canvas with peer-reviewed Machado et al. (2009) matrices; nothing is uploaded. A pair checker also grades whether text on a background stays distinguishable for color-blind viewers.",
    ],
    category: "color",
    faqs: [
      {
        q: "What types of color blindness does this simulate?",
        a: "Eight conditions: the full forms — protanopia (no red cones), deuteranopia (no green cones), tritanopia (no blue cones) and achromatopsia (total color blindness) — plus the milder, far more common anomalous forms protanomaly, deuteranomaly and tritanomaly. Each uses peer-reviewed Machado et al. (2009) matrices.",
      },
      {
        q: "Can I simulate a whole image, not just one color?",
        a: "Yes — drop in a photo, chart or UI screenshot and it is simulated under all eight conditions on a local canvas. Your image never leaves your browser, and every preview can be downloaded as a PNG.",
      },
      {
        q: "Can I check if two colors are distinguishable?",
        a: "Yes — alongside simulating single colors and images, you can check a foreground/background pair under every full condition. The color difference score shows whether they stay distinguishable, which contrast ratio alone can't guarantee.",
      },
      {
        q: "Why does color accessibility matter?",
        a: "Roughly 8% of men and 0.5% of women have some form of color vision deficiency. If your interface relies on color alone to convey meaning, those users may be excluded. This tool helps you catch those issues early.",
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
    intro: [
      "Build linear, radial and conic CSS gradients visually — pick colors, set angles and drag color stops — then copy production-ready CSS. The code updates live and includes a plain-color fallback where useful.",
      "Switch gradient types and stop colors without touching the output; the generated CSS is standard-compliant and ready to paste into any stylesheet.",
    ],
    category: "css",
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
    intro: [
      "Blend two colors at any ratio with instant HEX, RGB and HSL readouts, plus an eleven-step scale you can use for transitions and hover states. Mixing interpolates each RGB channel, so the result is predictable.",
      "Use the scale output to build smooth color gradients or pick hover shades between two brand colors.",
    ],
    category: "color",
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
    intro: [
      "Design box-shadow and text-shadow values with sliders — offset, blur, spread, color and opacity — and copy clean rgba() CSS the moment it looks right. Standard-compliant output for any modern browser.",
      "Shadows combine with commas, so it is easy to layer multiple effects for depth, elevation or soft glows.",
    ],
    category: "css",
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
    intro: [
      "Add transparency to any color and get the HEX8, RGBA and percentage opacity values at once, previewed on white, gray and black backgrounds. HEX8 extends a hex code with two alpha digits.",
      "Preview on multiple backgrounds catches contrast problems before they ship, because transparency reads differently depending on what sits beneath it.",
    ],
    category: "color",
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
    intro: [
      "Check an entire color palette for WCAG contrast failures in one matrix view. Every foreground/background pair is graded for AA normal and large text, with failures flagged at a glance.",
      "Add as many colors as you need; the matrix scales automatically and makes obvious which combinations need fixing before you export.",
    ],
    category: "color",
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
    href: "/tools/typography-scale-generator",
    navLabel: "Typography scale generator",
    title: "Typography scale generator",
    metaTitle: "Typography Scale Generator — modular type scale in px & rem",
    description:
      "Generate a modular type scale from base size and ratio (1.2 / 1.25 / 1.333). Get px & rem sizes, line heights, letter spacing, font pairings, CSS variables and a live preview. Free, no sign-up.",
    blurb: "Modular type scale with live preview & CSS.",
    intro: [
      "Generate a modular type scale from a base size and ratio — 1.2, 1.25 or 1.333 — with px and rem output, line heights, letter spacing, font pairings and CSS variables. Watch it live before you export.",
      "rem units respect the user's browser font-size setting, which is the accessible default. Six curated system-font pairings ship without loading any webfonts.",
    ],
    category: "css",
    faqs: [
      {
        q: "What is a modular type scale?",
        a: "It multiplies a base font size by a constant ratio to produce every step of the scale — so each size shares a geometric relationship instead of being picked at random. Common ratios are 1.200 (minor third), 1.250 (major third) and 1.333 (perfect fourth).",
      },
      {
        q: "How do I choose a ratio?",
        a: "Steeper ratios create stronger contrast between body and display text, which suits landing pages and editorial layouts. Gentler ratios (1.2) keep a tighter, denser system ideal for text-heavy apps and dashboards. Start with 1.25 and adjust.",
      },
      {
        q: "Why output in rem instead of px?",
        a: "rem units scale with the user's browser font-size setting, which is the accessible default. The px column shows the rendered size at your chosen base so you can check it matches your design.",
      },
      {
        q: "Which font pairings are available?",
        a: "Six curated heading/body pairings built only from widely available system fonts — System, Grotesque, Editorial, Humanist, Geometric and Technical. No webfont loading required, so the preview and output work everywhere.",
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
    intro: [
      "Convert SVG files or pasted SVG code to JPG at 1x, 2x, 3x or 4x resolution. The SVG renders on a local canvas and exports as a 92%-quality JPEG — nothing is sent to a server.",
      "Pick 2x for retina screens or 4x for print-level sharpness. JPGs don't carry transparency, so the export adds a white background.",
    ],
    category: "image",
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
  {
    href: "/tools/jpg-to-svg",
    navLabel: "JPG to SVG",
    title: "JPG to SVG converter",
    metaTitle: "JPG to SVG Converter — raster to vector in your browser",
    description:
      "Convert JPG, PNG or any raster image to SVG using color quantization. Adjust the color count for quality vs file size. Free, no sign-up, runs in your browser.",
    blurb: "Raster → SVG via color quantization.",
    intro: [
      "Convert a JPG, PNG or any raster image to SVG by color quantization, right in the browser. Fewer colors mean smaller files with clean flat shapes — ideal for logos and icons; more colors preserve photo detail.",
      "Adjacent same-color pixels merge into rectangles, which keeps the SVG lightweight and editable in any vector tool.",
    ],
    category: "image",
    faqs: [
      {
        q: "How does JPG to SVG conversion work?",
        a: "The image is read pixel-by-pixel on a canvas, then quantized to reduce the color palette. Adjacent pixels of the same color are merged into run-length rectangles, producing an optimized SVG.",
      },
      {
        q: "Why would I convert a JPG to SVG?",
        a: "SVGs scale infinitely without losing quality, load faster for simple graphics, and can be edited in design tools. Logos and icons benefit most — photos produce large files.",
      },
      {
        q: "How many colors should I use?",
        a: "Fewer colors (4–16) produce smaller files with visible banding — great for logos. More colors (32–128) preserve detail but create larger SVGs. Start with 16 and adjust.",
      },
    ],
  },
];

export function findTool(href: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.href === href);
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  color: "Color tools",
  converter: "Converters",
  css: "CSS & tokens",
  image: "Image tools",
};

export function categoryLabel(category: ToolCategory): string {
  return CATEGORY_LABELS[category];
}