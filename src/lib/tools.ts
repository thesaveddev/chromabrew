export interface ToolFaq {
  q: string;
  a: string;
}

export type ToolCategory = "color" | "converter" | "css" | "image" | "ai";

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
    metaTitle: "Color Palette Generator — Complementary & More",
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
      {
        q: "What do I do with the palette after generating it?",
        a: "Copy any swatch as HEX, or open the design system generator with your base color to turn the palette into tonal scales, semantic tokens, light and dark themes and contrast-checked exports.",
      },
    ],
  },
  {
    href: "/tools/brand-palettes",
    navLabel: "Brand color palettes",
    title: "Brand color palettes",
    metaTitle: "Brand Color Palettes — Real Brand Hex Codes",
    description:
      "Browse reference colors for top brands and turn any of them into a full accessible design system. Search by sector, copy hex values, or seed the generator.",
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
    metaTitle: "Shade Generator — Perceptual 50–950 Scales",
    description:
      "Create perceptually even 50–950 shade scales in OKLCH from a single brand color. Copy each step's HEX or OKLCH value.",
    blurb: "Perceptual 50–950 scales in OKLCH.",
    intro: [
      "Turn any color into an eleven-step shade scale — 50 through 950 — computed in OKLCH so the steps are perceptually even. No more scales that look identical in the middle and jump at the ends.",
      "Copy any step's HEX or OKLCH value. The step naming matches Tailwind exactly, and when you're ready for a Theme-ready @theme block, the Tailwind color generator turns the same 50–950 scale into a paste-in CSS file.",
    ],
    category: "color",
    faqs: [
      {
        q: "Why generate shades in OKLCH instead of plain HEX?",
        a: "Stepping raw HEX values produces scales where some steps look identical and others jump wildly. OKLCH is perceptually uniform, so each step from 50 to 950 feels evenly spaced to the eye.",
      },
      {
        q: "Can I use these shades as a Tailwind color scale?",
        a: "Yes — the 50–950 steps map directly onto Tailwind's scale naming. Copy individual steps from here, or use the Tailwind color generator to export the whole 11-step scale as a ready-to-paste Tailwind v4 @theme block.",
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
    metaTitle: "Contrast Checker — WCAG AA & AAA Ratios",
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
    metaTitle: "Color Converter — HEX, RGB, HSL & OKLCH",
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
    metaTitle: "CSS Color Names — Closest Name for Any Hex",
    description:
      "Find the closest of the 148 CSS named colors to any HEX, RGB or HSL color, measured in OKLab. Browse, search and copy names or hex straight into CSS.",
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
    metaTitle: "Tailwind Color Generator — v4 @theme From One",
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
    metaTitle: "shadcn/ui Theme Generator — OKLCH Colors",
    description:
      "Build a complete shadcn/ui theme in current oklch format from one brand color — light and dark modes, charts and sidebar tokens included.",
    blurb: "Current-convention shadcn themes.",
    intro: [
      "Build a complete shadcn/ui theme from one brand color in the current oklch() convention. The generator emits matched light and dark variable blocks, including chart-1…chart-5 and sidebar tokens.",
      "Paste the CSS into your global stylesheet and every shadcn component — buttons, cards, dialogs and charts — picks up the theme automatically.",
      "Your brand hue drives --primary in both modes, but the two blocks are not copies: dark-mode primaries are lifted in lightness and softened in chroma so buttons stay vivid on dark surfaces, and every foreground is measured for contrast rather than assumed. Chart colors are spread around the hue wheel so series stay distinguishable, and --radius is carried through so your corner style survives the paste.",
    ],
    category: "css",
    faqs: [
      {
        q: "Does it output the current shadcn/ui token format?",
        a: "Yes — themes are emitted in oklch() with the current token set including chart-1…5 and sidebar variables, matching what recent shadcn/ui projects expect.",
      },
      {
        q: "Do I get both light and dark themes?",
        a: "Every generation produces a matched :root and .dark pair with accessible foregrounds, so switching modes never breaks contrast.",
      },
      {
        q: "How do I apply the theme?",
        a: "Paste the CSS into your global stylesheet (e.g. globals.css). The variables override shadcn's defaults everywhere — buttons, cards, dialogs and charts pick them up automatically.",
      },
      {
        q: "Will my brand color survive as the primary button color?",
        a: "Yes — the generator keeps your hue recognisable in --primary for both modes and adjusts lightness and chroma around it for legibility, rather than replacing it with a generic blue. If the exact brand hex must appear somewhere (a logo lockup, a marketing banner), use it as an accent alongside the theme primary.",
      },
    ],
  },
  {
    href: "/tools/dark-mode-generator",
    navLabel: "Dark mode generator",
    title: "Dark mode generator",
    metaTitle: "Dark Mode Generator — Accessible Dark Themes",
    description:
      "Turn any brand color into an accessible dark theme with semantic tokens — never a mechanical inversion of your light mode.",
    blurb: "Semantic dark themes, not inversions.",
    intro: [
      "Turn any brand color into an accessible dark theme with real semantic tokens — backgrounds, surfaces, borders, actions and status colors — rather than a mechanical inversion of your light mode.",
      "Foreground/background pairs are measured against WCAG contrast thresholds and adjusted automatically. Copy the result as a ready-to-paste .dark CSS variables block, or open the full generator when you also need JSON tokens for a design pipeline.",
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
        a: "Backgrounds, surfaces, borders, inputs, primary/secondary/accent actions and status colors — exported as a .dark CSS variables block you can paste into plain CSS or a Tailwind v4 project. Need JSON too? The design token generator covers that.",
      },
    ],
  },
  {
    href: "/tools/design-token-generator",
    navLabel: "Design token generator",
    title: "Design token generator",
    metaTitle: "Design Token Generator — Semantic JSON & CSS",
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
    metaTitle: "Image Color Extractor — Palette From a Photo",
    description:
      "Upload an image and instantly extract its dominant colors as a clean palette. Get HEX values, RGB readouts and a ready-to-use scheme. Free, browser-only.",
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
    metaTitle: "Color Blindness Simulator — See Any Palette",
    description:
      "Simulate any color and any image under all eight forms of color blindness — protanopia, deuteranopia, tritanopia — and check text stays distinguishable.",
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
    metaTitle: "CSS Gradient Generator — Linear, Radial, Conic",
    description:
      "Build linear, radial and conic CSS gradients visually. Pick colors, adjust angles and stops, then copy production-ready CSS. Free, no sign-up.",
    blurb: "Linear, radial & conic gradients visually.",
    intro: [
      "Build linear, radial and conic CSS gradients visually — pick colors, set angles and drag color stops — then copy production-ready CSS. The code updates live.",
      "Switch gradient types and stop colors without touching the output; the generated CSS is standard-compliant and ready to paste into any stylesheet.",
      "The most common professional use is the scrim: a transparent-to-near-black linear gradient laid over a photo so white headline text stays legible. Build it with two stops of the same hue (transparent → ~80% black) rather than two different colors — it reads as lighting, not decoration, and never fights the page's palette.",
    ],
    category: "css",
    faqs: [
      {
        q: "What gradient types are supported?",
        a: "Linear (any angle), radial (circle), and conic (sweep from a center point). Switch between them with one click and the CSS updates live.",
      },
      {
        q: "Can I add more color stops?",
        a: "Yes — click anywhere on the gradient bar to add a new stop, drag to reposition, and click a stop to change its color. The generated CSS reflects every change instantly.",
      },
      {
        q: "Is the output production-ready?",
        a: "Yes — the CSS is clean and standard-compliant. For older browsers that do not support CSS gradients, declare a plain-color background before the gradient rule as a fallback.",
      },
      {
        q: "Can I put text over my gradient?",
        a: "Only if the text zone stays contrast-safe: keep body copy off gradients entirely, and for headlines over an image-plus-gradient scrim, check the lightest point of the text area against your text color in the contrast checker — gradients fail WCAG at their lightest stop first.",
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
      "Blend two colors at any ratio with instant HEX, RGB and HSL readouts, plus an eleven-step scale you can use for transitions and hover states. Mixing happens in OKLCH, a perceptual color space, so midpoints stay vivid instead of turning muddy.",
      "Use the scale output to build smooth color gradients or pick hover shades between two brand colors.",
    ],
    category: "color",
    faqs: [
      {
        q: "How does color mixing work?",
        a: "Each color is converted to OKLCH — a perceptual color space — and the lightness, chroma and hue are interpolated between the two inputs. At 50% you get an equal blend that keeps both hues alive; straight RGB averaging would grey the midpoint out.",
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
    metaTitle: "CSS Shadow Generator — Box & Text Shadows",
    description:
      "Build box-shadow and text-shadow CSS visually. Adjust offset, blur, spread, color and opacity with sliders, then copy production-ready CSS. Free, no sign-up.",
    blurb: "Visual box-shadow & text-shadow builder.",
    intro: [
      "Design box-shadow and text-shadow values with sliders — offset, blur, spread, color and opacity — and copy clean rgba() CSS the moment it looks right. Standard-compliant output for any modern browser.",
      "Each output is a single shadow rule. CSS stacks multiple shadows with commas, so you can build a layered elevation by combining two or three generated values in one declaration.",
      "For dark mode, design shadows separately rather than reusing light-mode values: on a dark surface the shadow color should stay near-black but drop to roughly half the opacity, because the background itself already absorbs the contrast a shadow needs to read. If a dark card looks flat, widen the blur before raising the opacity.",
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
      {
        q: "What is spread for, and when should I leave it at zero?",
        a: "Spread grows or shrinks the shadow's footprint before blur is applied — useful for solid borders that glow (focus rings) or for shrinking a shadow tighter than its element. For elevation shadows that mimic real light, leave spread at zero and control the shape with offset and blur instead.",
      },
    ],
  },
  {
    href: "/tools/alpha-channel",
    navLabel: "Alpha channel tool",
    title: "Alpha channel tool",
    metaTitle: "Alpha Channel Tool — HEX8, RGBA & Opacity",
    description:
      "Add transparency to any color. Get HEX8, RGBA and percentage opacity values with a live preview on white, gray and black backgrounds. Free, browser-only.",
    blurb: "HEX8, RGBA & opacity from any color.",
    intro: [
      "Add transparency to any color and get the HEX8, RGBA and percentage opacity values at once, previewed on white, gray and black backgrounds. HEX8 extends a hex code with two alpha digits.",
      "Preview on multiple backgrounds catches contrast problems before they ship, because transparency reads differently depending on what sits beneath it.",
      "Prefer transparent colors over the opacity property when only part of an element should fade: opacity dims the element and everything inside it (including its text), while an rgba() background fades just the layer you point it at. That distinction is the difference between a readable glass card and washed-out text.",
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
      {
        q: "Does a transparent color keep its WCAG rating?",
        a: "No — a contrast ratio is only valid for the final blended color on a specific background. A 50% black overlay on white is effectively gray, so always measure the composited result (eyedropper the rendered pixel if you must) rather than the base color.",
      },
    ],
  },
  {
    href: "/tools/wcag-palette-checker",
    navLabel: "WCAG palette checker",
    title: "WCAG color palette checker",
    metaTitle: "WCAG Palette Checker — Contrast for All Pairs",
    description:
      "Check a whole color palette for WCAG contrast violations: every foreground/background pair in a matrix, failures spotted, fixes shown. Free, browser-only.",
    blurb: "Check full palettes for contrast issues.",
    intro: [
      "Check an entire color palette for WCAG contrast failures in one matrix view. Every foreground/background pair is graded for AA normal and large text, with failures flagged at a glance.",
      "Add as many colors as you need; the matrix scales automatically and makes obvious which combinations need fixing before you export.",
      "Run the check before you lock the palette, not after the UI is built: the cheapest fix for a failing pair is shifting the palette color one step darker or lighter while the scale is still fluid. Pairs that fail at normal text but pass at large text are still usable for headings and icons — the matrix tells you which is which so the decision is deliberate.",
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
      {
        q: "Does passing text contrast cover my whole UI?",
        a: "Not quite — WCAG also requires 3:1 for UI components and graphical objects (borders, input outlines, focus indicators, icons that carry meaning). A palette that passes for text usually covers these too, but check your border and focus colors explicitly; they are the most common silent failures.",
      },
    ],
  },
  {
    href: "/tools/typography-scale-generator",
    navLabel: "Typography scale generator",
    title: "Typography scale generator",
    metaTitle: "Typography Scale Generator — Modular",
    description:
      "Generate a modular type scale from a base size and ratio (1.2 / 1.25 / 1.333). Get px & rem sizes, line heights, CSS variables and a live preview.",
    blurb: "Modular type scale with live preview & CSS.",
    intro: [
      "Generate a modular type scale for a website from a base size and ratio — 1.2, 1.25 or 1.333 — with px and rem output, line heights, letter spacing, font pairings and CSS variables. Watch it live before you export.",
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
      {
        q: "How do I apply the scale to my website?",
        a: "Copy the generated CSS variables into your stylesheet, then reference them (e.g. font-size: var(--text-lg)) in your components. Because every step is a rem value derived from your base size, changing the base variable rescales the whole system.",
      },
    ],
  },
  {
    href: "/tools/svg-to-jpg",
    navLabel: "SVG to JPG",
    title: "SVG to JPG converter",
    metaTitle: "SVG to JPG Converter — Export at Any Scale",
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
    metaTitle: "JPG to SVG Converter — Raster to Vector",
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
  {
    href: "/tools/ai-palette-suggestion",
    navLabel: "AI palette suggestion",
    title: "AI palette suggestion",
    metaTitle: "AI Palette Suggestion — Palettes From a Description",
    description:
      "Describe your brand in words and get 5 smart palette options. Preview any suggestion in the design system generator. Free, no sign-up.",
    blurb: "Five palettes from a brand description.",
    // No intro paragraphs: the tagline above the tool plus the three usage
    // steps below it already say everything, and repeating the generator
    // handoff a fourth time made the page read like a chore. Other tools
    // keep their intros; this one does not need it.
    intro: [],
    category: "color",
    faqs: [
      {
        q: "How does the AI palette suggestion work?",
        a: "Type a brand description and keyword matching maps your words to hue families, then generates five palettes across different harmony strategies — complementary, analogous, triadic, split-complementary and monochromatic. No AI API key or account needed; the free tier allows 30 suggestions per minute.",
      },
      {
        q: "Is it really AI?",
        a: "It is a heuristic engine, not a large language model: brand keywords map to curated hue ranges and each suggestion pairs one with a fitting harmony strategy. The result is instant, deterministic and free — the same suggestions power the rate-limited API behind it.",
      },
      {
        q: "Is the AI palette suggestion free?",
        a: "Yes — free with no account required. Anonymous visitors get 30 suggestions per minute; signed-in Pro users get a higher limit.",
      },
    ],
  },
  {
    href: "/tools/llms-txt-generator",
    navLabel: "llms.txt generator",
    title: "llms.txt generator",
    metaTitle: "llms.txt Generator — AI Discovery Files",
    description:
      "Generate llms.txt and ai.txt files that tell Perplexity, ChatGPT, Gemini and Claude what your site is. Free, no sign-up.",
    blurb: "Machine-readable files AI search can cite.",
    // One paragraph only: the tagline covers the what, the usage steps
    // cover the how, and the FAQ covers the where. (See the AI palette
    // tool — same lesson learned.)
    intro: [
      "Upload both files to your site root: crawlers and AI search tools look for llms.txt and ai.txt next to robots.txt, and a site without them is read from markup alone.",
    ],
    category: "ai",
    faqs: [
      {
        q: "What is an llms.txt file?",
        a: "A markdown file at your site root that summarises what the site does and links its key pages in a machine-readable shape. AI search tools from Perplexity, ChatGPT, Gemini and Claude read it to understand and cite a site correctly.",
      },
      {
        q: "Where do I put the generated files?",
        a: "Upload llms.txt and ai.txt to your site's root directory — the same place robots.txt lives — so they are served at /llms.txt and /ai.txt. Link them from your robots.txt too.",
      },
      {
        q: "Is the llms.txt generator free?",
        a: "Yes — free with no account required. Everything runs in your browser; your site details are never uploaded.",
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
  ai: "AI visibility",
};

export function categoryLabel(category: ToolCategory): string {
  return CATEGORY_LABELS[category];
}