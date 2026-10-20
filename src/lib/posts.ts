import { TUTORIAL_POSTS_A } from "./posts-tutorials-a";
import { TUTORIAL_POSTS_B } from "./posts-tutorials-b";
import { TUTORIAL_POSTS_C } from "./posts-tutorials-c";

export interface PostSection {
  heading: string;
  /** Paragraphs / list items rendered under the heading. */
  body: string[];
  /** Support bullet points; plain strings or link items. */
  bullets?: (string | PostSectionLink)[];
  /** Info callout. */
  tip?: string;
  /** Optional code block rendered under the section. */
  code?: string;
  codeLang?: string;
  /** Optional CTA hyperlinks rendered as buttons under the section. */
  links?: PostSectionLink[];
  /** Optional inline image rendered at the top of the section. */
  image?: string;
  imageAlt?: string;
}

export interface PostSectionLink {
  /** Display text for the link. */
  label: string;
  href: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Optional hero image (SVG under /public). */
  image?: string;
  imageAlt?: string;
  metaTitle: string;
  description: string;
  /** Short card copy for the index. */
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  /** Tool pages this post links to internally. */
  relatedHrefs: string[];
  /** Keyphrase for the h1/title emphasis. */
  keyword: string;
  sections: PostSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
slug: "oklch-explained-for-frontend-developers",
    title: "OKLCH explained for frontend developers",
    metaTitle: "OKLCH for Developers — Channels & Scales",
    description:
      "What the L, C and H channels actually mean, why OKLCH is perceptually uniform, and where to use oklch() in real CSS — scales, mixing and shade generation.",
    excerpt:
      "Hue, chroma, lightness: what each OKLCH channel does, why the space is perceptually uniform, and how to read and write oklch() values in real CSS.",
    publishedAt: "2026-10-12",
    category: "Color scales",
    tags: ["oklch", "css color", "color space", "tailwind", "shadcn"],
    relatedHrefs: [
      "/tools/shade-generator",
      "/tools/color-converter",
      "/tools/shadcn-theme-generator",
    ],
    keyword: "oklch for developers",
    sections: [
      {
        heading: "The three channels, decoded",
        body: [
          "OKLCH is a cylindrical color space with three channels. L (lightness) runs 0 to 1 and is designed so that equal steps look like equal steps to the eye — the reason it beats HSL for anything graded. C (chroma) is how far the color sits from neutral gray, roughly 0 to 0.37 for sRGB colors. H (hue) is an angle in degrees, 0–360, the same mental model as HSL's hue.",
          "You read an oklch() value left to right: oklch(0.68 0.24 292) is 'lightness 68%, quite saturated, in the violet azimuth'. Because the channels are perceptual rather than derived from an RGB primary, a value communicates feel, not math — that is the entire point.",
        ],
      },
      {
        heading: "Why 'perceptually uniform' actually matters",
        body: [
          "Hex and RGB channels are hardware math: stepping red from 40 to 42 is measured in electricity, not in how the color feels. HSL is closer to human language, but its lightness curve is visibly non-linear — a gradient from hsl(240 100% 10%) to hsl(240 100% 40%) looks like it stops moving halfway through. OKLCH fixes that with a lightness axis matched to human perception.",
          "The practical consequence: a shade scale computed in OKLCH has evenly spaced steps, while the same scale computed in RGB has clumps of near-identical steps in the middle and abrupt jumps at the ends. That is exactly the difference you see between a hand-tuned brand scale and an auto-generated one.",
        ],
        tip: "Quick mental check to tell a perceptual space from a device space: in HSL, changing lightness and then converting back to hex usually keeps the hue recognisable; the failure shows up as uneven spacing, not wrong hues. ChromaBrew computes every scale and palette in OKLCH for this reason.",
        links: [
          { label: "Compare HEX, RGB, HSL and OKLCH side by side", href: "/tools/color-converter" },
        ],
      },
      {
        heading: "Where oklch() ships in CSS today",
        body: [
          "Every evergreen browser supports the oklch() and oklab() color functions, so you can write them directly in stylesheets. That makes OKLCH more than an authoring nicety — it is a publishable format, and Tailwind v4's default palette and shadcn/ui themes are written in it.",
          "The interesting reveal is how the two live sides of the toolchain shake out: ChromaBrew's full design-system export writes shadcn-style oklch() values into :root and .dark blocks, while its plain CSS and Tailwind exports keep literal hex per token. Both are deliberate — oklch keeps your theme readable and tweakable, hex keeps your output maximally interoperable.",
        ],
        code: `:root {
  --primary: oklch(0.62 0.22 292);
  --primary-foreground: oklch(0.99 0 0);
}
.dark {
  --primary: oklch(0.68 0.19 292);
}`,
        codeLang: "css",
        links: [
          { label: "Generate a shadcn theme with oklch values", href: "/tools/shadcn-theme-generator" },
        ],
      },
      {
        heading: "Generating scales in OKLCH",
        body: [
          "A 50–950 shade scale is built by walking OKLCH lightness between two anchors while keeping the hue. ChromaBrew's scale generator anchors the light end (50) at lightness 0.977 and the dark end (950) at 0.268, ramps chroma so the middle of the scale is most vivid, and clamps per-step by reducing chroma when a step would fall outside sRGB — never by bending the hue.",
          "The hue signal survives, which is what keeps the whole scale recognisable as 'the same color'. Two tools consume this directly: the shade & tint scale generator, and the Tailwind color generator, which exports the finished 11-step scale as a @theme block.",
        ],
        bullets: [
          "Lightness anchors: 50 → 0.977, 500 → 0.684, 950 → 0.268",
          "Chroma ramps up to 1.04× at 600, then decays toward the dark end",
          "Primary color is pinned at its nearest step with a source badge",
          "Tailwind v4 output uses --color-brand-50 … --color-brand-950 naming",
        ],
        links: [
          { label: "Generate a 50–950 scale from one color", href: "/tools/shade-generator" },
        ],
      },
      {
        heading: "Three rules for using OKLCH well",
        body: [
          "First, stop converting when you need to judge a relationship — read the L and C directly instead of the hex. Second, when you interpolate (mixing, gradients, color-mix()), do it in OKLCH so the midpoint lands where the eye expects it; mixing in RGB makes muddy mids. Third, remember chroma has a ceiling for a given hue in sRGB — the H stays, but very saturated colors clamp at the gamut boundary.",
        ],
      },
    ],
  },
  {
    slug: "wcag-contrast-ratio-math",
    title: "WCAG contrast ratios: the math behind the numbers",
    metaTitle: "WCAG Contrast Ratios — The Math Explained",
    description:
      "What a 4.5:1 ratio actually measures: relative luminance, the WCAG formula, and why large text gets 3:1. Understand the numbers instead of memorising them.",
    excerpt:
      "A contrast ratio is a single quotient between two relative-luminance values. Here's the exact WCAG math, the thresholds, and what the numbers can't tell you.",
    publishedAt: "2026-10-14",
    category: "Accessibility",
    tags: ["wcag", "contrast ratio", "accessibility", "relative luminance"],
    relatedHrefs: ["/tools/contrast-checker", "/tools/wcag-palette-checker"],
    keyword: "wcag contrast ratio",
    sections: [
      {
        heading: "A ratio is a quotient of two luminances",
        body: [
          "Every WCAG 2.x contrast figure is computed in three steps. First, convert the foreground and background colors to relative luminance — a number from 0 (black) to 1 (white) that weights how bright the channels look to human eyes. Then add the same constant, 0.05, to both values. Then divide the lighter value by the darker one.",
          "So 4.5:1 does not mean 'four and a half of something you can count'; it means the lighter color is 4.5 times as luminous, after a small tone-mapped floor. The floor is why pure black on pure white returns 21:1 — (1.0 + 0.05) ÷ (0.0 + 0.05) — and why two very dark colors can never score highly even if they feel distinct.",
        ],
        code: `function contrastRatio(hexFg, hexBg) {
  const L = (hex) => {
    const [r, g, b] = [0, 2, 4]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [L(hexFg), L(hexBg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}`,
        codeLang: "js",
      },
      {
        heading: "The four thresholds, and why large text is easier",
        body: [
          "WCAG defines two pass levels — AA and AAA — each with a normal-text and large-text bar. The numbers exist to be remembered, but the reason for 3:1 on large text is real: at 18.66px bold or 24px regular and up, glyph shapes fill more pixels, so the same luminance difference is easier to resolve. Small text at 4.5:1 buys the contrast that keeps dense paragraphs readable.",
          "The thresholds in practice: AA normal ≥ 4.5:1, AA large ≥ 3:1, AAA normal ≥ 7:1, AAA large ≥ 4.5:1. Notice AAA large reuses AA normal's number — the two scales are deliberately nested.",
        ],
        bullets: [
          "AA normal text ≥ 4.5:1 — the bar your body copy must clear",
          "AA large text ≥ 3:1 — buttons, headings, icons",
          "AAA normal text ≥ 7:1 — the ceiling most designers aim for on primary text",
          "AAA large text ≥ 4.5:1 — nested reuse of the small-text minimum",
        ],
        tip: "'Large text' means at least 24px regular, or at least 18.66px bold (19px). The WCAG definition uses the type size in CSS pixels, so it stays consistent across devices.",
        links: [
          { label: "Check any two colors against all four bars", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Contrast is lightness, not hue",
        body: [
          "Relative luminance has no hue information. Two colors can differ wildly in hue yet score a low ratio, which is why red-on-green pairing fails WCAG even though it 'feels' high contrast to a trichromat. Equally, desaturating a compliant pair — same lightness, less chroma — usually keeps it compliant, because luminance only barely depends on saturation in OKLCH.",
          "That asymmetry is also the algorithm's blind spot that a human review must catch: a ratio passes, but people with some color-vision deficiencies may still struggle to tell two hues apart when the ratio is carried mostly by hue, not lightness. The fix is never 'increase the ratio' until it stops looking good; the fix is to add a second cue, like a label, icon or pattern.",
        ],
      },
      {
        heading: "What the numbers can't tell you",
        body: [
          "A checker reports a single ratio and pass/fail state for one pair. A real interface is a matrix — every text token against every background it can sit on, in light and dark. Grading a whole palette pair-by-pair by hand is where errors hide: the body text passes on the app background and fails on one card surface.",
          "That is what the palette checker exists for: feed it the palette, and it grades every foreground/background combination against AA and stacks the results, so an accidental failure on one surface surfaces as a matrix cell instead of a review note. Pass the matrix, and the individual numbers stop being the job.",
        ],
        links: [
          { label: "Grade every pair in a palette at once", href: "/tools/wcag-palette-checker" },
        ],
      },
    ],
  },
  {
    slug: "tints-shades-and-tones-scale",
    title: "Tints, shades and tones: building a usable 9-step scale",
    metaTitle: "Tints, Shades & Tones — Build a 9-Step Scale",
    description:
      "Tint adds white, shade adds black, tone adds gray — in a naive space all three produce muddy or jumpy scales. Build a usable 9-step scale with even steps.",
    excerpt:
      "The classic definitions and why the naive mix-white/mix-black approach fails. Build a 9-step scale that is evenly spaced and actually matchable to UI roles.",
    publishedAt: "2026-10-16",
    category: "Color scales",
    tags: ["tints", "shades", "tones", "color scale", "oklch"],
    relatedHrefs: [
      "/tools/shade-generator",
      "/tools/tailwind-color-generator",
      "/tools/design-token-generator",
    ],
    keyword: "color scale",
    sections: [
      {
        heading: "The definitions, and why they're useful",
        body: [
          "A tint is a color mixed with white, a shade is a color mixed with black, and a tone is a color mixed with gray. The terms are old painting vocabulary, and they map cleanly onto a modern scale: tints live at the light end of your scale and carry surfaces, shades live at the dark end and carry emphasis, and tones are the workhorse mid-range where most UI colors land.",
          "The useful mental model is less 'three kinds of color' and more 'one hue explored along two axes': toward light, toward dark, and toward neutrality. That is precisely what a 50–950 scale is.",
        ],
      },
      {
        heading: "Why mixing with white and black fails",
        body: [
          "The naive recipe — blend your brand color toward #ffffff for a tint and toward #000000 for a shade — produces a broken scale. Mixing toward white lifts brightness but also erodes chroma fast: the 100 and 200 steps end up near-identical pastel grays. Mixing toward black drags everything toward a muddy brown-ish darkness for warm hues, because 'black' from a hex triplet is not neutral in hue terms.",
          "The giveaway is uneven spacing: a few steps look like duplicates, and one step jumps. In a perceptually uniform space like OKLCH, the fix is to walk lightness between fixed anchors while preserving the hue, and to modulate chroma with its own anchor curve — bright steps less saturated, the middle most vivid, dark steps more neutral again.",
        ],
        tip: "A scale generated in RGB/HSL wiggles; a scale generated in OKLCH glides. If your scale looks clumped in the middle, it was not interpolated perceptually.",
        links: [
          { label: "See a perceptually stepped 50–950 scale", href: "/tools/shade-generator" },
        ],
      },
      {
        heading: "The layout of a usable scale",
        body: [
          "The full 50–950 scale (eleven steps) is the raw material; most real design systems ship a usable subset of about nine. The light steps 50–300 read as tints: fills, hover surfaces, selected tags, input backgrounds. The middle 400–600 are your primary color and its neighbours. The dark steps 700–950 are shades: text-on-light is usually a 900 or 950, and 700–800 works for pressed states and strong borders.",
          "The most common usable pattern is 50, 100, 200, 300, 500, 600, 700, 800, 900 — dropping 400 and 950 — because a UI rarely needs a 950 text step (the 900 is dark enough) or a 400 between the surface tints and the primary. You keep the full scale in tokens; you just don't wire every step into components.",
        ],
        bullets: [
          "50–300: surface tints — fills, tags, highlight backgrounds",
          "500–600: the primary color itself and its closest working neighbours",
          "700–800: pressed states, strong borders, emphasis on light",
          "900–950: text and contrast-critical foregrounds",
          "Keep the full scale in tokens; wire only the subset into components",
        ],
        links: [
          { label: "Export the finished scale as Tailwind tokens", href: "/tools/tailwind-color-generator" },
          { label: "Ship the scale as DTCG-style design tokens", href: "/tools/design-token-generator" },
        ],
      },
      {
        heading: "Names should describe the job, not the recipe",
        body: [
          "70 is a step number, not a role. The same scale serves three different names in code: the primitive brand-brand-70, the semantic surface/foreground/primary tokens that components actually reference, and the Tailwind utilities --color-brand-*. Keeping the three layers separate is what lets you retheme a product without touching components.",
          "That separation is the difference between a scale that decorates a stylesheet and a scale that scaffolds a design system.",
        ],
      },
    ],
  },
  {
    slug: "hover-active-and-disabled-color-states",
    title: "Hover, active, disabled: deriving interactive states from a scale",
    metaTitle: "Hover, Active & Disabled States in a Scale",
    description:
      "Interactive states are lightness moves within a derived scale — not new hues. Derive hover, active, focus and disabled from one primary scale, accessibly.",
    excerpt:
      "Washed-out greys, arbitrary darkening, 50% opacity everywhere: interactive states are easy to get wrong. Derive hover, active and focus from the scale instead.",
    publishedAt: "2026-10-19",
    category: "Color scales",
    tags: ["hover", "active", "disabled", "interactive states", "color tokens"],
    relatedHrefs: [
      "/design-system",
      "/tools/shade-generator",
      "/tools/contrast-checker",
    ],
    keyword: "hover active states color",
    sections: [
      {
        heading: "States are the same hue, moved in lightness",
        body: [
          "A control in its default, hover, active and focus states should be unmistakably the same control. That reads best when the states are lightness moves within one scale: the default sits on the 600 step, hover steps to 700, and active (pressed) steps one further to 800. The hue never changes, so the eye tracks the element instead of reassessing it.",
          "In dark mode the same logic inverts — surfaces move lighter, not darker, so hover shifts the primary toward a lighter 500 and active back toward 600. Deriving both directions from one scale is how paired light/dark themes stay siblings.",
        ],
      },
      {
        heading: "How a generator derives hover and active",
        body: [
          "In ChromaBrew's design system, hover and active variants are computed from the primary by lightness math in OKLCH, not by guessing percentages. The primary keeps its hue, the state token just relocates it on the lightness axis — so a primary of #6d28d9 yields a primary-hover and primary-active that are visibly more and more 'pressed' while staying the same color family.",
          "The focus ring is a distinct consideration: it is a visibility cue, not a state change, and for default light themes it aliases to the primary color itself. Focus-visible styling is about location — a high-chroma ring around the element — so it intentionally reuses the strongest chroma in the scale rather than inventing a new one.",
        ],
        code: `@layer base {
  .btn {
    background: var(--primary);
  }
  .btn:hover:not(:disabled) {
    background: var(--primary-hover);
  }
  .btn:active:not(:disabled) {
    background: var(--primary-active);
  }
  .btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
}`,
        codeLang: "css",
        links: [
          { label: "Generate light & dark themes with derived states", href: "/design-system" },
        ],
      },
      {
        heading: "Disabled is a design decision, not a sign-off",
        body: [
          "Disabled is the only state with a strict requirement — it must not look interactive — but no WCAG ratio at it. The convention is reduced contrast plus desaturation: pull the control toward a neutral gray with enough lightness separation from the background that it reads as 'not available', while never colliding with a variant that still means something. In practice that means using a low-chroma step of the scale rather than lowering opacity, because 50% opacity over content produces unpredictable composites.",
          "Because ChromaBrew's token set ends at the interactive states, disabled is the one you author: take the button background, desaturate it in OKLCH (chroma toward zero), lighten it a step, and you get a safe default. Opacity-down-to-0.5 is the shortcut that ships the composite-color bug.",
        ],
        tip: "If a disabled element needs to keep readability — like a muted list item with text — test the pair in the contrast checker anyway; some 'grayed out' tokens drop below 3:1 and disappear for low-vision users.",
        links: [
          { label: "Verify a disabled token pair against WCAG", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "The scale-first rule",
        body: [
          "Every state should be addressable as a named token (primary-hover, primary-active, focus-ring) that resolves to a step of the primary scale. When a token is a derived step instead of an eyeballed hex, global retheming works, dark mode sits for free, and a one-color seed produces a self-consistent interactive system.",
        ],
      },
    ],
  },
  {
    slug: "design-tokens-and-the-w3c-spec",
    title: "Design tokens and the W3C spec, in practice",
    metaTitle: "Design Tokens & the W3C Spec, in Practice",
    description:
      "Primitives vs semantic tokens, the W3C Design Tokens (DTCG) JSON format, naming conventions, and how to export a system as interoperable token files.",
    excerpt:
      "The W3C Design Tokens (DTCG) format is the interchange standard your tokens should speak. Here's the JSON shape, the naming, and how to export it.",
    publishedAt: "2026-10-22",
    category: "Design systems",
    tags: ["design tokens", "dtcg", "w3c", "css variables", "json"],
    relatedHrefs: ["/tools/design-token-generator", "/design-system"],
    keyword: "design tokens",
    sections: [
      {
        heading: "Two layers: primitives and semantics",
        body: [
          "Design tokens split into primitives and semantic tokens. Primitives are the raw material — a brand scale, a type-size ramp, a radius set — named after what they are (brand.500, font-size.base). Semantic tokens are the decisions components consume — background, foreground, primary, border-muted — named after the job. Components reference semantics; semantics reference primitives; only the semantic layer changes when you retheme.",
          "This layering is what the W3C Design Tokens (DTCG) format encodes. The spec is a community standard for describing tokens as JSON so tools can interchange them: Tokens Studio, Style Dictionary, container queries and hand-rolled pipelines all read the same $type/$value shape.",
        ],
      },
      {
        heading: "The JSON shape you'll actually see",
        body: [
          "The core of the format is a nested JSON object where each leaf token carries a $type and a $value, with an optional $description. A color primitive looks like {\"$type\": \"color\", \"$value\": \"#6d28d9\"}; a dimension like {\"$type\": \"dimension\", \"$value\": \"0.5rem\"}. Composite types like typography and shadow bundle sub-properties under one token.",
          "ChromaBrew's design token generator emits exactly this shape — DTCG-style JSON with $type, $value and $description on every token — covering colors, typography, spacing, radius and shadows for both light and dark, so the file is a complete quiet description of the system with no CSS attached.",
        ],
        code: `{
  "$description": "Aurora design tokens — generated by ChromaBrew",
  "primitive": {
    "color": {
      "brand": {
        "500": { "$type": "color", "$value": "#6d28d9" }
      }
    }
  },
  "semantic": {
    "light": {
      "primary": { "$type": "color", "$value": "#6d28d9" },
      "background": { "$type": "color", "$value": "#fdfcff" }
    }
  }
}`,
        codeLang: "json",
        links: [
          { label: "Export a single-color system as DTCG JSON", href: "/tools/design-token-generator" },
        ],
      },
      {
        heading: "Aliasing is where the power lives",
        body: [
          "The DTCG format's killer feature is aliasing: a semantic token can $value-refer a primitive instead of repeating its hex. Then changing the brand scale updates every consumer through one indirection. The format supports it cleanly, though in practice generated files often write literal values so the JSON is readable without a reference resolver.",
          "If your pipeline consumes tokens with a reference engine (Style Dictionary, Tokens Studio), alias-aware files are the goal. If you export for humans with a text editor, literal values are the safer default. What matters is the schema staying spec-shaped so either pipeline can ingest it.",
        ],
        tip: "Name tokens by role, not by value: primary, not purple-600. When you rename a semantic token, the components behave identically — the color swap happens one layer down.",
      },
      {
        heading: "The W3C export in the design system",
        body: [
          "The full design system generator carries a dedicated W3C Design Tokens export alongside its CSS, Tailwind and shadcn ones. It flattens the whole generated system — semantic tokens for light and dark, typography, spacing, radius — into a design-tokens-w3c.json that matches the interchange shape, and a bundle export packages it with a README for handoff across tools.",
          "The pattern is: CSS variables for the running site, DTCG JSON for the token pipeline, and both generated from the same system so they can never drift.",
        ],
        links: [
          { label: "Generate the full system with a W3C export", href: "/design-system" },
        ],
      },
    ],
  },
  {
    slug: "monochromatic-palette-without-flat",
    title: "Monochromatic palettes that don't look flat",
    metaTitle: "Monochromatic Palettes That Don't Look Flat",
    description:
      "A monochrome palette is not just lightness steps of one hue. Use chroma variation, a lighter tint and a deeper shade to keep a one-hue palette feeling rich.",
    excerpt:
      "One hue, five swatches, monotonous result. The difference between flat and rich monochrome is chroma — here's how to vary saturation inside a single-hue palette.",
    publishedAt: "2026-10-26",
    category: "Palette generation",
    tags: ["monochromatic", "palette", "chroma", "oklch"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/shade-generator"],
    keyword: "monochromatic palette",
    sections: [
      {
        heading: "Why one-hue palettes go flat",
        body: [
          "A monochromatic palette is the same hue at different lightness levels. The flat failure happens when 'different lightness' is implemented as pure brightness stripping: the tint turns into a faded pastel, the shade turns into a blackened version, and every swatch reads as 'washed brand color'. Nothing has a point of view because no step has its own character.",
          "The cure is a second axis. A mono palette that works varies chroma as well as lightness — the deep shade stays saturated enough to feel intense, the tint keeps enough of the hue to feel intentional rather than transparent, and the middle is where the hue sings at full strength.",
        ],
      },
      {
        heading: "The chroma curve inside a mono palette",
        body: [
          "Chroma is how far a color sits from pure gray. In a good monochrome, chroma is not constant: the lightest step drops chroma so it reads as a surface tint, the darkest step rises chroma so it reads as depth rather than black, and the anchor hue sits at peak chroma. The result is a palette with a light neutral-ish member, a vivid anchor, and a saturated dark member — three characters from one hue.",
          "ChromaBrew's monochromatic strategy encodes exactly that curve. With one hue in play, the strategy modulates chroma (roughly 0.85× at the tint, 1.05× at the shade) and lightness (≈ +0.14 and −0.14 around the anchor), and if an intermediate swatch would collapse into a duplicate of the primary, it nudges the chroma further apart so every step stays distinct.",
        ],
        bullets: [
          "Tint: higher lightness, reduced chroma — the surface role",
          "Anchor: peak chroma — the brand color itself",
          "Shade: lower lightness, higher chroma — depth and emphasis",
          "Every step stays the same hue; only L and C move",
        ],
        links: [
          { label: "Generate a five-swatch monochrome from one color", href: "/tools/color-palette-generator" },
        ],
      },
      {
        heading: "Give the space a monochrome palette lives in",
        body: [
          "Monochrome reads dramatically on the right scaffolding: generous white space, strong type and a grayscale-neutral surface stack. The palette contributes warmth at one point — an accent, an interaction, a hero — rather than being the background. Ninety percent gray, ten percent hue is the secret to a mono palette that looks expensive instead of flat.",
          "Pair the mono scale with a neutral scale (pure grays or grays tinted toward the palette's temperature) and let the single hue do the talking only where the interface is making a statement.",
        ],
        tip: "If a single swatch looks dead against your neutrals, the fix is usually chroma, not hue — raise the saturated dark step rather than hunting for a 'close but different' color.",
        links: [
          { label: "Get the 50–950 steps for one hue", href: "/tools/shade-generator" },
        ],
      },
    ],
  },
  {
    slug: "accessible-gradients-contrast",
    title: "Accessible gradients: contrast rules for real interfaces",
    metaTitle: "Accessible Gradients - Contrast Rules for Real Interfaces",
    description:
      "WCAG has no gradient formula, so text over a gradient needs a strategy: check the worst stop, lay a scrim, keep button labels on a solid band, and always provide a fallback color.",
    excerpt:
      "Gradients break every contrast shortcut because their background is a range, not a color. Test the worst stop, use scrims, and keep controls honest.",
    publishedAt: "2026-10-29",
    category: "Accessibility",
    tags: ["gradient", "contrast", "accessibility", "css"],
    relatedHrefs: [
      "/tools/css-gradient-generator",
      "/tools/contrast-checker",
      "/tools/color-mixer",
    ],
    keyword: "gradient contrast",
    sections: [
      {
        heading: "There is no WCAG gradient algorithm",
        body: [
          "Contrast ratios are defined between two solid colors, and a gradient is a continuum. The spec gives no single number, so the correct approach is to treat the range as a worst-case problem: the text must pass against the least favourable stop it crosses. If a label sits on a gradient, the stop with the closest luminance to the text decides whether the pair ships.",
          "That one rule explains most gradient accessibility failures: a headline passes on the bright half and dies over the saturated dark half of the same banner.",
        ],
        tip: "Extract the gradient's extreme stops and test text against the darkest (for light text) and lightest (for dark text). If the worst stop fails, the gradient fails.",
        links: [
          { label: "Grade the worst two stops against your text", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Scrims: gradient is on the background, not the text",
        body: [
          "The most reliable pattern for text over imagery or wide gradients is a scrim — a translucent gradient layer between the art and the text. You control the text/background relationship by the scrim's opacity and direction (dark at the bottom where the label sits, fading to transparent above). The text then grades against a raised dark band rather than a moving target.",
          "The same trick works for button labels: instead of hoping the brand shimmer covers contrast, give the control a solid label token on top and let the gradient live in the fill. The label runs against a uniform swatch, and the gradient is decoration the ratio never sees.",
        ],
        code: `.hero {
  background:
    linear-gradient(to top, rgba(10, 8, 20, 0.82), rgba(10, 8, 20, 0) 60%);
}
.hero__title {
  /* light text now sits on a near-solid dark band */
  color: oklch(0.97 0 0);
}`,
        codeLang: "css",
        links: [
          { label: "Build a scrim as a layered CSS gradient", href: "/tools/css-gradient-generator" },
        ],
      },
      {
        heading: "Always ship a solid fallback",
        body: [
          "Gradients are progressive enhancement. Before the gradient rule, declare a solid background using the gradient's dominant or darkest color — browsers that support it paint over the fallback, older ones still get a readable base. The fallback rule comes first so the cascade does the upgrade.",
          "A two-line rule costs nothing and removes the entire class of 'empty background' failures in legacy environments.",
        ],
        code: `.hero {
  background: #13101e; /* fallback for no-gradient engines */
  background: linear-gradient(135deg, #6d28d9, #13101e);
}`,
        codeLang: "css",
      },
      {
        heading: "Keep interactive gradients honest",
        body: [
          "A gradient button behind text is a contrast bug waiting to land. The safest pattern is a flat fill for the control itself and gradient reserved for decorative areas with no text dependency — or a gradient fill whose endpoints both pass the label's ratio. When you do want a lively button, check both endpoints and the midpoint separately, because hue rotation mid-gradient can drop chroma and eat contrast in the middle.",
        ],
        links: [
          { label: "See how gradient endpoints blend in OKLCH", href: "/tools/color-mixer" },
        ],
      },
    ],
  },
  {
    slug: "brand-color-to-design-system-worked-example",
    title: "From brand color to full design system: a worked example",
    metaTitle: "Brand Color to a Full Design System - Worked Example",
    description:
      "A real 50–950 scale, a five-hue palette, light/dark tokens and the contrast results all derived from one seed color, #6d28d9 — with the exact hex values.",
    excerpt:
      "One seed color, a complete system. Watch #6d28d9 become an 11-step scale, a five-hue palette, light and dark token sets and a passing contrast matrix.",
    publishedAt: "2026-11-02",
    category: "Design systems",
    tags: ["design system", "worked example", "tokens", "contrast", "palette"],
    relatedHrefs: [
      "/design-system",
      "/tools/shade-generator",
      "/tools/color-palette-generator",
    ],
    keyword: "design system worked example",
    sections: [
      {
        heading: "The seed: #6d28d9",
        body: [
          "The worked example starts with a single violet: #6d28d9. In OKLCH that resolves to a lightness of about 0.49, a chroma around 0.24 and a hue near 292°. Every value in this breakdown is what ChromaBrew actually generates from that one input with no manual tuning — you can reproduce the whole walk on the design system page and see identical hexes.",
          "The pipeline has five stages: an 11-step scale, a harmony palette, semantic tokens, paired light/dark themes, and an accessibility matrix. Each stage consumes the previous one.",
        ],
      },
      {
        heading: "Stage 1 — the 50–950 scale",
        body: [
          "The scale generator walks OKLCH lightness from 0.977 at step 50 down to 0.268 at step 950 while keeping the hue, producing the eleven steps. The source color sits at 700 (the generator's representative step), which is slightly dark of middle — the seed is a strong but not neon violet. The exact scale: 50 #f7f6ff, 100 #edeaff, 200 #dfd9ff, 300 #cdc3ff, 400 #b5a2ff, 500 #9f7fff, 600 #8c56ff, 700 #6d28d9, 800 #5e1dbe, 900 #49079a, 950 #2d0066.",
          "Notice the chroma curve: the tints (50–300) are pale but stay cool-violet rather than going grey, and the darks (800–950) stay saturated enough that 950 at #2d0066 is clearly indigo, not black.",
        ],
        code: `:root {
  --brand-50:  #f7f6ff;
  --brand-100: #edeaff;
  --brand-200: #dfd9ff;
  --brand-500: #9f7fff;
  --brand-600: #8c56ff;
  --brand-700: #6d28d9;
  --brand-800: #5e1dbe;
  --brand-900: #49079a;
  --brand-950: #2d0066;
}`,
        codeLang: "css",
        links: [
          { label: "Regenerate this exact scale", href: "/tools/shade-generator" },
        ],
      },
      {
        heading: "Stage 2 — the harmony palette",
        body: [
          "With a five-swatch analogous strategy, the seed drives a small family: the primary at #6d28d9, a cool neighbour at #004be4, a warm neighbour at #9900ab, then lighter variants at #276cff and #864cf9. Analogous strategy keeps the palette calm and recognisably related — good for a brand system where complementary shock would fight the violet.",
          "When secondary and accent aren't chosen explicitly, the engine derives them by role rather than borrowing from that strip: both land on split-complement offsets from the primary, so this violet gets a deep bronze supporting colour at #463100 and a vivid green accent at #008e02 — clearly distinct from the primary and from each other. The theme step then adapts each per mode for contrast, which is why the light secondary token resolves to #422e00 rather than repeating the seed verbatim.",
        ],
        links: [
          { label: "Compare palette strategies on the same seed", href: "/tools/color-palette-generator" },
        ],
      },
      {
        heading: "Stage 3 and 4 — semantic tokens in light and dark",
        body: [
          "Each mode derives 31 semantic tokens from the scale and palette. In light mode, the background resolves to #fdfcff (near-white with a violet breath), the surface to #fdfdff, foreground text to #13101e, and the primary button to #6d28d9 with a white label. Hover and active darken in-step: #6311cb then #5700b8, same hue, deeper value.",
          "Dark mode inverts both luminosity and approach: the background drops to #0b0a0f, the primary lifts to #8c56ff (a lighter, brighter violet reads better on near-black), and its label flips to dark #0e0d14. The dark theme's primary-hover moves *lighter* (#9871ff) — the same pressed-direction rule, reversed for mode.",
        ],
        bullets: [
          "Light: background #fdfcff · surface #fdfdff · foreground #13101e",
          "Light: primary #6d28d9 → hover #6311cb → active #5700b8",
          "Dark: background #0b0a0f · surface #15141a · foreground #edebf6",
          "Dark: primary #8c56ff → hover #9871ff → active #844bf4",
          "Status: success #2b9338 light / #6bc670 dark · danger #c94c49 / #ff847d",
        ],
        links: [
          { label: "Generate the full system from this seed", href: "/design-system" },
        ],
      },
      {
        heading: "Stage 5 — the contrast matrix",
        body: [
          "The generator grades ten key pairings in each mode against WCAG: body text, muted text, card text, primary/secondary buttons, accent element and the four status badges. For this violet seed, all twenty checks pass AA. Body text scores 18.33:1 in light and 16.73:1 in dark; the primary button label lands 7.10:1 in light (better than AAA normal) and 4.50:1 in dark — comfortably AA, exactly at the cusp before AAA.",
          "The interesting non-obvious result is the accent element in light mode at 5.27:1 — it passes AA but not AAA, because the green fill #007e01 sits close enough to its label. That's a deliberate, surfaced trade-off: accents are allowed to be visually louder than body text, and the matrix records the consequence rather than hiding it. The deep secondary, meanwhile, clears AAA at 12.94:1.",
        ],
        bullets: [
          "Body text / background: 18.33:1 light · 16.73:1 dark",
          "Muted text / background: 8.16:1 light · 7.90:1 dark",
          "Primary button: 7.10:1 light · 4.50:1 dark",
          "Secondary button: 12.94:1 light (AAA) · Accent element: 5.27:1 light (AA, not AAA) — an accepted trade-off",
          "Result: 20/20 pairings pass AA",
        ],
        links: [
          { label: "Check the matrix in the accessibility panel", href: "/design-system" },
        ],
      },
    ],
  },
  {
    slug: "export-design-system-tailwind-shadcn-css",
    title: "Exporting design systems to Tailwind, shadcn and CSS variables",
    metaTitle: "Export Design Systems to Tailwind, shadcn & CSS Variables",
    description:
      "The same generated system as Tailwind v4 @theme, a shadcn/ui oklch stylesheet, DTCG JSON and plain CSS variables — and when to reach for each export.",
    excerpt:
      "One system, four dialects. How the design-system export produces Tailwind v4, shadcn/ui, CSS variables and W3C token files from the same colors.",
    publishedAt: "2026-11-05",
    category: "Design systems",
    tags: ["tailwind", "shadcn", "css variables", "export", "design tokens"],
    relatedHrefs: [
      "/design-system",
      "/tools/tailwind-color-generator",
      "/tools/shadcn-theme-generator",
      "/tools/design-token-generator",
    ],
    keyword: "export design system",
    sections: [
      {
        heading: "One system, four dialects",
        body: [
          "The full design system generator ships its generated system through several export adapters, and they are not interchangeable ways of saying the same thing — each targets a consumer. CSS variables are the runtime contract for a hand-rolled stylesheet; Tailwind v4 maps tokens into the @theme namespace; shadcn/ui writes a drop-in oklch stylesheet for that component library; W3C tokens hand the whole system to a token pipeline.",
          "The key guarantee is that every dialect is generated from the same in-memory system — the export never re-derives colors, so hex, oklch and token files can't drift out of sync.",
        ],
      },
      {
        heading: "Tailwind v4: @theme and a dark variant",
        body: [
          "The Tailwind export produces a complete theme file: it registers a .dark custom variant, then maps every semantic token into :root and .dark blocks, then wires them into @theme inline so utilities like bg-background and text-primary resolve to the tokens. The brand 50–950 scale lands as --color-brand-* inside the same @theme block, plus the type scale, radius and shadows as their own namespaces.",
          "Spacing is deliberately left at Tailwind defaults so the file composes with the framework instead of fighting it. The single standalone Tailwind color generator produces the plain @theme scale block if all you need is the 11-step brand scale without the system.",
        ],
        code: `@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: #fdfcff;
  --foreground: #13101e;
  --primary: #6d28d9;
}
.dark {
  --background: #0b0a0f;
  --foreground: #edebf6;
  --primary: #8c56ff;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-brand-500: #9f7fff;
}`,
        codeLang: "css",
        links: [
          { label: "Export the standalone scale as @theme", href: "/tools/tailwind-color-generator" },
        ],
      },
      {
        heading: "shadcn/ui: the oklch stylesheet",
        body: [
          "The shadcn export writes the theme in the exact dialect that library expects: :root and .dark blocks, variable names covering card, popover, secondary, muted, accent, destructive, border, input, ring and the sidebar tokens, all as oklch() values. It fills chart-1 through chart-5 from the palette, and sets the canonical --radius: 0.625rem so component radii stay in family.",
          "Because shadcn themes are oklch-native, this export is where the 'same system, different formats' payoff is most visible: the identical color is spelled oklch(0.62 0.22 292) here and #6d28d9 in the CSS export — two correct spellings of one decision.",
        ],
        code: `:root {
  --background: oklch(0.993 0.004 301.4);
  --foreground: oklch(0.184 0.028 293.2);
  --primary: oklch(0.491 0.241 292.6);
  --primary-foreground: oklch(1 0 0);
  --radius: 0.625rem;
}
.dark {
  --background: oklch(0.149 0.011 294.2);
  --foreground: oklch(0.945 0.015 294.5);
  --primary: oklch(0.605 0.237 292.6);
}`,
        codeLang: "css",
        links: [
          { label: "Generate the standalone shadcn theme", href: "/tools/shadcn-theme-generator" },
        ],
      },
      {
        heading: "CSS variables and W3C tokens, when to reach for them",
        body: [
          "Plain CSS variables are the most boring, most interoperable export: a :root/.dark pair of semantic tokens matching your component layer's expected names. Reach for them when you own the styling and want zero framework assumptions. DTCG/W3C JSON is the opposite pole — it carries no CSS at all, just $type/$value/$description data for token tooling, and a bundle export wraps the W3C file with a README for handoff.",
          "A tidy workflow many teams land on: W3C tokens in the pipeline as source of truth, CSS variables in the running site, and Tailwind/shadcn exports wherever a framework needs the same decisions in its own dialect.",
        ],
        links: [
          { label: "Generate the DTCG token file", href: "/tools/design-token-generator" },
        ],
      },
    ],
  },
  {
    slug: "designing-for-color-blindness-in-practice",
    title: "Designing for color blindness in practice",
    metaTitle: "Designing for Color Blindness - Practice Guide",
    description:
      "From one-color signals to chart palettes that survive deutan and protan simulation: redundancy, the simulation workflow, and eight conditions worth testing against.",
    excerpt:
      "Roughly 8% of men are color vision deficient. Design so meaning never depends on hue alone — then prove it with simulation across eight conditions.",
    publishedAt: "2026-11-08",
    category: "Accessibility",
    tags: ["color blindness", "cvd", "accessibility", "charts", "simulation"],
    relatedHrefs: [
      "/tools/color-blindness-simulator",
      "/tools/wcag-palette-checker",
      "/tools/contrast-checker",
    ],
    keyword: "color blindness design",
    sections: [
      {
        heading: "Design as if hue were not the first language",
        body: [
          "The central rule of color-blind-friendly design is redundancy: color never carries meaning alone. Every color-coded state should have a second cue — a label, an icon, a pattern, a position — so the information survives any color-vision condition. Traffic lights work because position, not color, is the primary signal; error states work because the icon tells the story before the red does.",
          "For roughly 8% of men and a smaller share of women, 'which swatch is danger?' is not a fast question to answer from hue. Pages that feel instant to a trichromat become guesswork without the second cue.",
        ],
      },
      {
        heading: "The eight conditions worth testing",
        body: [
          "Color-vision deficiency is not one thing. The design-critical set splits into full forms — protanopia (no red cones, ≈1.3% of men), deuteranopia (no green cones, ≈1.2%), tritanopia (no blue, ≈0.01%), and achromatopsia (total, ≈0.003%) — and the much more common milder anomalies: deuteranomaly (≈4.6% of men), protanomaly (≈1%), tritanomaly. Total color blindness is vanishingly rare, but it is the perfect stress test: if a design reads in grayscale, every less-severe form is covered.",
          "The simulator runs colors and uploaded images through all of these using the Machado et al. deficiency matrices, showing the same UI under each condition side by side with the original. That visual diff is the fastest way to learn which of your pairs rely on hue.",
        ],
        bullets: [
          "Protanopia, deuteranopia, tritanopia — the full forms; design against these first",
          "Protanomaly (≈1% of men), deuteranomaly (≈4.6%), tritanomaly — the milder, common anomalies",
          "Achromatopsia ≈0.003% — the grayscale test, and the strictest one of all",
          "If the grayscale version works, every colored version below it in severity works too",
        ],
        links: [
          { label: "Preview colors & images under all eight conditions", href: "/tools/color-blindness-simulator" },
        ],
      },
      {
        heading: "Chart palettes that survive simulation",
        body: [
          "Charts are where color-dependence is most concentrated: series distinguished only by hue. The discipline is to pick series colors that stay distinguishable after simulation — two series that differ solely in red/green land in the same grey after deutan simulation. The practical recipe: choose hues spread far enough apart that luminance differs too, not just hue; verify each pair in the simulator; and treat the red-green axis as the highest-risk one in any palette.",
          "A common safety move is ordering series by a second dimension anyway — dashboards that also vary dash patterns or glyph shapes never require hue to disambiguate.",
        ],
        tip: "Grade whole palettes at once: run the palette through the checker and inspect every pair as a matrix. Pairs that fail become the candidates to re-hue or to re-support with a non-color cue.",
        links: [
          { label: "Grade every pair in your chart palette", href: "/tools/wcag-palette-checker" },
        ],
      },
      {
        heading: "Contrast and CVD are different problems",
        body: [
          "It is worth keeping two checks separate. WCAG contrast is computed from relative luminance and says nothing about hue; it protects low-vision users. Colour distinctness protects CVD users and depends on hue/chroma separation after simulation. A pair can pass 4.5:1 and still be hard to tell apart for a deutan, and a pair that survives simulation can still fail contrast for shaded text.",
          "Run both checks, from different tools, and treat each as its own requirement. One color decision, two verifications: contrast for readability, simulation for distinguishability.",
        ],
        links: [
          { label: "Check contrast for the text side", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "saas-dashboard-color-palette",
    title: "How to build a color palette for a SaaS dashboard",
    metaTitle: "SaaS Dashboard Palette — Roles & Contrast",
    description:
      "A walkthrough for building a SaaS dashboard color palette: surface stack, semantic roles, status colors, chart palettes and WCAG checks — from one color.",
    excerpt:
      "Dashboards stress-test color harder than any other UI. Here's how to build a SaaS palette that survives dense data, status colors and dark mode.",
    publishedAt: "2026-10-09",
    category: "Design systems",
    tags: ["saas", "dashboard", "color palette", "design tokens", "data visualization"],
    relatedHrefs: [
      "/design-system",
      "/tools/color-palette-generator",
      "/tools/wcag-palette-checker",
      "/tools/dark-mode-generator",
    ],
    keyword: "SaaS dashboard color palette",
    sections: [
      {
        heading: "Why dashboards are the hardest test for a palette",
        body: [
          "A marketing page gets three colors and a gradient. A dashboard gets twenty surfaces, four chart series, five status states, disabled everything, and a sidebar — all visible at once, all day. A palette that looks great in a hero section collapses under that load: two 'neutral' grays fight each other in adjacent panels, the warning yellow vibrates against a tinted background, and the primary blue appears in four roles with no hierarchy.",
          "The fix is not more colors. It is fewer colors with explicit jobs. A dashboard palette works when every value is a derived step or a named role — never a swatch someone liked in isolation. That discipline is what the rest of this guide builds.",
        ],
        tip: "Count the roles, not the colors. Most SaaS dashboards run on one brand hue, one status set (success/warning/danger/info), and a neutral surface stack — usually under 20 values total once tints are derived.",
      },
      {
        heading: "Start with the surface stack, not the brand color",
        body: [
          "Start where users spend their time: the background stack. A dashboard typically needs four to five neutral layers — app background, card surface, raised surface (popovers, dropdowns), sidebar, and input fills. Each step should be distinguishable at a glance but never louder than the content on top of it.",
          "Build the stack as a cool or warm neutral scale rather than pure grey. Pure #808080 grey reads as dead next to a brand hue; a neutral nudged toward your brand's temperature makes the whole product feel intentional. In light mode the stack climbs from near-white to mid-grey; in dark mode it inverts in elevation logic — raised surfaces get lighter, not darker.",
        ],
        bullets: [
          "App background: the quietest layer — tinted white in light mode, tinted near-black in dark mode",
          "Card surface: one step up from the background; the difference should be felt, not scrutinized",
          "Raised surface: popovers, menus, tooltips — lighter than cards in dark mode",
          "Borders: one step of separation; hairlines, never outlines",
          "Input fills: distinguishable from their container so fields read as fields",
        ],
        links: [
          { label: "Generate a neutral surface stack", href: "/tools/shade-generator" },
        ],
      },
      {
        heading: "Map the brand color to one clear role",
        body: [
          "The brand color's job on a dashboard is navigation and action: primary buttons, active nav items, links, focus rings, selected states. It is not the color of every icon and heading — that is how dashboards lose hierarchy.",
          "Derive a full 50–950 scale from your brand hue so each of those jobs gets its own step. Active nav might take the 600 step on a tinted 100 background; a primary button takes 600 with a 50-step label; hover darkens to 700. Because the steps come from one perceptual scale, they always look like siblings.",
        ],
        code: `:root {
  --brand-50:  #eef5ff;
  --brand-100: #dbe7ff;
  --brand-500: #3a86ff;
  --brand-600: #1f6cff;
  --brand-700: #0f53e0;
  --color-primary: var(--brand-600);
  --color-primary-hover: var(--brand-700);
}`,
        codeLang: "css",
        links: [
          { label: "Build the scale from your brand color", href: "/design-system" },
        ],
      },
      {
        heading: "Status colors are semantic, not decorative",
        body: [
          "Success, warning, danger and info appear in badges, toasts, chart series and inline validation — often simultaneously. Give each one a fixed semantic token and never reuse a status color for decoration, or the signal dilutes.",
          "Two constraints decide whether a status set works. First, each color needs a light-mode and dark-mode variant: a green that reads 'success' on white turns into sludge on a dark surface unless it is lightened and re-tuned. Second, any status color that carries text must pass contrast on its badge background — a pale green pill with white text is the classic failure.",
        ],
        bullets: [
          "Success: green family — passes contrast as text on a tinted badge",
          "Warning: amber family — the hardest to make accessible; darken for text, keep the bright step for icons only",
          "Danger: red family — strong at a glance, so keep usage rare to stay meaningful",
          "Info: blue family — must be visually distinct from your brand blue, or pick a different info hue entirely",
        ],
        links: [
          { label: "Check status pairs for WCAG", href: "/tools/wcag-palette-checker" },
        ],
      },
      {
        heading: "Chart colors: distinct beats beautiful",
        body: [
          "Dashboard charts need four to six categorical colors that are distinguishable at 12-pixel line widths and similar chroma levels. A palette where one series is neon and the rest are muted biases every reading of the chart.",
          "The reliable recipe: pick hues spread evenly around the wheel (analogous sets are too close for data), equalize lightness so no series dominates, and reserve the brand color for the one series that is 'yours' — typically the primary metric. Then check the set against color-blindness simulation; red/green pairs that pass casual inspection fail deuteranopia readers.",
        ],
        links: [
          { label: "Generate a six-hue chart set", href: "/tools/color-palette-generator" },
          { label: "Simulate color blindness", href: "/tools/color-blindness-simulator" },
        ],
      },
      {
        heading: "Dark mode is a second palette, not a filter",
        body: [
          "The most common dashboard dark-mode failure is applying an inversion filter and shipping. Dark mode needs its own tuned values: surfaces lighten with elevation, the brand hue desaturates slightly so it doesn't glow against dark backgrounds, and status colors shift lighter while keeping their hue identity.",
          "The dark theme should be generated from the same seed as the light theme so the two stay siblings — then graded by the same contrast rules. Text-on-surface pairs in dark mode often need more care than light mode, because the eye's sensitivity curve is different at low luminance.",
        ],
        links: [
          { label: "Generate the dark theme from your brand color", href: "/tools/dark-mode-generator" },
        ],
      },
      {
        heading: "The whole palette on one page",
        body: [
          "Pull the pieces together. One brand hue drives the primary scale; neutrals form the surface stack; status colors get semantic tokens; charts take a distinctness-checked set; dark mode is generated, not filtered. Every text/background pair passes WCAG AA before anything ships:",
        ],
        code: `:root {
  --background: #f7f8fa;
  --surface: #ffffff;
  --surface-raised: #ffffff;
  --border: #e2e5ea;
  --foreground: #16181d;
  --primary: #1f6cff;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --info: #0891b2;
}`,
        codeLang: "css",
        tip: "Save the system as a share link once it passes. The URL encodes the whole configuration — your future self (or a teammate) reopens the exact palette without an account or a Figma file.",
        links: [
          { label: "Generate the full dashboard palette", href: "/design-system" },
        ],
      },
    ],
  },
  {
    slug: "how-to-build-an-accessible-color-palette",
    title: "How to build an accessible color palette (2026 guide)",
    metaTitle: "Accessible Color Palette — WCAG AA/AAA Guide",
    description:
      "Build an accessible color palette from a single brand color: shades, tints, semantic roles and WCAG AA/AAA contrast checks — with a free generator.",
    excerpt:
      "Stop guessing at color combos. Here's how to turn one brand color into a full accessible palette that passes WCAG AA and AAA.",
    publishedAt: "2026-08-25",
    category: "Design systems",
    tags: ["accessibility", "wcag", "palette", "design tokens"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/contrast-checker", "/tools/wcag-palette-checker"],
    keyword: "accessible color palette",
    sections: [
      {
        heading: "Start with a single brand color",
        body: [
          "Every accessible palette starts in one place: a single seed color. A real example helps, so let's work one through. Say your brand is a blue — something like #3a86ff, a vivid mid-blue that reads as energetic without screaming neon. That single value is the anchor. Everything else in the palette gets derived from it.",
          "The temptation now is to hand-mix lighter and darker versions by pushing hex digits around. Resist it. Manually adding white to blue gives you a pastel that quickly turns to grey mush, and darkening by hand produces steps that look identical at one end and jump dramatically at the other. The eye doesn't perceive brightness linearly, so linear edits fail.",
          "What you actually want is a scale computed in a perceptually uniform space like OKLCH, where an equal step in lightness looks like an equal step to the eye. That's the trick that separates a palette that feels hand-crafted from one that looks like someone dragged a lightness slider with the curve off.",
        ],
        tip: "Sit the seed at its intended brightness rather than treating it as fixed. A too-dark blue leaves you almost nowhere to go for the 900 shade; a too-light one squashes your 50 tint into whitespace.",
      },
      {
        heading: "Generate a perceptual 50–950 scale",
        body: [
          "Design systems almost universally use an eleven-step scale, numbered 50 through 950. The base brand color sits at 500, tints climb up toward 50 (very light), and shades deepen down toward 950 (very dark).",
          "Why eleven steps? Each one maps to a practical job in a UI, and having all of them means you never reach for an arbitrary colour just because the scale ran out. Take the blue from above through a perceptually even generator and you get something like this:",
        ],
        bullets: [
          "50–200 (#eef5ff → #bcd9ff): light tints for backgrounds, hover fills and soft surfaces",
          "300–400 (#8fbaff → #5a9aff): accents, secondary icons, and mild emphasis",
          "500 (#3a86ff): the brand base — primary buttons, active links",
          "600–700 (#1f6cff → #0f53e0): hover and pressed states, and dark-on-light text",
          "800–950 (#0d3bb0 → #061a4d): strong text and high-contrast accents that pass AAA against white",
        ],
        tip: "Don't hand-edit these numbers. Let the space do the arithmetic. If a step looks off to you, it's usually the seed, not the scale.",
      },
      {
        heading: "Define semantic roles, not just swatches",
        body: [
          "A row of swatches is not a design system. It becomes one when each value gets a job. Map scale steps to semantic roles — background, foreground, primary, surface, border, muted — and let components reference the role instead of the raw colour.",
          "The payoff shows up the day you retheme. Swap the mapping behind --color-background and every surface in the app moves with it. If you'd hard-coded #ffffff in ten components, you'd be hunting through files for the rest of the week.",
          "Semantics also protect accessibility. When text always reads --color-foreground and never a literal shade, you can't accidentally push a low-contrast blue into a body paragraph. The system won't let you make the mistake.",
        ],
        tip: "Follow the convention of generic names (background, foreground, surface, primary) rather than brand-y ones. It keeps them portable across light and dark themes and across projects.",
      },
      {
        heading: "Check every foreground/background pair",
        body: [
          "Accessibility isn't a property of a single color — it's a relationship between a foreground and the background it sits on. A vibrant blue can be perfectly readable on white and completely unusable on a light tint of itself.",
          "The WCAG 2.x thresholds haven't changed in years and are worth keeping memorized: 4.5:1 for normal text at AA, 7:1 for normal text at AAA, and 3:1 for large text (18px+ bold, or 24px+) at AA. Text that fails these is literally harder to read for a huge share of users — aging eyes, low-light conditions, and people with low vision all suffer first.",
          "The failure you most often see in homegrown palettes is a link blue used as body text on a white background, passing by a hair, then reused as a button label on a tinted surface where it drops under 3:1. A palette checker that tests every foreground/background combination at once will surface these before they ship.",
        ],
        tip: "When a pair fails, resist desaturating it to grey. Adjust lightness along the OKLCH axis instead — you keep the brand hue and usually only need to nudge a step or two.",
      },
      {
        heading: "The one-click workflow",
        body: [
          "Pull it all together and the entire process collapses into a single action: pick a color, generate the accessible scale, map the semantic roles, then export as CSS variables or JSON tokens. No sign-up, nothing uploaded, everything runs in your browser tab.",
          "That's the workflow ChromaBrew is built around. If you've been assembling palettes by trial and error, this is the shortcut — the generator does the perceptually correct math, the checker does the WCAG math, and you just make the taste calls.",
        ],
      },
    ],
  },
  {
    slug: "hex-vs-hsl-vs-oklch",
    title: "HEX vs HSL vs OKLCH: which color space should you use?",
    metaTitle: "HEX vs HSL vs OKLCH — Which to Use",
    description:
      "HEX, HSL and OKLCH compared: how each color space works, when to reach for it, and why perceptually uniform OKLCH wins for design systems.",
    excerpt:
      "Three color spaces, three jobs. Here's what HEX, HSL and OKLCH actually are and when each earns its place.",
    publishedAt: "2026-08-21",
    category: "Color theory",
    tags: ["hex", "hsl", "oklch", "css", "design tokens"],
    relatedHrefs: ["/tools/color-converter", "/tools/contrast-checker", "/tools/design-token-generator"],
    keyword: "HEX vs HSL vs OKLCH",
    sections: [
      {
        heading: "HEX: the universal ID",
        body: [
          "HEX is base-16 shorthand for red, green and blue, written as #3a86ff. The first pair is red, the second green, the third blue — 3a, 86, ff decode to 58, 134, 255 in decimal. Compact, everywhere, and instantly recognizable to anyone who's written CSS.",
          "But here's the thing nobody says out loud: HEX is a machine representation. Nothing in #3a86ff tells you whether that's a bright blue or a muted one without doing the math in your head. It describes the mix, not the experience.",
          "Where HEX earns its keep is as a stable reference. Use it to store exact values, export from Figma, paste into config files, and hand colors to collaborators. It's the lingua franca of the web and it's not going anywhere.",
        ],
      },
      {
        heading: "HSL: the human-friendly model",
        body: [
          "HSL — hue, saturation, lightness — structures a color the way people actually talk about one. What hue is it? How saturated? How light or dark? hsl(210, 100%, 61%) reads as \"a clearly blue, fully saturated, moderately light color\" in a way the hex equivalent never will.",
          "That structure makes HSL ideal for quick variations. Drop the lightness from 61% to 48% and you have a darker blue for a hover state, same hue, no guesswork. It's great for reasoning and absolutely serviceable in hand-written CSS.",
          "The caveat is real, though: HSL is not perceptually uniform. A jump from 90% to 80% lightness looks dramatically different from a jump from 50% to 40%, even though both are ten points. So while HSL is great for tweaking one value, it's a bad foundation for generating a whole scale.",
        ],
        tip: "All three convert freely. Paste any hex into ChromaBrew and you get the hsl() and oklch() equivalents the same second — use whichever is clearest for what you're doing.",
      },
      {
        heading: "OKLCH: the perceptually uniform future",
        body: [
          "OKLCH was built to fix HSL's central flaw. Its lightness and chroma (saturation) axes are designed to match human perception, so equal steps look equal. Hue 30 is a consistent orangey step no matter what lightness you're at.",
          "This is exactly what you want when generating scales. A palette computed in OKLCH from 50 to 950 looks even — no two feels-identical tints, no sudden dark crush at the bottom. That's why modern design systems increasingly compute in OKLCH and store oklch() values in modern CSS.",
          "Browser support for oklch() is broad and current in 2026, so you can ship it directly in production CSS. ChromaBrew computes every scale in OKLCH under the hood, then hands you the output in whatever format your stack consumes.",
        ],
        bullets: [
          "HEX: exact reference values — machines, exports, storage",
          "HSL: reasoning about lightness and hue in readable terms",
          "OKLCH: perceptually even scales and design-system generation",
        ],
      },
      {
        heading: "When you don't need to choose",
        body: [
          "In practice you rarely pick a single space and stick to it everywhere. The pragmatic pattern is: store source colors in HEX or oklch(), derive scales and shades perceptually in OKLCH, and export whatever your stack needs. You can author in HSL for readability and let the generator convert.",
          "The point isn't to evangelize one format — it's to use each where it's strong and stop fighting the spaces that are wrong for the job. Your color tools already do the converting; you just decide what you're trying to express.",
        ],
      },
    ],
  },
  {
    slug: "tailwind-v4-color-scale-from-one-color",
    title: "Generate a Tailwind v4 color scale from one color",
    metaTitle: "Tailwind v4 Color Scale — Generate @theme",
    description:
      "Turn one brand color into a full Tailwind CSS v4 @theme color scale (50–950) ready to paste. Perceptual OKLCH steps, copy-paste utilities like bg-brand-600.",
    excerpt:
      "One brand color → a complete Tailwind v4 50–950 scale as a @theme block. Here's how, and why the steps stay perceptually even.",
    publishedAt: "2026-08-24",
    category: "Development",
    tags: ["tailwind", "css", "theme", "color scale"],
    relatedHrefs: ["/tools/tailwind-color-generator", "/tools/shade-generator"],
    keyword: "Tailwind v4 color scale",
    sections: [
      {
        heading: "Defining colors in Tailwind v4 with @theme",
        body: [
          "Tailwind v4 did something a lot of people missed: color configuration moved out of tailwind.config.js and into native CSS custom properties via the @theme directive. Declare a --color-brand-* variable and you get bg-brand-600, text-brand-500, border-brand-300 and every other utility for free, with zero config file in sight.",
          "Because it's plain CSS, you paste a block straight into your stylesheet entry and you're done. Your <link> to the generated utility, your editor, and your browser all read the same file. It's the same mechanism custom properties always had, just made first-class.",
          "A finished block looks like this — a single color turned into eleven utilities, most of which you'll never touch again but will be glad exist the day you do:",
        ],
        code: `@theme {
  --color-brand-50:  #eef5ff;
  --color-brand-100: #d7e8ff;
  --color-brand-200: #bcd9ff;
  --color-brand-300: #8fbaff;
  --color-brand-400: #5a9aff;
  --color-brand-500: #3a86ff;
  --color-brand-600: #1f6cff;
  --color-brand-700: #0f53e0;
  --color-brand-800: #0d3bb0;
  --color-brand-900: #082a80;
  --color-brand-950: #061a4d;
}`,
        tip: "Drop that block into your CSS entry and bg-brand-500, text-brand-900 and every other variant resolve immediately. No tailwind.config, no rebuild of the whole config — just utilities.",
      },
      {
        heading: "Why a perceptual 50–950 scale",
        body: [
          "Tailwind's convention is that eleven-step 50–950 spectrum, and it expects each step to feel like a deliberate move, not a random guess. The 500 step is your brand base — the natural default for primary buttons and links. Steps below it are for hover and for high-contrast text; steps above it are for backgrounds and surfaces.",
          "Generate those steps in OKLCH and the scale stays honest: lights stay bright instead of washing to grey, darks stay rich instead of crushing to black. People notice the difference immediately — an OKLCH scale looks expensive, a hand-darkened one looks accidental.",
        ],
      },
      {
        heading: "Build a full multi-color theme",
        body: [
          "One scale is a start, but real themes need more than a single hue. Generate a brand scale, an accent scale for highlights and CTAs, and a neutral scale for greys, then combine all three @theme blocks into one file.",
          "Before you copy, rename each scale so the names are meaningful — brand, accent, neutral, success, danger. The generator keeps every variable and utility reference in sync as you rename, so you get --color-accent-500 and bg-accent-500 without manual find-and-replace.",
          "Naming is the part people skip and regret. A theme with brand/accent/neutral is maintainable for years; one with blue-2 and accent-light becomes archaeology in a month.",
        ],
        tip: "Run the finished theme through a contrast check so pairs like brand-900 on brand-50 and accent-700 on neutral-0 actually meet WCAG AA. Beautiful utilities that fail contrast are just expensive decoration.",
      },
    ],
  },
  {
    slug: "dark-mode-the-right-way",
    title: "Dark mode the right way: don't just invert your colors",
    metaTitle: "Dark Mode — Semantic Tokens, Not Inversion",
    description:
      "Why inverting light mode colors makes a bad dark theme, and how to build an accessible dark mode from semantic tokens derived from your brand color.",
    excerpt:
      "Dark mode isn't light mode with darker colors. Here's the semantic-token approach that actually looks good and passes contrast.",
    publishedAt: "2026-08-18",
    category: "Design systems",
    tags: ["dark mode", "design tokens", "accessibility", "theming"],
    relatedHrefs: ["/tools/dark-mode-generator", "/tools/design-token-generator", "/tools/contrast-checker"],
    keyword: "dark mode",
    sections: [
      {
        heading: "Why plain inversion fails",
        body: [
          "The instinct when building dark mode is to take the light theme and flip the brightness. Light grey becomes dark grey, white becomes near-black, and you call it done. It always looks bad, and there are two specific reasons.",
          "First, saturated accents glow. A vivid blue that's charming against white turns into a glowing, almost neon blob against near-black. The same chroma that looked calm in light mode looks gaudy in the dark.",
          "Second, elevation inverts backwards. In light mode, a card is lighter than the page behind it, so it reads as raised. Flip that naively and the card gets darker than the page — invisible edges, muddy layering, and a design that reads as flat even though you did the work to give it depth.",
        ],
      },
      {
        heading: "Model elevation with semantic tokens",
        body: [
          "The fix is to stop thinking in concrete colors and think in semantic tokens. Define background, surface, surface-raised, overlay, and let their values change per theme — don't hard-code greys into components.",
          "In dark mode, elevation is expressed by making raised layers lighter, not darker. Your page background is darkest, each surface above it steps slightly lighter, cards sit above surfaces, and menus and overlays sit highest of all. It's the opposite of the naive flip, and it's what makes dark UIs feel like they have actual depth instead of looking like flat dark slabs.",
          "Saturation needs its own pass. Take each accent and drop its chroma in the dark theme — enough to feel calm rather than neon, not so much that it looks drained. Brands handle this differently, but the direction is almost always down.",
        ],
      },
      {
        heading: "Check contrast in both themes",
        body: [
          "Every foreground/background pair needs to pass WCAG in both the light and the dark theme, and the pair that fails is rarely the obvious one. Dark surfaces are near-black, so light text gets plenty of headroom — but accent-on-surface and muted-text-on-surface combos slip almost every time.",
          "Run the whole palette through a checker twice, once per theme. When a pair fails, adjust its lightness along the OKLCH axis rather than reaching for desaturation or transparency as a crutch. The color keeps its identity and the theme keeps its contrast budget intact.",
        ],
        tip: "Since both themes derive from the same set of semantic tokens, you ship light and dark from a single source of truth. Export CSS variables once and the theme switch is just a class or attribute swap.",
      },
    ],
  },
  {
    slug: "svg-vs-jpg-when-to-use-which",
    title: "SVG vs JPG: when to use which (and how to convert)",
    metaTitle: "SVG vs JPG — When to Use Each Format",
    description:
      "Difference between SVG and JPG: vector vs raster, scaling, transparency, file size and use cases — plus how to convert between them in your browser.",
    excerpt:
      "Vector or raster? A practical breakdown of SVG vs JPG and how to convert between them without losing your sanity.",
    publishedAt: "2026-08-20",
    category: "Development",
    tags: ["svg", "jpg", "image", "conversion"],
    relatedHrefs: ["/tools/svg-to-jpg", "/tools/jpg-to-svg"],
    keyword: "SVG vs JPG",
    sections: [
      {
        heading: "The core difference: vector vs raster",
        body: [
          "At the bottom of it, the two formats represent images completely differently. SVG is vector — it stores shapes as math: path commands, rectangles, curves, coordinates. Scale an SVG to ten times its size and the browser just recomputes the same shapes at the new size. It stays crisp, forever.",
          "JPG is raster — a fixed grid of pixels. A JPG that's 800 pixels wide has 800 columns of pixels, and that's all the information it has. Blow it up and the browser has to invent pixels that weren't there, which is exactly why enlarged JPGs look soft and blocky.",
          "That one distinction drives almost every other difference between the two, from file size to transparency to when you should reach for each.",
        ],
        bullets: [
          "Scaling: SVG stays sharp at any size; JPG blurs as you enlarge it",
          "Transparency: SVG supports it natively; JPG doesn't — it needs a solid background",
          "File size: SVG wins for logos and flat graphics; JPG wins for photos",
          "Editable: SVG opens in code and design tools; JPG is a finished, flattened image",
        ],
      },
      {
        heading: "When to reach for SVG",
        body: [
          "SVG is the right call for anything geometric or flat-colored: logos, icons, illustrations, charts, diagrams. These compress to tiny file sizes because the math is compact, and they render crisp on retina and 4K displays without shipping multiple versions.",
          "Bonus few people use enough: an SVG is text, so you can style it with CSS, alter a stroke or fill on hover with a single class, and even animate individual parts with SMIL or CSS transitions.",
        ],
        tip: "Some platforms stubbornly reject SVG uploads — certain email clients and most social media. If you have an SVG and a raster file is required, convert it to PNG or JPG rather than re-drawing the thing.",
      },
      {
        heading: "When to reach for JPG",
        body: [
          "JPG exists for photographs and anything with continuous gradients and lots of detail. It uses lossy compression that's extremely efficient — it throws away subtle differences the eye barely registers and gets enormous file-size wins in return.",
          "That tradeoff (a little quality for a lot of space) is exactly right for photos, backgrounds, and real-world textures. Nobody wants an SVG of their product photography; the path data would be absurd.",
        ],
      },
      {
        heading: "Converting between them",
        body: [
          "SVG → JPG: the converter renders the SVG to a canvas at the scale you choose, then exports at 92% quality. Two gotchas — JPG has no transparency, so the converter composite sits on a white background, and the more complex the SVG, the larger the exported JPG will be at high scale.",
          "JPG → SVG: this runs the opposite way. The image gets reduced to a limited color palette via quantization, then re-emitted as optimized rectangles of those colors. It's a great fit for logos and flat illustrations — but don't run a photo through it and expect a sensible file. Photos quantize into thousands of rectangles and produce a huge SVG that's basically a raster in disguise.",
        ],
        tip: "Both conversions run entirely in your browser with ChromaBrew — your images never leave your machine, which matters when you're handling a client logo you'd rather not upload anywhere.",
      },
    ],
  },
  {
    slug: "build-a-typography-scale-from-scratch",
    title: "Build a typography scale that actually keeps its rhythm",
    metaTitle: "Type Scale — Sizes, Ratios & Line Height",
    description:
      "How to design a modular typography scale from a base size and ratio: sizes, line heights, letter spacing, and the pairing choices that make a UI feel composed.",
    excerpt:
      "A type scale is more than a list of font sizes. Here's how to build one with a ratio, pair it well, and keep vertical rhythm across breakpoints.",
    publishedAt: "2026-08-27",
    category: "Design systems",
    tags: ["typography", "type scale", "design tokens", "ui"],
    relatedHrefs: ["/tools/typography-scale-generator", "/tools/design-token-generator"],
    keyword: "typography scale",
    sections: [
      {
        heading: "Start from one base size and a ratio",
        body: [
          "Typography scales work because they come from math instead of vibes. Pick a base size — your body text, usually 16px — and a ratio, then multiply up and down. A 1.25 ratio (the classic major third) gives you 16, 20, 25, 31, 39, 49, and so on. A 1.333 ratio (perfect fourth) is more dramatic: 16, 21, 28, 38, 50.",
          "Which ratio? It's a tone decision. Monotonic, tight ratios feel editorial and dense; bigger ratios give you clear headline drama. The mistake to avoid is inventing seven arbitrary sizes. When every step follows the same multiplier, headings visually 'relate' to body text in a way the eye reads as intentional even if it can't say why.",
          "Base comes first, always. If you set 16px as your body, then a 64px hero isn't a whim — it's two steps up a 1.333 scale and it will always sit comfortably above the 28px subheading below it.",
        ],
      },
      {
        heading: "Scale with line height, not just size",
        body: [
          "A larger font needs more generous line height, but not linearly. The rule of thumb that holds up: line-height should land in the 1.2–1.6 range, smaller for headings and larger for body. Body text at 1.5 to 1.6 stays comfortable over long paragraphs; a 20px heading is fine at 1.3.",
          "What most systems get wrong is scaling line height separately from size so the two drift apart. If you generate scale steps that pair each size with its own line height and letter spacing, you end up with a rhythm — the gap between baselines stays composed from the smallest label to the largest hero instead of being a pile of lucky guesses.",
        ],
        tip: "For any size, a quick sanity check: if the line-height per step looks like it will collide or float, nudge letter-spacing on large headings down and on small uppercase labels slightly up. It's the fastest way to make a scale feel tighter.",
      },
      {
        heading: "Pair typefaces with distinct jobs",
        body: [
          "Most sites don't need two fancy fonts — they need one workhorse for body and one that earns its keep on headings. Give each a clear job and let them share the scale you just built.",
          "A common, reliable pairing is a neutral humanist sans for body paired with a more characterful display for headings. The body font should be invisible in the best way; the heading font carries the personality. Swap-in test: if you can't tell which font is doing which job, they're competing instead of complementing.",
          "When you pair, keep the base size and ratio the same for both — the scale is shared, only the faces change. That's what makes a two-family system feel like one system instead of a typography grab bag.",
        ],
      },
      {
        heading: "Export scale steps as tokens",
        body: [
          "Once the scale feels right, the real work is making it reusable. Every step should be a token — --text-sm, --text-base, --text-lg, and so on — with its px size, line-height, and letter-spacing bundled together rather than three unrelated settings spread across components.",
          "Generate the scale once, eyeball the preview, then pull the CSS variables out. When every text style references a token instead of a raw px, a global retheme is one file edit, and you never have to chase a stray 21px across a codebase again.",
        ],
      },
    ],
  },
  {
    slug: "mixing-colors-and-alpha-channel",
    title: "Mix colors and use alpha without ruining your palette",
    metaTitle: "Color Mixing & Alpha Channel — No Muddying",
    description:
      "How to blend two colors at a ratio and use alpha/opacity correctly without washing out your palette or breaking text contrast.",
    excerpt:
      "Blending colors and adding transparency seem easy — until they turn your palette to mud. Here's the alpha-aware way to do both.",
    publishedAt: "2026-08-26",
    category: "Color theory",
    tags: ["color mixing", "alpha", "opacity", "transparency"],
    relatedHrefs: ["/tools/color-mixer", "/tools/alpha-channel", "/tools/contrast-checker"],
    keyword: "mixing colors",
    sections: [
      {
        heading: "Why naive mixing looks muddy",
        body: [
          "Mix two colors by taking a straight average and you get the obvious but wrong result: a flat, desaturated version of both. Blue averaged with orange doesn't give you a useful warm-neutral — it gives you grey with a hint of sadness. Averaging in RGB space treats color as if it were a set of three channels with equal perceptual weight, and it isn't.",
          "Neatly, mixing in a perceptual space behaves like the real world. Each step toward the other color keeps both hues alive as long as possible, and the halfway point stays properly neutral instead of turning prematurely grey. That's why a decent mixer interpolates in OKLCH rather than averaging RGB values.",
          "Use a mixer that blends perceptually, and set it to a ratio. Even at 50/50 you want to preserve a hint of hue, not flush the whole thing down to earth.",
        ],
        tip: "When you want a lighter version of a color for a hover or surface, blend it with white at a ratio rather than lowering opacity over white. Blending gives you a real, solid color that behaves predictably in every context.",
        links: [
          { label: "Mix two colors in OKLCH", href: "/tools/color-mixer" },
        ],
      },
      {
        heading: "Alpha is a tool, not a default",
        body: [
          "Transparency lets one element show what's behind it, which is genuinely useful: scrims over images, elevation hints in dark UIs, disabled states. The trouble starts when alpha is used as a lazy shortcut to 'make it lighter' or 'make it look softer.'",
          "The reason that fails is readability. A 50% black text over a white card isn't actually grey once it sits on a textured or colored background — it picks up whatever is underneath. Two cards side by side can render the same 'grey' text as visibly different colors. AA contrast suddenly can't be trusted, because your color is whatever's behind it.",
          "Rule of thumb: pick a solid color that already looks the way you want on your actual background, and reserve alpha for things that genuinely need to reveal content beneath — overlays, disabled UI, focus sheen. For text and elements that must meet a contrast target, prefer the solid version every time.",
        ],
      },
      {
        heading: "Working with 8-digit and rgba values",
        body: [
          "Modern CSS gives you options for alpha. There's rgba(r g b / 0.5), and there's the 8-digit hex — #3a86ff80, where the last two characters encode opacity (80 in hex is 50%). Both are fine; the hex8 form is handy for tokens because the whole value fits on one line.",
          "Where it gets subtle is that opacity on a whole element (including its children) multiplies, while an alpha on the color itself only affects that fill. An 80% opaque button dims its label too; a button with an 80%-alpha fill leaves the label at full strength. They look different, and you often want the second one.",
        ],
      },
      {
        heading: "Convert and verify before you ship",
        body: [
          "Authoring alpha is easier with a tool that shows you the rgba(), hex8, and a plain opacity slider for the same color, so you can compare the actual result instead of estimating. Set your color, dial the opacity, and copy the exact value you need.",
          "Then run the finished element through a contrast check against its real background. If it's a text or icon that has to stay readable, confirm the effective color — the alpha composited over where it sits — actually passes. Nothing about transparency excuses you from the contrast conversation.",
        ],
        links: [
          { label: "Add alpha to any color", href: "/tools/alpha-channel" },
          { label: "Check contrast before shipping", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "pull-a-palette-from-a-photo",
    title: "Turn a photo into a working color palette",
    metaTitle: "How to Extract a Color Palette From a Photo",
    description:
      "A short lesson: use an image's dominant colors as the starting point for a brand or UI palette — and how to keep it consistent.",
    excerpt:
      "Your brand color might already be hiding in a photo you love. Here's how to pull a palette from any image.",
    publishedAt: "2026-08-23",
    category: "Short lessons",
    tags: ["image", "palette"],
    relatedHrefs: ["/tools/image-color-extractor", "/tools/color-palette-generator"],
    keyword: "photo palette",
    sections: [
      {
        heading: "Start with the dominant colors",
        body: [
          "Open any image and the extractor lists its most-used colors with how much of the frame each covers. That's your starting set — but it's raw material, not a finished palette.",
          "The common move is to take the three or four most dominant colors and treat them as a seed: pick the strongest as your primary, use one secondary for support, and save the highest-contrast one as your accent. Then generate proper even scales from each so you get tints and shades you can actually use.",
          "Dominant colors are usually mid-tone and earthy, which means they tend toward medium contrast. That's fine for surfaces — just make sure your text colors get their own contrast pass, because the photo's mood colors and legible-on-top colors are rarely the same thing.",
        ],
        tip: "Photos with too much similar tone (a golden-hour shot, say) collapse to one hue. If extraction gives you a nearly monochrome set, flip to a photo with more color range, or force a hue shift to find your accent.",
      },
      {
        heading: "Turn seeds into usable scales",
        body: [
          "A raw extracted hex is a single point — a UI needs a ramp. Take each seed color and generate a perceptual scale around it (light tints for backgrounds, dark shades for text and hover states) so one photo color becomes ten usable stops. This is the step most people skip, and it is why photo palettes so often stall at a mood board that never ships.",
          "Keep the count tight: one primary scale, one secondary, one accent, plus a neutral derived from the photo's grayest tone. Four scales is a system; twelve extracted swatches is a souvenir. If two seeds sit within a few degrees of hue, merge them — near-duplicate ramps just double every later decision.",
        ],
        links: [
          { label: "Generate even scales from your seed", href: "/tools/shade-generator" },
          { label: "Build the full system from one color", href: "/design-system" },
        ],
      },
      {
        heading: "Give text its own contrast pass",
        body: [
          "Photo colors are chosen for mood, and mood colors are usually mid-tone — exactly where text contrast goes to die. So treat legibility as a separate pass: run every text-on-surface pair from your photo palette through a contrast check, and be willing to darken the text stop two steps past what looks right on the swatch card.",
          "The accent deserves the same honesty. A beautiful dusty-rose accent at 2.8:1 on white is fine for illustrations and large display type, but it is not a link color. Decide per color whether it is decoration or communication, and only the second group needs to pass — but that group must actually pass.",
        ],
        links: [
          { label: "Check your pairs against WCAG", href: "/tools/contrast-checker" },
          { label: "Grade the whole palette at once", href: "/tools/wcag-palette-checker" },
        ],
      },
    ],
  },
  {
    slug: "shadows-that-suggest-elevation",
    title: "Shadows that suggest elevation, not blur",
    metaTitle: "Designing UI Shadows for Real Elevation",
    description:
      "A short lesson: how to design box shadows that read as depth with layered offsets, blur and low opacity — instead of a single muddy blur.",
    excerpt:
      "A good shadow is layered, directional and subtle. Here's the elevation recipe most UIs are missing.",
    publishedAt: "2026-08-19",
    category: "Short lessons",
    tags: ["shadow", "elevation", "ui"],
    relatedHrefs: ["/tools/css-shadow-generator", "/tools/design-token-generator"],
    keyword: "UI shadows",
    sections: [
      {
        heading: "Layers beat a single blur",
        body: [
          "A realistic shadow is rarely one shadow. A soft ambient shadow plus a tighter, darker shadow close to the surface reads as depth; a single fat blur reads as dirt. Design systems usually ship two or three layers per elevation level.",
          "The typical composition: a small offset shadow close in (low blur, moderate opacity) for contact, and a larger, softer shadow further out (high blur, low opacity) for ambient fill. Together they make a card feel a few pixels off the page instead of behind smudged glass.",
          "Opacity is where most people overdo it. Real shadows are nearly transparent — 10–20% at most for a mid elevation in light mode, and lower or softer in dark mode, where the surface itself is already dark.",
        ],
        tip: "Shadows are easier to judge with a live preview over a real background, and they harden into tokens fast: define shadow-sm / shadow / shadow-lg from elevation levels once, and reference the token everywhere.",
      },
      {
        heading: "An elevation scale in three levels",
        body: [
          "Most interfaces need exactly three elevations: resting cards, raised elements (dropdowns, popovers), and overlays (modals, toasts). Give each a fixed two-layer recipe — a tight contact shadow plus a soft ambient one — and never invent a fourth on the fly. Consistency is what makes depth feel systematic instead of decorative.",
          "A practical starting scale in light mode: resting gets a whisper of contact plus a wide faint ambient; raised doubles the offsets and deepens the contact layer; overlays go further still and add a backdrop dim so the layering reads even before the shadow registers. Tune the numbers below against your own background rather than copying them blind — shadow opacity is relative to what sits behind it.",
        ],
        code: ".card    { box-shadow: 0 1px 2px rgb(0 0 0 / 0.08), 0 4px 16px rgb(0 0 0 / 0.08); }\n.raised  { box-shadow: 0 2px 6px rgb(0 0 0 / 0.12), 0 12px 32px rgb(0 0 0 / 0.14); }\n.overlay { box-shadow: 0 4px 12px rgb(0 0 0 / 0.16), 0 24px 64px rgb(0 0 0 / 0.22); }",
        codeLang: "css",
        links: [
          { label: "Design each layer visually", href: "/tools/css-shadow-generator" },
          { label: "Tokenise the scale", href: "/tools/design-token-generator" },
        ],
      },
      {
        heading: "Dark mode needs its own shadows",
        body: [
          "Shadows obey light, and dark interfaces have almost no light to obey — a 20%-opacity black shadow on a near-black surface is invisible. Dark-mode elevation is carried mostly by lighter surfaces and borders, with shadows reduced to a supporting role at roughly half their light-mode opacity.",
          "The reliable dark-mode recipe: lift each elevation level one surface step lighter than the background, add a faint top highlight (a 1px inset of white at 4–6%) to suggest the light source, and keep one soft black shadow to ground the layer. If a dark card still looks pasted on, reach for the border and surface first — more shadow opacity is rarely the fix.",
        ],
        tip: "Judge dark-mode shadows at full screen brightness and at low brightness. Phone users in bed are your toughest shadow critics.",
      },
    ],
  },
  {
    slug: "gradients-that-dont-look-cheap",
    title: "Gradients that don't look cheap",
    metaTitle: "Designing Gradients That Stay Tasteful",
    description:
      "A short lesson: the difference between a muddy two-stop gradient and a rich, stretched one — lightness contrast and perceptual spacing.",
    excerpt:
      "Most gradients look muddy because both stops are too similar. Here's what actually makes a gradient read as rich.",
    publishedAt: "2026-08-17",
    category: "Short lessons",
    tags: ["gradient", "css", "color"],
    relatedHrefs: ["/tools/css-gradient-generator", "/tools/color-mixer"],
    keyword: "CSS gradients",
    sections: [
      {
        heading: "Give the stops some contrast",
        body: [
          "A gradient between two colors that are too similar in lightness and hue is where cheap-looking gradients come from — it reads as a smudge. The fix is contrast: a real difference in lightness, or a real difference in hue, or both.",
          "Two reliable directions: a same-hue gradient that moves clearly from light to dark (good for buttons and surfaces), or a two-hue gradient between colors that sit apart on the wheel (good for hero backgrounds and brand accents). The moment two stops are both mid-tone and similar, the gradient starts to look like a rendering bug.",
          "Direction and stretch matter too. A gradient that's allowed to breathe across a full container looks expensive; a tight 45-degree sweep that barely shifts looks accidental. Know which of the two you want.",
        ],
        tip: "When a gradient looks off but you can't place it, drop one stop's lightness instead of reaching for a third color — three stops rarely rescue a pairing that two proper stops was too lazy to nail.",
      },
      {
        heading: "A recipe for a tasteful hero gradient",
        body: [
          "The highest-success-rate hero gradient is almost boring: your primary hue at two clearly separated lightnesses, stretched across the full container at a shallow angle, with a whisper of a neighboring hue at one end for life. Two stops, one hue family, real lightness travel — that combination reads as expensive almost regardless of the hue you start from.",
          "If you want two hues, pick them like a lighting designer: adjacent on the wheel (violet into blue, teal into green) for calm, or across it (amber into rose) for energy — and keep both stops at similar saturation so neither end looks neon against the other. Mismatched saturation is the quiet killer of two-hue gradients.",
        ],
        code: ".hero {\n  background: linear-gradient(160deg, oklch(0.72 0.14 285), oklch(0.52 0.18 320));\n}",
        codeLang: "css",
        links: [
          { label: "Build it visually, copy the CSS", href: "/tools/css-gradient-generator" },
          { label: "Find stops with real lightness travel", href: "/tools/color-mixer" },
        ],
      },
      {
        heading: "Keep text legible over gradients",
        body: [
          "A gradient behind text is a contrast gamble that changes along the container: the pairing passes at the dark end and fails at the light end, and WCAG grades the failure. The professional fixes are a scrim (a transparent-to-black overlay between image and text), a solid text panel, or restricting the gradient to decoration zones with copy on flat color.",
          "If display type must sit directly on a gradient, test the lightest point under the text, not the average — and re-test in dark mode, where the same gradient often inverts its risk. When in doubt, the scrim wins: it preserves the gradient's drama while giving the text one predictable background to pass against.",
        ],
        links: [
          { label: "Verify the lightest point passes", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "free-ai-generated-images-with-svg",
    title: "Free AI images using an AI coding tool + SVG",
    metaTitle: "Generate Free AI Images With SVG Code",
    description:
      "Generate AI images for free by having a coding assistant like opencode write SVG, then convert it to JPG with ChromaBrew's SVG-to-JPG tool.",
    excerpt:
      "You can get genuinely free AI images: ask a coding assistant to write SVG, then convert it to JPG. Here's the workflow and its honest limits.",
    publishedAt: "2026-08-28",
    category: "Short lessons",
    tags: ["svg", "ai", "images", "workflow"],
    relatedHrefs: ["/tools/svg-to-jpg", "/tools/jpg-to-svg"],
    keyword: "free AI images",
    sections: [
      {
        heading: "Turn a model that writes code into an image tool",
        body: [
          "Coding assistants aren't image models, but they all know how to write SVG. And SVG is a genuine image format — logos, icons, charts, flat illustrations, badges, social graphics. So you can get unlimited free AI images without paying an image API: have the assistant generate SVG, then rasterize it to JPG when you need a pixel file.",
          "The workflow is short. Tell the assistant what you want and that it should be SVG — something like 'make an SVG logo for a coffee brand, 1080 by 1350, flat, two colors.' It writes the SVG. You paste that into ChromaBrew's SVG→JPG converter (or save the file and convert), pick a scale, and export a JPEG ready to post, email, or embed.",
          "Because SVG is plain text, you can iterate cheaply: ask for a flatter color, a bigger icon, a different hue, and re-render. No generations consumed, no API credits, no watermarks. It's the closest thing to a free image generator that still gives you moderately useful results.",
        ],
        tip: "Open the SVG in a browser to preview before converting to JPG. Most assistants get the markup right first try but the scale and aspect ratio are worth checking before you export.",
      },
      {
        heading: "Honestly: what it can and can't do",
        body: [
          "The catch is real, and it's a shapes-catch, not a limit of the tool. SVG is built from paths, rectangles, circles, gradients and text. That's perfect for flat, geometric, logo-style images — and completely wrong for photorealistic scenes.",
          "You won't get a realistic landscape, a person's face, soft photographic lighting, or complex textures. Try that and you'll get a cartoonish approximation with primitive shapes, or the model will refuse and say it's not that kind of generator. The sweet spot is everything designers produce as vectors anyway: brand marks, buttons, banners, infographics, simple product illustrations, poster layouts.",
          "So treat it as a free logo-and-flat-illustration generator, not a Midjourney replacement. Within that lane it's genuinely useful and costs nothing. The SVG→JPG step also means you can use the finished images anywhere that insists on a raster file — social media and most email clients reject raw SVG uploads.",
        ],
        tip: "Give the assistant explicit geometry: the aspect ratio (e.g. 1080 x 1350 for a post), the color palette, and 'flat' or 'minimalist' to keep it in its lane. Vague requests produce vague SVG.",
      },
      {
        heading: "Convert and ship",
        body: [
          "Once you have SVG you're happy with, converting is a formality. Paste the code into ChromaBrew's SVG→JPG converter, or upload the file. Choose 1x for on-screen use or 2x–4x if you need extra sharpness for retina or print — SVG scales without losing anything, so you can always render larger.",
          "One gotcha: JPG has no transparency, so the export sits on a white background. For solid-color logos and post graphics that's usually fine. If you absolutely need a transparent background, keep the SVG (or export to PNG) and only drop to JPG where a raster file is required.",
          "That's it — a free pipeline from an idea to a finished JPG image, using tools you probably already have. Useful enough to live in your workflow for all the flat, vector-style graphics you'd otherwise pay an image service for.",
        ],
        tip: "Keep the original SVG alongside your JPG. If a social network crunches the JPG, you can re-export any time at any size without losing quality.",
      },
    ],
  },
  {
    slug: "one-color-to-a-working-design-system",
    title: "One color to a working design system",
    metaTitle: "One Color to a Working Design System",
    description:
      "From one brand color to a full design system: palette strategies, OKLCH scales, semantic tokens, typography, dark mode, WCAG checks and exports.",
    excerpt:
      "Pick a color, and in one session have a design system that ships: scales, tokens, dark mode, a contrast pass, and exports your engineers can actually use.",
    publishedAt: "2026-09-01",
    category: "Design systems",
    tags: ["design system", "design tokens", "figma", "workflow"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/design-token-generator", "/tools/wcag-palette-checker"],
    keyword: "working design system",
    sections: [
      {
        heading: "The whole system from one seed",
        body: [
          "A design system sounds like a big-company project — a design team, a roadmap, months of decisions. Strip it down and it isn't. A system is just a set of values that agree with each other: colors that relate, type that scales, spacing that steps evenly. And the fastest way to get that agreement is to stop choosing values one at a time and start from a single seed color that everything else is derived from.",
          "That's the loop ChromaBrew is built around. Drop in a primary color, pick a strategy, and the generator derives the rest — a secondary that lives nicely beside the primary, an accent for highlights, a neutral scale for greys and text, then typography, spacing, radius and shadows on top. You're not assembling a palette anymore; you're generating the skeleton of an entire UI in one pass, light and dark included.",
          "The seed matters more than anything else you'll do, so pick it on purpose. Mid-lightness, vivid colors work best. A primary that's already nearly black or nearly white drags everything derived from it off-balance, and you'll spend the rest of the session fighting it.",
        ],
      },
      {
        heading: "Choose a strategy, get a color family",
        body: [
          "Before the math runs, you tell the generator how the palette should behave. The default is complementary: a second hue sits opposite the primary on the color wheel, reads as energetic, and hands you an easy CTA/accent pairing. If the product is calmer, analogous keeps the palette to neighboring hues and reads quiet and cohesive. Triadic and split-complementary sit in between — balanced and vibrant. Monochromatic is the disciplined one: a single hue explored through lightness alone, which looks expensive and rarely offends.",
          "Leave secondary and accent alone and the generator auto-fills those too — but from role logic, not the strategy: split-complement hues off the primary, with lightness that answers the primary's own value, then contrast-checked per mode. Most people start with the defaults and never move them, and that's honestly fine — a trio derived from one hue tends to at least hang together, which is more than most hand-picked palettes manage.",
        ],
        bullets: [
          "Complementary — secondary opposite the primary; energetic, good for CTAs",
          "Analogous — neighboring hues; calm and cohesive",
          "Triadic — three evenly spaced hues; balanced and vibrant",
          "Monochromatic — one hue through lightness; disciplined and confident",
        ],
      },
      {
        heading: "Scales that stay honest: OKLCH math",
        body: [
          "Each hue then gets an eleven-step scale from 50 to 950, and this is where the quality is won. The steps are computed in OKLCH, a color space engineered around how humans actually perceive lightness, so an equal step in number is an equal step to the eye. Scales built that way stay bright at the top and rich in the darks; the old way — hand-mixing white and black into a hex — goes grey and mushy in predictable places.",
          "The 500 step is the brand base. Tints climb toward 50 to serve as backgrounds and soft surfaces; shades deepen toward 950 for text and high-contrast accents. You can lock a swatch you don't like and nudge it manually while the rest keep their relationships — the generator keeps the math honest, you keep the taste calls. That's the whole division of labor.",
          "The same seeds produce the light and dark themes together, which means dark mode isn't a second theme you design later. It's an output of the one you already made. Export one set of tokens and a .dark override, and the theme switch is a class swap.",
        ],
      },
      {
        heading: "Colors are half the system",
        body: [
          "Colors are what people picture when they hear design system, but the rest of the generator is where it turns useful. Typography ships as a paired font stack and a modular type scale built from a base size and a ratio, so every heading relates to body text in a way the eye reads as deliberate. Spacing steps evenly. Radius inherits the shape language you pick. Shadows are layered into elevation levels instead of one muddy blur.",
          "And every one of those values is a token before it's a pixel. Page, surface, primary, border, input, status — components reference a role, and each role references a value. You can feel the difference in the built-in previews: the SaaS, marketing, mobile and storefront previews all render from your tokens in both themes. When something's off, you see a UI problem, not a swatch problem.",
        ],
      },
      {
        heading: "Make it readable: the contrast pass",
        body: [
          "Before exporting anything, run the accessibility report and actually look at it. It checks text and interactive pairs against WCAG AA, and it surfaces the combinations you'd never think to check — accent on a muted surface, a primary used as small body text, a status color doing double duty as text. These are exactly the pairs that ship broken because they look fine as separate swatches.",
          "Failures are fixable inside the system. Swap in a different foreground from the approved scale, or let the generator nudge the offending value along the OKLCH lightness axis so the hue survives the fix. Getting the pairings green here — instead of after someone files a bug — is the difference between a palette that passes on paper and a product people can actually read.",
        ],
      },
      {
        heading: "Export it, hand it over, stop retyping",
        body: [
          "When the previews look right, the exports are the payoff. Everything drops out as files: CSS variables that become your :root tokens, JSON for a token pipeline, a Tailwind v4 @theme block with brand-50 through brand-950 ready to paste, shadcn/ui, Material UI, Ant Design, Bootstrap, Chakra. Native teams aren't left at the door either — Flutter, iOS Swift, and Android XML + Compose all export.",
          "The part most generators skip is the design-tools side. When the system has to live inside a design tool, you export W3C Design Tokens, a Figma Tokens file, or a Penpot-native file and import straight from the export panel. Want to hand everything over in one artifact? Grab the .zip bundle — CSS, JSON, Tailwind, Figma, W3C and Penpot files together, plus a short readme.",
          "And because the whole state of the system lives in the URL, you can also just send a link. Whoever opens it sees the same previews, the same tokens, the same exports — nothing uploaded, nothing installed, everything in the browser.",
        ],
        code: `:root {
  --background: #ffffff;
  --foreground: #18181b;
  --surface: #fafafa;
  --primary: #3a86ff;
  --secondary: #9c66ff;
  --accent: #ff7a00;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --surface: #18181b;
  --primary: #6ba3ff;
  --secondary: #bd9aff;
  --accent: #ff9a45;
}`,
        tip: "Keep the .zip in your repo and treat it as the handoff artifact. Engineering pulls from one file, designers pull from the W3C or Figma export, and the tokens stay a single source of truth instead of drifting across tools.",
      },
    ],
  },
  {
    slug: "secondary-and-accent-colors-in-a-design-system",
    title: "Secondary and accent colors in a design system: what they're for",
    metaTitle: "Secondary & Accent Colors — How to Choose",
    description:
      "Secondary and accent colors give a design system its hierarchy. What each role is for, how to choose one from your primary, and how top systems stay controlled.",
    excerpt:
      "Primary color gets the credit, but secondary and accent colors carry the hierarchy. Here's what each is for and how to choose them without breaking your palette.",
    publishedAt: "2026-09-01",
    category: "Design systems",
    tags: ["design system", "secondary color", "accent color", "color roles", "palette"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/design-token-generator", "/tools/contrast-checker"],
    keyword: "design system",
    sections: [
      {
        heading: "Every color in a design system has a job",
        body: [
          "When people first build a design system, they usually start with the brand color and stop there. A working system needs more than that. Aside from the primary, it needs a secondary color that shares the visual language, and an accent color that knows when to speak. Together the three create the hierarchy that tells a user what is the main action, what supports it, and what deserves a moment of attention. That hierarchy is the actual product — the colors are just how it shows up.",
          "It's useful to think of the roles the way a theater casts a play. The primary is the lead, on stage for every scene and carrying the bulk of the action. The secondary is the reliable supporting role, always present but never crowding the lead. The accent is the guest star: rare, high-impact, careful about when it appears. A system where all three behave is one you can reason about — which is why the best design systems read, at a glance, as obviously coherent.",
          "Most of the work is not in finding three colors. It's in making them relate to each other, and then keeping every other color in the palette derived from the same seed. The moment colors stop relating, the UI starts broadcasting that different people made these screens.",
        ],
      },
      {
        heading: "Design system examples: the same three roles, every time",
        body: [
          "Look at the design system examples that get talked about — the large corporate and open-source ones — and you'll spot the same pattern beneath different aesthetics. Material Design carries a primary family plus supporting and emphasis colors. IBM's Carbon and the Atlassian system both keep one hue for their main actions and a second, distinctly different hue for emphasis and status. They don't share a style at all. They share a grammar.",
          "That consistency isn't imitation; it's that interfaces have the same structural needs. Actions need one clear tier. Secondary interactions need a quieter tier. Alerts, selection and special emphasis need a tier that can bend attention without stealing the whole screen. Whatever you call the three, the jobs exist in every web design system worth copying, which is why planning the roles before picking hexes pays off.",
        ],
      },
      {
        heading: "Secondary color: the quiet workhorse",
        body: [
          "The secondary color is the primary's partner. In a typical design system UI it covers the second tier of the interface: secondary buttons, the active state in a sidebar, hover fills, supporting surfaces, tags that shouldn't compete with primary. If the primary is your call-to-action, the secondary is everything one step removed from it — necessary, present, polite.",
          "Because it sits so close to the primary in everyday use, the secondary should feel related rather than random. Two reliable routes exist: keep it near the primary on the hue wheel for a calm, cohesive product, or set it far across the wheel for energy when the product is meant to feel bold. The key test is always the same — put a primary button and a secondary button next to each other. If you can't instantly tell which is which, the pair needs more separation in lightness or chroma, not just a different hex.",
          "The failure to avoid is a secondary that is basically a stranger's color — beautiful on its own, unrelated to everything else. Relatedness is the requirement, and it's exactly why generative approaches derive the secondary from the primary instead of choosing it in a swatch vacuum.",
        ],
      },
      {
        heading: "Accent color: rare and loud, on purpose",
        body: [
          "The accent color has the smallest job and the biggest temptation. It exists for moments of emphasis: a promotion banner, a new-feature badge, a chart series, a notification dot, a highlighted phrase on a dark surface. The accent is where a design system is allowed to feel alive, and it earns that by being used on only a small fraction of the interface — never by default.",
          "As a rule of thumb, if the accent appears in every component, it isn't an accent anymore; it's a second primary wearing inappropriate clothes. The best design systems keep accent coverage low by deliberate policy: charts and status belong to it, everything routinized stays in the primary and secondary family. The payoff is that when the accent does appear, it genuinely lands.",
          "The accent also has the most license to be playful — high chroma, slightly off-palette. But when it carries text it still has to meet the same accessibility bar as everything else, which is where its pairing with the surface it sits on gets checked rather than assumed.",
        ],
      },
      {
        heading: "How to choose a good secondary color",
        body: [
          "Start from the primary and decide, in one sentence, what kind of energy the product needs. Calm and trustworthy? Keep the secondary adjacent to the primary — analogous hues at similar lightness. Bold and playful? Send it across the wheel, roughly complementary, where it creates contrast without fighting the primary. Products in between do well with triadic or split-complementary selections, which keep separation while staying balanced.",
          "Whichever direction you take, finish with a visual check in context. Drop the secondary onto a button beside a primary button, onto an active nav item, and onto a hover fill. It should survive all three without ever looking like it's competing for the main-action job. If the two hues are too close in both lightness and chroma, the UI goes monochrome in the worst way — a page where nothing rises above the noise. If they're too far apart in hue alone, it feels like two brands argued over one screen.",
        ],
      },
      {
        heading: "How to choose a good accent color",
        body: [
          "Where the secondary clings to the primary's neighborhood, the accent usually lives further away and brighter. A good starting point: pick the hue that best expresses the emotion the product needs in small doses, then push its chroma up and hold its lightness so it still reads on both your darkest and lightest surfaces.",
          "Test the accent the way it will actually be used — a badge dot next to its label, a link on a dark card, one series inside a chart. Tiny patches are merciless; an accent that looks fine as a sixteen-pixel swatch can vibrate at full size. And when the accent carries text, run it through the same WCAG contrast check you ran on the primary. An accent that only passes on white but fails on the surface it's destined for is not finished.",
          "Remember the accent changes in dark mode. Its chroma spikes against a near-black surface, so most systems dial it down a step or two in the dark theme. If your design system ships light and dark, the accent gets evaluated twice, not once.",
        ],
      },
      {
        heading: "Audit like the best design systems do",
        body: [
          "The fastest way to test whether your roles are working is to look at a full screen, not the swatch row. Cover the primary, then ask what lost the most meaning — that's what the secondary should have carried. Then count how many times the accent appears. If the number is high or the rhythm is chaotic, tighten the policy, not the color.",
          "In ChromaBrew the whole thing is a single flow: pick a primary, and the generator auto-fills a secondary and accent from it — split-complement companions with contrast-locked lightness — while the strategy you choose (complementary, analogous, triadic, split-complementary or monochromatic) shapes the palette strip. You can lock and tune any swatch, watch the roles live across SaaS, marketing, mobile and storefront previews, run the WCAG report, and export tokens as CSS, JSON, Tailwind, shadcn, MUI, or a Figma-ready tokens file when the hierarchy finally behaves.",
          "None of it requires assembling a separate design system template by hand. One seed, three roles, a contrast pass, and the exports your team actually consumes.",
        ],
        code: `:root {
  --primary: #3a86ff;
  --secondary: #7a5af0;
  --accent: #ff7a00;
  --background: #ffffff;
  --surface: #fafafa;
}`,
        tip: "Define roles before hexes. Name the token first (--primary, --secondary, --accent), decide what each is allowed to be used for, then fill in values. A token that stops you using the wrong color on the wrong screen is a role doing its job.",
      },
    ],
  },
  {
    slug: "design-system-styles-you-can-generate-with-one-link",
    title: "Fourteen design system styles you can generate with one link",
    metaTitle: "14 Design System Styles, One Link Each",
    image: "/blog/design-system-styles-you-can-generate-with-one-link.svg",
    imageAlt: "Fourteen design system styles generated from one link",
    description:
      "Neomorphism, Material, bento grid, cyberpunk, art deco — one preset link generates the whole system: colors, tokens, dark mode and exports.",
    excerpt:
      "A visual style is just a set of structural settings. Here are fourteen of them, encoded as generator links that build the entire system — not just a screenshot.",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["design system", "visual styles", "presets", "theming"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/design-token-generator", "/tools/shade-generator"],
    keyword: "design system styles",
    sections: [
      {
        heading: "A style is a configuration you can share",
        body: [
          "Most visual-style collections stop at a screenshot and a paragraph of adjectives. But a style is really a set of structural decisions — how much contrast, what shape language, which type personality, which color strategy — and those are exactly the inputs a design system generator runs on. ChromaBrew encodes every one of those decisions in the URL, so a style can be a link that opens a fully working system.",
          "The knobs: your seed colors, the palette strategy that decides how the rest of the palette is derived, the corner radius style, the type ratio, the font pairing, and the dark-mode background, plus explicit overrides for secondary and accent. Change any of them and the whole system recomputes — scales, semantic tokens, light and dark themes, four live previews, and every export. Which means a style is never a locked-in look; it's a starting configuration.",
          "None of this is permanent. Because the URL is a full description of the configuration, you can fork any of the links below, change a single parameter, and share the variant. No database stores your style — the browser rebuilds it from the address, every single time. That's also the trick that makes an entire library cheap to publish: each entry is a sentence of settings, not a page of hand-built assets.",
        ],
      },
      {
        heading: "What each setting actually controls",
        body: [
          "Before you click through the styles, it helps to know which lever moves what — every preset below is just a combination of these.",
        ],
        bullets: [
          "primary — the seed hue everything derives from; change it and the whole system follows",
          "secondary & accent — explicit support and highlight hues; omit them and both are auto-derived from the primary",
          "strategy — the palette-derivation rule: complementary, analogous, triadic, split-complementary, monochromatic or tetradic",
          "radius — sharp, soft or round; the single fastest way to change the shape language",
          "fonts — system, grotesque, editorial, humanist, geometric or technical heading pairings",
          "ratio — the type-scale ratio: 1.2 (compact), 1.25 (normal) or 1.333 (generous, dramatic display type)",
          "dbg — the dark-mode background treatment: tinted, solid black, or a custom hex",
          "sat / bright / hue / temp — refinement dials applied to every derived color before the scales are computed; small values, big personality shifts",
        ],
      },
      {
        heading: "The fourteen styles",
        body: [
          "Each link below opens the generator with that style's structural settings preloaded. Open it, look at the previews, then start pushing your own brand color into it.",
        ],
        bullets: [
          { label: "Neomorphism — soft extruded controls on a single material surface", href: "/design-system?primary=718096&strategy=monochromatic&radius=round&sat=-12" },
          { label: "Material — bold color roles on elevated surfaces", href: "/design-system?primary=3f51b5&secondary=ff4081&accent=ffab40&strategy=complementary&radius=soft" },
          { label: "Paper UI — warm stock, ink typography, ruled layers", href: "/design-system?primary=b4552d&secondary=8a5a2b&strategy=analogous&radius=sharp&fonts=editorial&ratio=1.333&sat=5" },
          { label: "Retro UI — beveled 90s desktop chrome in limited teal-grey", href: "/design-system?primary=0f766e&secondary=8a99a6&accent=c9a227&strategy=split-complementary&radius=sharp&sat=-8" },
          { label: "Bento Grid — vivid modular tiles with a strong axis", href: "/design-system?primary=6366f1&secondary=22d3ee&accent=fb7185&strategy=split-complementary&radius=round&fonts=grotesque" },
          { label: "Terminal UI — monospace, command-first, status colors", href: "/design-system?primary=00b894&accent=00cec9&strategy=monochromatic&radius=sharp&fonts=technical&dbg=solid-black" },
          { label: "Skeuomorphism — warm materials and dimensional controls", href: "/design-system?primary=8d5524&secondary=6f4e2b&strategy=analogous&radius=round&fonts=humanist&sat=8" },
          { label: "Claymorphism — inflated pastels and soft volume", href: "/design-system?primary=f472b6&secondary=a78bfa&accent=fbbf24&strategy=analogous&radius=round&fonts=grotesque&sat=10" },
          { label: "Bauhaus — primary geometry, bold type, hard edges", href: "/design-system?primary=ff4d00&secondary=1d4ed8&accent=ffc400&strategy=triadic&radius=sharp&fonts=geometric" },
          { label: "Art Deco — midnight navy, metallic gold, refined serif", href: "/design-system?primary=1f2a44&accent=caa04f&strategy=analogous&radius=sharp&fonts=editorial&ratio=1.333&dbg=solid-black&sat=-5&bright=5" },
          { label: "Memphis — playful pattern mixing in bright triads", href: "/design-system?primary=ff6b6b&secondary=4ecdc4&accent=ffe66d&strategy=triadic&radius=round&fonts=grotesque&sat=12" },
          { label: "Cyberpunk — dark high contrast, luminous cyan and magenta", href: "/design-system?primary=06b6d4&secondary=ff2d95&accent=8b5cf6&strategy=split-complementary&radius=sharp&fonts=technical&dbg=solid-black&sat=12" },
          { label: "Biomorphic — organic silhouettes and earth colors", href: "/design-system?primary=6f9f6e&strategy=analogous&radius=round&fonts=humanist&sat=-5" },
          { label: "Maximalist Editorial — vivid color blocks and dramatic type", href: "/design-system?primary=e11d48&secondary=2563eb&accent=f59e0b&strategy=split-complementary&radius=sharp&fonts=editorial&ratio=1.333" },
        ],
      },
      {
        heading: "How to choose a style for a project",
        body: [
          "Match the style to the job, not the mood board. Calm, data-heavy products read well in neomorphism, paper, or terminal — quiet surfaces that let the numbers talk. Consumer and creator products have room for claymorphism, memphis, or the bento grid, where playfulness is part of the brand. Bold, brand-led work suits bauhaus, art deco, or maximalist editorial, where the interface is expected to make a statement. Anything futuristic or technical should look honest in the cyberpunk or terminal lane before it looks cool.",
          "The fail-safe for picking: ask what the product must do on a normal Tuesday. If it's a dashboard your team stares at for hours, the question isn't which style your portfolio loves most — it's which one keeps reading comfortable at nine in the morning. Every style below is a working system, not a screenshot; the only wrong choice is a pretty one that won't serve the content.",
        ],
        tip: "When in doubt between two styles, generate both with your actual brand color and put the previews side by side. The right answer is usually the one that still looks calm after ten seconds of looking, not the one that looks exciting for the first two.",
      },
      {
        heading: "Make any of them yours",
        body: [
          "Every preset is a starting point, not a verdict. Keep the structural pieces that make the style recognizable — the radius, the font pairing, the strategy — and swap the primary hue for your brand. Re-run the four previews and the WCAG report after the swap; a style that looks cohesive in its native palette can drift the moment you push an alien hue into it.",
          "The dark-theme pass matters twice as much here. Luminous styles (terminal, cyberpunk) are built around the dark background; cuddly ones (clay, paper) assume a light surface. Dress the accent for both themes before you export.",
        ],
        tip: "Keep these links somewhere handy. A folder of prebuilt geometry — strategy, radius, fonts — is the fastest way to try a brand color across fourteen distinct looks in about a minute flat.",
      },
    ],
  },
{
    slug: "neomorphism-design-system",
    title: "Neomorphism: a design system that feels carved out of one surface",
    metaTitle: "Neomorphism Design System — Soft UI Style",
    description:
      "What neomorphism is, how to recognize it, and a ChromaBrew preset that generates a soft-UI design system — plus the accessibility rules that keep it usable.",
    excerpt:
      "Soft, extruded controls, paired shadows, one material surface. Here's the neomorphism design system preset — and the contrast rules it needs to survive.",
    image: "/blog/neomorphism-design-system.svg",
    imageAlt: "Neomorphism style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["neomorphism", "soft ui", "design system", "shadows"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/contrast-checker", "/tools/design-token-generator"],
    keyword: "neomorphism design system",
    sections: [
      {
        heading: "What neomorphism actually is",
        body: [
          "Neomorphism is the style where controls look pressed out of the page itself. A raised button has a light shadow on one side and a dark shadow on the other; an inset field is the same shape pushed the opposite way. Everything shares one background material, so there are few hard borders and lots of gentle, rounded volume.",
          "Recognize it by four tells: low contrast everywhere, paired light-and-dark shadows, generously rounded controls, and a tactile depth that makes you want to poke the screen. It reads premium and quiet — popular for finance dashboards, wallets, and anywhere a calm, physical surface feels trustworthy. The weakness is the same thing that makes it pretty: contrast is low by design, so text and interactive states need deliberate protection.",
          "The style has had two lives. It went mainstream as the 'soft UI' trend of the late 2010s, spread far faster than it was understood, and picked up a bad reputation because most imitations shaved the shadows off their accessibility. The versions that survive treat neomorphism as a skin on a normal, fully readable interface, not as a replacement for borders and states. Build it that way and it still looks expensive years later.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Four tells separate genuine neomorphism from a generic shadow-heavy interface:",
        ],
        bullets: [
          "Low contrast — surfaces, controls and text stay harmoniously muted; almost no pure black or pure white appears",
          "Paired shadows — every raised control carries both a light highlight and a dark shadow from the same light source",
          "Rounded controls — corners are generous, because sharp edges would break the soft-material illusion",
          "Tactile depth — controls read as inset or raised, so the whole page behaves like a soft keypad",
        ],
      },
      {
        heading: "The neomorphism preset",
        body: [
          "The style demands a muted, single-hue palette — the whole surface is one material, and loud multi-color systems break the illusion. The preset locks a desaturated slate blue, stays monochromatic so every hue matches, and pulls saturation down further with the refinement dial. Radius goes round for that soft extruded feel.",
          "That muted monochrome does one more useful thing: it makes the accent genuinely loud. When everything sits in one quiet hue family, a single saturated accent can light up exactly one or two things per screen and get real attention. Keep the accent's coverage per screen small — it's the pressure valve for the whole style.",
        ],
        links: [
          { label: "Open the neomorphism preset in the generator", href: "/design-system?primary=718096&strategy=monochromatic&radius=round&sat=-12" },
        ],
        tip: "Neomorphism relies on shadow to show depth, but shadow is not an accessible state indicator. Keep text at real contrast, show focus with a visible ring, and give pressed and disabled states more than a shadow tweak.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "One material means the semantic tokens collapse into a friendly ladder. Background and surfaces carry the extruding; primary owns the one or two raised actions you actually want pressed; secondary marks inset fields and quiet controls; and the accent is the single voice allowed to be loud. Everything sits within a few lightness steps so the illusion holds:",
        ],
        code: `:root {
  --background: #eef0f3;
  --surface: #f7f8fa;
  --primary: #718096;
  --secondary: #8f9baa;
  --accent: #5b7fd4;
  --foreground: #2f3640;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it to a brand",
        body: [
          "Swap the slate seed for any hue you like — the monochromatic strategy and round radius do the rest of the styling. What you must not do is let the muted surface drag text below contrast. Run every foreground/background pair through the checker, and if a pair fails, lift lightness on the OKLCH axis rather than pumping saturation back in, which quietly undoes the whole effect.",
          "When a pair fails in this style, the instinct is to add more shadow behind the text — don't. Lift the text token's lightness and let the raised surface carry the depth. Neomorphism also leans on several near-identical tones, so a greyscale pass is worth the ten seconds: if surfaces vanish into each other once color is removed, the material reads as mud, not as a premium surface.",
        ],
        tip: "Focus rings are non-negotiable here. With no borders and whisper-soft contrast, keyboard users can't find focus without them — use the primary hue at a visible stroke rather than a shadow offset.",
      },
    ],
  },
{
    slug: "material-design-system-preset",
    title: "The Material design system: bold color roles on elevated surfaces",
    metaTitle: "Material Design System — Generate the Theme",
    description:
      "What makes a Material-style design system tick: elevation, color roles, states. A ChromaBrew preset generates a Material-inspired theme from three hues.",
    excerpt:
      "Elevation, color roles, clear states — Material's ideas, applied through the generator. Here's the preset and how to bend it to a brand.",
    image: "/blog/material-design-system-preset.svg",
    imageAlt: "Material design system preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["material design", "design system", "elevation", "tokens"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/design-token-generator", "/tools/contrast-checker"],
    keyword: "material design system",
    sections: [
      {
        heading: "The ideas, not the widgets",
        body: [
          "Material Design gets remembered for its widgets, but its real contribution is structural: surfaces sit at different elevations, color has defined roles, and states are explicit. A card is a raised surface, a dialog floats higher, and each step of elevation is communicated by shadow and surface lightness rather than a border. Color roles — primary, secondary, accent, surface, error — do the communicating.",
          "Recognize a genuine Material-derived system by elevation and role discipline: layered surfaces, a bold primary family doing the action work, a supporting hue for secondary interactions, and clear hover/pressed/disabled states on everything. It's the default grid-walking visual language of the last decade for a reason.",
          "That discipline is older than Material and outlives it. The team took years of desktop and web conventions — shadow equals depth, emphasis equals color — and codified them into tokens anyone can copy. The same grammar is exactly what the generator's four previews use, which is why Material-derived palettes drop in with almost no adjustment.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Material is one of the easiest large styles to identify, because its tells are structural rather than ornamental:",
        ],
        bullets: [
          "Elevation everywhere — cards, sheets and dialogs are separated by shadow and surface lightness, not outlines",
          "Bold primary family — one hue family carries the emphasized actions and the selected states",
          "Color roles that repeat — primary, secondary, surface, error and on-background: the same grammar on every screen",
          "Explicit states — hover, pressed, focus and disabled each have a defined treatment on every interactive control",
        ],
      },
      {
        heading: "The Material preset",
        body: [
          "The generator's four previews already think in elevation and color roles, so the preset mostly picks the palette. The classic trio is indigo for primary, a pink for the secondary/support role, and an amber accent for status and highlight. Complementary strategy gives the primary a real opposite hue to work against, radius stays soft, and the dark theme comes free.",
          "You can fight the trio or lean into it. Indigo, pink and amber together read so instantly that the combination alone says 'Material'; swapping in your own primary while keeping the pink and amber roles takes the same look toward 'Material for your brand'. Either way, the elevation does the heavy lifting — the colors are just the wardrobe.",
        ],
        links: [
          { label: "Open the Material preset in the generator", href: "/design-system?primary=3f51b5&secondary=ff4081&accent=ffab40&strategy=complementary&radius=soft" },
        ],
        tip: "In a Material-style system the primary belongs to emphasized actions and the secondary to everything one step below. Keep accent coverage small — status, selection, special emphasis — or the hierarchy blurs.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "Material's roles map cleanly onto the token ladder. The base is white or near-white; the primary family carries actions and selected states; the secondary covers supports and emphasis; the accent marks status. Error gets its own reserved hue (a strong red) so it can never be confused with something good:",
        ],
        code: `:root {
  --background: #ffffff;
  --surface: #f5f6f8;
  --primary: #3f51b5;
  --secondary: #ff4081;
  --accent: #ffab40;
  --foreground: #1b1b1f;
}`,
        codeLang: "css",
      },
      {
        heading: "Bend it toward a brand",
        body: [
          "Drop your own hue into primary and the system re-derives the family around it; the pink and amber stay only where you want support and status. Then walk the four previews looking for state, not color: every button needs hover, pressed and disabled versions, and every surface needs visible elevation. That's the Material test that screenshots never pass.",
          "The dark theme is where elevation gets its second exam. Shadows are invisible on black, so Material's light-mode shadow cues turn into lightness cues in dark mode — a raised card is simply a lighter surface. Let the generator's tinted dark background do that work rather than forcing a pure black that erases all layering.",
        ],
      },
    ],
  },
{
    slug: "paper-ui-design-system",
    title: "Paper UI: a design system built from warm stock and ink",
    metaTitle: "Paper UI Design System — Warm Editorial",
    description:
      "Paper UI explained: layered sheets, ink typography, ruled details. Generate the warm editorial style with a ChromaBrew preset and keep it legible.",
    excerpt:
      "Warm paper, ink text, ruled details. The paper UI style reads like print — here's how to generate the system and keep the ink readable.",
    image: "/blog/paper-ui-design-system.svg",
    imageAlt: "Paper UI style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["paper ui", "editorial", "design system", "warm palette"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/typography-scale-generator", "/tools/design-token-generator"],
    keyword: "paper ui",
    sections: [
      {
        heading: "Print that happens to be digital",
        body: [
          "Paper UI borrows the grammar of print. Instead of dark-on-white software chrome you get a warm stock background, ink-toned typography, thin ruled lines doing the work of borders, and layers that read like stacked sheets rather than floating cards. It's the style for anything that wants to feel like a well-made publication: editorial sites, docs, portfolios, journals.",
          "Recognize it by temperature and texture: warm off-white surfaces, dark warm ink rather than pure black, hairline rules, and an editorial rhythm where type leads and color follows. The entire effect depends on warmth being consistent — the moment one surface goes grey-blue, the paper illusion breaks.",
          "The style descends from a longer tradition than most interface trends: broadsheet layout, book design, the magazine grid. That lineage is why it ages well — the mechanics of leading, columns and contrast were solved by printers centuries ago, and the best paper UIs are simply those rules executed with CSS instead of letterpress.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Three quick tests tell paper UI apart from a generic light interface:",
        ],
        bullets: [
          "Warmth — surfaces are cream and paper-white, never hospital white; blacks are warm ink (near #3a2d22), not #000",
          "Rules, not borders — separations come from thin hairlines and baselines rather than boxed borders",
          "Type leads — a real typographic hierarchy with a generous ratio; color plays support, never the lead",
          "Layered sheets — stacked surfaces imply physical paper order instead of floating cards with heavy shadows",
        ],
      },
      {
        heading: "The paper UI preset",
        body: [
          "The preset starts from a burned-clay ink on warm stock, keeps the family analogous so nothing argues with the paper, and flips the structural dials toward print: sharp radius for ruled details, an editorial serif pairing for headings, and a generous type ratio for display scale. A small saturation lift keeps the stock feeling warm rather than dusty.",
          "Notice what the preset does not touch: layout. Paper is not a layout style as much as a temperature plus a rhythm. The radius, the serif and the ratio carry the print feeling; the color simply has to stay warm and related. That makes it one of the cheapest styles to try and one of the most forgiving to hand-tune afterward.",
        ],
        links: [
          { label: "Open the paper UI preset in the generator", href: "/design-system?primary=b4552d&secondary=8a5a2b&strategy=analogous&radius=sharp&fonts=editorial&ratio=1.333&sat=5" },
          { label: "Build a matching type scale", href: "/tools/typography-scale-generator" },
        ],
        tip: "Ink on warm stock has forgiving but not automatic contrast. Text that sits on the lightest tint (your paper) will pass easily; text on the darker tints is where pairs sneak under 4.5:1 — check them all.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "The roles map straight onto print vocabulary. Background and surface are your papers; primary is the ink that headlines and key actions use; secondary is the muted ink for body hierarchy; and the accent plays the single printed color on the page — rare, warm, and never used over large areas:",
        ],
        code: `:root {
  --background: #f6efe3;
  --surface: #fbf6ec;
  --primary: #b4552d;
  --secondary: #8a6b4f;
  --accent: #caa15a;
  --foreground: #3a2d22;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Swap the clay for a deeper forest or a cooler slate ink if your publication leans that way, but keep the hue warm in body copy or the editorial mood dies. The generous type ratio is doing much of the work here — keep it, and let the ruled-line simplicity carry any interface clutter you add.",
          "Two things to resist. First, don't desaturate the whole thing into grey 'minimal paper' — that loses the warmth that makes it paper at all. Second, don't let dark mode slide into cold blue-grey; keep the dark surfaces warm-toned (a deep espresso works where pure black doesn't) so the publication identity survives the theme switch.",
        ],
      },
    ],
  },
{
    slug: "retro-ui-design-system",
    title: "Retro UI: the 90s desktop as a design system",
    metaTitle: "Retro UI Design System — 1990s Desktop Theme",
    description:
      "Retro UI explained: beveled chrome, window metaphors, compact density, a limited teal-grey palette. Generate the nostalgic style with a ChromaBrew preset.",
    excerpt:
      "Beveled buttons, steel teal-grey, window chrome. Here's the retro 90s-desktop style as a working design system preset.",
    image: "/blog/retro-ui-design-system.svg",
    imageAlt: "Retro UI style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["retro ui", "90s desktop", "design system", "nostalgia"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/shade-generator", "/tools/design-token-generator"],
    keyword: "retro ui",
    sections: [
      {
        heading: "Windows you remember, not the ones you have",
        body: [
          "Retro UI reaches for the early desktop metaphor: beveled window chrome, chunky controls with highlight-and-shadow edges, compact toolbars, and a disciplined teal-grey palette. It reads as deliberately nostalgic — project management tools, developer utilities, and anything playing up its own earnestness use it to signal a simpler, more solid era.",
          "Recognize it by chrome and restraint: beveled, dimensional controls; dense, compact layout; window metaphors like title bars, panes and status bars; and a limited palette where no more than two or three hues exist at all. The constraint is the charm — this style quietly dies the moment you add a modern rainbow accent wave.",
          "Nostalgia works because it's specific. The teal-and-grey of a mid-nineties desktop is instantly recognizable to an entire generation, and the reference does the emotional work an interface usually has to do itself. It's also why vague 'vintage' attempts fail: the palette has to be an actual period-correct palette, not today's colors wearing a slight filter.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "The 90s desktop look has a short, strict set of tells:",
        ],
        bullets: [
          "Bevels everywhere — controls are built from a light top edge and a dark bottom edge; no glow, no gradient washes",
          "Window metaphors — title bars, panes, tab strips and status bars act as real furniture",
          "Dense but ordered — compact 8px-ish rhythm and small type, yet legible because contrast stays high",
          "A tiny palette — one or two hues plus neutrals; three hues at most, always muted",
        ],
      },
      {
        heading: "The retro UI preset",
        body: [
          "The preset stays true to the era: a utilitarian teal, a steel grey for chrome, a restrained brass gold for the rare highlight, split-complementary so the teal has one real opponent, sharp radius for crisp bevels, and saturation dialed down so nothing glows. System fonts keep the terminal-office authenticity.",
          "A caveat worth knowing: the generator's previews are modern components — soft buttons, card grids, hero sections. Retro is a surface treatment more than a component set, so the bevel language and compact density are what you bring. The preset gets the color and shape language right; the chrome details are your finishing move.",
        ],
        links: [
          { label: "Open the retro UI preset in the generator", href: "/design-system?primary=0f766e&secondary=8a99a6&accent=c9a227&strategy=split-complementary&radius=sharp&sat=-8" },
        ],
        tip: "Bevels imply depth; they also demand contrast. Make sure beveled buttons stay clearly distinguishable from beveled inputs — same chamfer, opposite affordance confuses people — and give disabled chrome a real state difference, not just a grey tint.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "The roles stay modern even when the chrome doesn't. Primary is the action teal; secondary is the steel grey that builds chrome and inactive states; accent is the brass that only touches one highlighted item per screen; and the surfaces stay light steel so the bevels can read. Everything sits in a low-saturation range so the whole screen holds together like one window manager:",
        ],
        code: `:root {
  --background: #d9dde1;
  --surface: #c3c9cf;
  --primary: #0f766e;
  --secondary: #8a99a6;
  --accent: #c9a227;
  --foreground: #1c2733;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "If the teal isn't yours, any period-correct industrial hue (battleship blue, café orange, sage) drops in — keep sat low and let the steel grey carry the chrome. Add compact density to the four previews by treating the marketing preview as the one page that gets to relax; the desktop feel belongs in the SaaS and mobile tools.",
          "Watch the dark theme like a hawk here. A beveled light desktop is the icon of the style, and a flipped-on-black version can silently forget the highlights that make bevels bevels. Give your dark mode a steel-grey tint rather than pure black, keep the highlight/shadow pairing intact, and make sites and backgrounds lighter than the window frame, not darker.",
        ],
      },
    ],
  },
{
    slug: "bento-grid-design-system",
    title: "Bento grid: a design system built from modular tiles",
    metaTitle: "Bento Grid Design System — Modular UI Theme",
    description:
      "The bento grid as a design language: mixed-span tiles, strong alignment, compact summaries. Generate a vibrant bento-ready theme with a ChromaBrew preset.",
    excerpt:
      "The bento grid is a layout discipline and a color discipline. Here's the preset that keeps varied tiles feeling like one system.",
    image: "/blog/bento-grid-design-system.svg",
    imageAlt: "Bento grid style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["bento grid", "dashboard", "design system", "modular layout"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/contrast-checker", "/tools/design-token-generator"],
    keyword: "bento grid design",
    sections: [
      {
        heading: "A grid that acts like a dashboard",
        body: [
          "A bento grid is the modular layout where tiles of different sizes sit in aligned rows — a big hero tile here, four small status tiles there, a tall one beside a wide one — all held together by invisible column lines. It turns mixed content, stats and actions into a compact overview, which is why dashboards, launchers and settings screens love it.",
          "Recognize it by modularity and rhythm: varied tile spans, strong shared alignment, compact summaries inside each tile, and a color system that keeps tiles differentiated without shouting. That color discipline is the part people miss — a bento grid with six hero colors is a jumble; a bento grid with two surfaces plus a few role colors is a system.",
          "The name comes from the Japanese lunchbox, and the metaphor is exact: separate compartments, each with its own portion, all designed to be consumed at one sitting. That is precisely what a great dashboard is. The layout happens to be fashionable right now, but the discipline it asks for — stable alignment, quiet differentiation, no tile fighting its neighbor — is permanent.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "A bento layout is easy to spot; a bento system is defined by these four behaviors:",
        ],
        bullets: [
          "Mixed spans, one ruler — tiles occupy one, two or three columns, but every tile obeys the same column grid",
          "Strong shared alignment — tile edges line up to the pixel and gaps are consistent across the whole board",
          "Compact summaries — each tile carries a tight headline and a small stat or figure, nothing sprawling",
          "Quiet differentiation — tiles differ by surface role, not by six competing colors",
        ],
      },
      {
        heading: "The bento grid preset",
        body: [
          "Bento thrives on a bright, modern trio: an indigo primary for the tiles that matter, a cyan for emphasis surfaces, and a rose accent for status and mixed data. Split-complementary keeps those relationships honest, round radius softens the tiles, and a grotesque pairing gives the compact summaries the slight technical edge they want.",
          "The trio does a specific job in the grid: it hands you three believable tile speeds. The indigo tile is the one to read first, cyan tiles are the supporting surfaces, and rose marks anything live. Keep exactly those three roles and every tile in the bento has a ready answer for what it should be — which is the entire trick of making varied sizes feel like one system.",
        ],
        links: [
          { label: "Open the bento grid preset in the generator", href: "/design-system?primary=6366f1&secondary=22d3ee&accent=fb7185&strategy=split-complementary&radius=round&fonts=grotesque" },
        ],
        tip: "In a bento system, tile differentiation should come from token roles — surface for the quiet tiles, primary for the featured one, accent for live status — so a tile swap never means a color decision.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "In a bento system the surface tokens carry most of the weight, because nearly every tile is a surface. Primary gets the featured tile and the main action inside it; secondary marks emphasis tiles; and accent is reserved for live status chips and small sparklines. The result is a small, legible vocabulary that scales to any grid, whatever the tile sizes:",
        ],
        code: `:root {
  --background: #ffffff;
  --surface: #f4f5f7;
  --primary: #6366f1;
  --secondary: #22d3ee;
  --accent: #fb7185;
  --foreground: #18181b;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Treat the SaaS preview as the bento home and push your own brand hue into primary. Keep cyan and rose only if they earn their place; muted brands can drop to a single accent and use surface lightness instead. After the hue swap, check the smallest tile text — compact summaries are where contrast quietly fails.",
          "Bento boards are also a density test. The previews render at ordinary spacing; a real grid often packs tiles tighter, and that is where the two-surfaces-plus-roles rule pays for itself. If a variant ever feels busy, the fix is almost never a new color — it's taking color off a tile and letting surface lightness carry it.",
        ],
      },
    ],
  },
{
    slug: "terminal-ui-design-system",
    title: "Terminal UI: a design system for the keyboard crowd",
    metaTitle: "Terminal UI Design System — Monospace Theme",
    description:
      "Terminal UI explained: monospace hierarchy, command patterns, semantic status colors. Generate the dark command-line style with a ChromaBrew preset.",
    excerpt:
      "Monospace, command-first, all-dark. Here's the terminal UI style as a design system you can generate — and keep readable.",
    image: "/blog/terminal-ui-design-system.svg",
    imageAlt: "Terminal UI style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["terminal ui", "monospace", "dark mode", "developer tools"],
    relatedHrefs: ["/tools/contrast-checker", "/tools/dark-mode-generator", "/tools/design-token-generator"],
    keyword: "terminal ui",
    sections: [
      {
        heading: "The interface as a console",
        body: [
          "Terminal UI borrows the vital signs of a command prompt: monospace text everywhere, a command field you could actually run, process logs and metrics, and a strict set of semantic status colors for success, warning and error. It signals precision and developer-friendliness — DevOps consoles, release dashboards and deploy tools use it to say 'this is real machinery'.",
          "Recognize it by monospace hierarchy and restraint: a dark near-black surface, a single luminous accent reserved for the command and key metrics, status colors doing exactly their jobs, and a keyboard-first flow that treats the mouse as optional. The charm is discipline — a terminal UI with decorative flourishes stops being a terminal.",
          "The appeal runs deeper than nostalgia: the VT100 and the modern distributed build speak the same visual language, and the terminal is one interface nearly every developer has spent tens of thousands of hours inside. Leaning on that familiarity honestly makes a terminal-styled product feel fast and trustworthy from the first load — even when the UI behind it is an ordinary web app.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Real terminal UI is a system of habits, and four of them identify it immediately:",
        ],
        bullets: [
          "Monospace throughout — headings and body share one fixed-width family; hierarchy comes from weight and brightness, not typeface swaps",
          "A command field — one element feels runnable, and logs or metrics stream nearby like a live session",
          "Semantic status colors — success, warning, error and info are fixed tokens with fixed meanings",
          "A single luminous accent — one bright hue for the prompt and the numbers that matter; everything else stays near-white or near-black",
        ],
      },
      {
        heading: "The terminal UI preset",
        body: [
          "The preset pairs a phosphor teal-green with a cyan for the live-command accent, stays monochromatic so every hue already agrees, uses sharp radius to echo hard-edged console chrome, and — the crucial piece — sets the dark background to solid black rather than tinted, the way real emulators sit.",
          "Why solid black and not tinted? Terminals show black as black — it is the color of the screen being off — and users of this style notice the difference even when they can't name it. Tinted backgrounds read as 'an app trying to be dark'; solid black reads as 'an actual terminal'. The other dark-background options are still there to try; the preset just picks the more honest one.",
        ],
        links: [
          { label: "Open the terminal UI preset in the generator", href: "/design-system?primary=00b894&accent=00cec9&strategy=monochromatic&radius=sharp&fonts=technical&dbg=solid-black" },
        ],
        tip: "Dark surfaces give text headroom, but the luminous accent and status colors are where terminal themes fail — a bright green 'all good' and an amber warning both need to pass AA against near-black, and they often don't.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "This is the rare style where the accent does more work than the primary. Primary and surface hold the calm black base; the accent owns the prompt, the active command and the headline metric; and the status colors — success green, warning amber, error red — are fixed tokens that never drift between themes. Body copy lives in the near-whites, never in the glow:",
        ],
        code: `:root {
  --background: #0a0a0a;
  --surface: #101010;
  --primary: #00b894;
  --accent: #55efc4;
  --success: #00e68a;
  --warning: #ffb300;
  --foreground: #e6ffe9;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Swap the phosphor for any terminal-era hue — amber-on-black, green-on-black, terminus blue — the technical font pairing and solid black dark mode carry the identity. Keep status colors semantic and identical across the light and dark themes; nothing about a command console should change meaning between modes.",
          "Give the style a light theme with care. Dozens of terminal products ship a halfhearted light mode that stops being a terminal and becomes a washed-out dashboard. If you must ship light mode, keep monospace, keep the status hues, and test the luminous accents on white — a green that glows on black can barely whisper on white.",
        ],
      },
    ],
  },
{
    slug: "skeuomorphism-design-system",
    title: "Skeuomorphism: a design system that feels like real materials",
    metaTitle: "Skeuomorphism — Material Metaphors Explained",
    description:
      "Skeuomorphism explained: physical metaphors, believable materials, dimensional controls. Generate the warm material style with a ChromaBrew preset.",
    excerpt:
      "Wood, leather, brass — skeuomorphism makes digital controls feel physical. Here's how to generate the material style and keep it from looking like a museum.",
    image: "/blog/skeuomorphism-design-system.svg",
    imageAlt: "Skeuomorphism style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["skeuomorphism", "materials", "design system", "depth"],
    relatedHrefs: ["/tools/shade-generator", "/tools/color-palette-generator", "/tools/design-token-generator"],
    keyword: "skeuomorphism",
    sections: [
      {
        heading: "When the button is made of something",
        body: [
          "Skeuomorphism gives digital controls physical metaphors — a knob that turns like a knob, a panel that reads as brushed metal, a page that sits on wood grain. Its comeback in niche product domains trades on instant legibility: people understand a lever before they read a label. Audio gear, instruments and artisan tools love it.",
          "Recognize it by materials, not decoration: believable textures and gradients, dimensional controls with highlight and shadow, and realistic feedback like a click that looks pressed. The trap is doing it richly everywhere — a skeuomorphic system with a real job keeps the metaphor for the controls and lets everything else recede.",
          "The iOS-era skeuomorphism burned out because it lavished metaphor on everything, treating screens like museum exhibits. The useful version understands context: the same person who loves a physical fader on a mixing app would be annoyed by a leather footer on a calculator. Today's skeuomorphism is surgical — the material appears exactly where a physical analog genuinely aids understanding, and nowhere else.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Believable skeuomorphism reads as materials, and it has four signatures:",
        ],
        bullets: [
          "A defined material — wood, leather, brass or felt: the surface has a temperature and a texture, not just a color",
          "Dimensional controls — knobs and sliders carry highlight and shadow so they read as physical parts",
          "Realistic feedback — a button appears to press down; a switch clicks",
          "Restraint of scope — the metaphor lives on controls and key surfaces, not on every paragraph on the page",
        ],
      },
      {
        heading: "The skeuomorphism preset",
        body: [
          "The preset builds on warm, material-believable tones: a leather tan for primary, a darker saddle brown for depth, an analogous strategy so the wood family stays in one hue neighborhood, and a rounder radius with a humanist pairing so the interface feels handled rather than machined.",
          "Note that the generator cannot hand you texture files — wood grain and brushed-metal gradients are image work. What the preset gives you is the color physics underneath: the right temperature, the right depth of shadow, the right neutrals. When you add materials later, they only need to match the token values and the illusion stays airtight.",
        ],
        links: [
          { label: "Open the skeuomorphism preset in the generator", href: "/design-system?primary=8d5524&secondary=6f4e2b&strategy=analogous&radius=round&fonts=humanist&sat=8" },
        ],
        tip: "Materials are communicated by temperature and shadow, not by texture overload. In a generated system, let the warm palette read as the material and reserve gradient-style detailing for actual controls.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "The warm family hardly needs separate roles to feel like materials, but the tokens still keep the UI in order: primary is the leather of the controls you press, secondary is the saddle-brown of frames and insets, accent is the brass that gleams on a toggle or a needle, and the surfaces are the polished wood the interface sits on:",
        ],
        code: `:root {
  --background: #efe4d3;
  --surface: #e2cfa9;
  --primary: #8d5524;
  --secondary: #6f4e2b;
  --accent: #c88a3d;
  --foreground: #2e2114;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Swap the tan for a walnut, an espresso, or a brushed olive to change the 'material' instantly; saturation delivery keeps the warmth. The previews show where metaphor is affordable: buttons and toggles can carry dimensional treatment; paragraphs and density should stay flat and readable.",
          "Keep the whole family in the warm half of the hue wheel. A single cool blue wandering into a wood-and-leather system reads as an imported error, and users feel it even when they can't say why. And in dark mode, resist going espresso-black for surfaces; a slightly lighter saddle-brown that still reads as wood keeps the material credible.",
        ],
      },
    ],
  },
{
    slug: "claymorphism-design-system",
    title: "Claymorphism: soft, inflated, playful",
    metaTitle: "Claymorphism Design System — Pastel UI Theme",
    description:
      "Claymorphism explained: inflated forms, saturated pastels, directional shadows. Generate the playful soft-volume style with a ChromaBrew preset.",
    excerpt:
      "Inflated cards, saturated pastels, directional shadows. Here's the claymorphism style as a design system — and where its contrast gets fragile.",
    image: "/blog/claymorphism-design-system.svg",
    imageAlt: "Claymorphism style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["claymorphism", "pastels", "design system", "playful ui"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/contrast-checker", "/tools/design-token-generator"],
    keyword: "claymorphism",
    sections: [
      {
        heading: "UI that looks squeezed and squishy",
        body: [
          "Claymorphism is the softened cousin of neomorphism: inflated, rounded volumes with directional shadows, saturated pastels, and a general sense that each card was squeezed out of a tube. It reads playful and tactile — kid-focused tools, wellness apps and creative products use it to feel approachable.",
          "Recognize it by volume and color: forms that look puffed up, soft directional shading that suggests a light source, saturated pastel hues, and an overall low-stakes friendliness. The tension is built in — pastel saturation is exactly where text contrast quietly dies, so the style works hardest to stay usable.",
          "Where neomorphism whispers, clay shouts softly. The difference that matters: neomorphism keeps one muted material, while claymorphism lets a whole pastel palette coexist — pink, violet, amber, mint — which is what gives it personality. That palette is also what puts the accessibility burden on you: every filled surface is a potential low-contrast backdrop, so the style only works if you respect that.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "The clay look has four unmistakable characteristics:",
        ],
        bullets: [
          "Inflated volume — cards and buttons look puffed up, with a plump, rounded silhouette",
          "Directional shadows — one soft shadow on the bottom and one soft highlight on the top, like one believable light source",
          "Saturated pastels — pink, violet, mint, amber: colors are saturated yet light, never dusty",
          "Low-stakes friendliness — nothing looks heavy or official; the interface invites a poke",
        ],
      },
      {
        heading: "The claymorphism preset",
        body: [
          "The preset picks a saturated pink family with a violet support and an amber highlight, keeps the hues near-neighbors through an analogous strategy, rounds the radius to fully accommodate the inflated look, and pushes saturation up so the pastels actually read as clay rather than washed-out grey. A grotesque pairing keeps the cuteness from sliding into cartoon.",
          "The three colors map onto the squish in a useful way: pink is the main clay everything sits on, violet is the second material so filled cards can differ from filled buttons, and amber is the fun detail you use once per screen. If that split feels familiar, it's the primary-secondary-accent grammar wearing a pastel coat — which is exactly why it generates so cleanly.",
        ],
        links: [
          { label: "Open the claymorphism preset in the generator", href: "/design-system?primary=f472b6&secondary=a78bfa&accent=fbbf24&strategy=analogous&radius=round&fonts=grotesque&sat=10" },
        ],
        tip: "Pastel text on a pastel surface is this style's signature failure. Every typographic pair needs the same 4.5:1 you'd demand on any other style — the volume does the smiling, the text still has to work.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "The roles follow the same grammar as any bright system, just in a softer key. Surface holds the base pastel so filled cards read as clay; primary is the main button and the featured card; secondary gives you distinct filled surfaces without reaching for extra hue families; and accent is the single high-chroma moment. Because there are no dark neutrals in this world, foreground text sits in a deep plum rather than black:",
        ],
        code: `:root {
  --background: #fdf2f8;
  --surface: #fff7f9;
  --primary: #f472b6;
  --secondary: #a78bfa;
  --accent: #fbbf24;
  --foreground: #2d1b26;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "The pastel trio is the whole personality; swap in your brand's hue family and keep saturation high but controlled. Walk the four previews looking at text-on-filled-card pairs specifically, and let the dark theme's chroma step down — inflated pastels read as radioactive on near-black if left alone.",
          "Pick the third color deliberately. The amber accent is chosen to pop on both pink and violet; whatever trio you use, keep the two main clays close on the wheel and push the accent away from both. One accent, far away, used sparingly — that formula is what keeps clay read as trend-aware instead of disordered.",
        ],
      },
    ],
  },
{
    slug: "bauhaus-design-system",
    title: "Bauhaus: primary geometry, bold type, hard edges",
    metaTitle: "Bauhaus Design System — Geometric UI Theme",
    description:
      "Bauhaus-inspired interface design: primary geometry, assertive type, asymmetric balance. Generate the avant-garde style with a ChromaBrew preset.",
    excerpt:
      "Red, blue, yellow, geometry. The Bauhaus approach to interface design is discipline disguised as play — here's the preset.",
    image: "/blog/bauhaus-design-system.svg",
    imageAlt: "Bauhaus style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["bauhaus", "geometric", "design system", "avant-garde"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/color-blindness-simulator", "/tools/contrast-checker"],
    keyword: "bauhaus design",
    sections: [
      {
        heading: "Form follows function, loudly",
        body: [
          "Bauhaus design leans on primary geometry and primary color: circles, squares and straight lines, red, blue and yellow, bold sans-serif type, and asymmetric compositions that stay balanced through relation rather than symmetry. As an interface language it says audacious and modern — portfolio sites, studios and creative-tool products wear it well.",
          "Recognize it by commitment: hard-edged shapes used functionally rather than decoratively, a few saturated hues with no greys in between, assertive display type, and compositions whose imbalance is clearly intentional. The discipline is that everything geometric is doing layout work — nothing is ornament for ornament's sake.",
          "A century on, the movement's argument still holds for interfaces: honest materials, honest geometry, and no decoration pretending to be function. That is why the style never reads as twee even now — a Bauhaus screen admits it is a screen, and builds confidence out of straight lines and saturated primaries instead of hiding behind chrome.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "The Bauhaus signature is easy to identify and hard to fake:",
        ],
        bullets: [
          "Primary geometry — circles, squares, triangles and straight lines used as functional layout elements",
          "Primary color — red, blue and yellow at full strength, with no pastels or neutrals in between",
          "Bold geometric type — assertive sans-serif letters with a temperament, not a polite standard grotesque",
          "Intentional imbalance — asymmetric grids whose tension is clearly designed, not accidental drift",
        ],
      },
      {
        heading: "The Bauhaus preset",
        body: [
          "The preset goes full Bauhaus: a vermillion primary, a strong blue secondary and a signal-yellow accent, a triadic strategy that keeps all three hues evenly apart on the wheel, sharp radius for honest right angles, and a geometric type pairing with the display personality the movement demands.",
          "The triadic strategy is doing real structural work here, not just picking colors. With three hues evenly spaced at 120°, none can claim to be a tint of another — precisely the democratic, un-hierarchical energy Bauhaus wanted. You get the movement's visual diplomacy for free, then reinforce it by letting the geometry carry the message.",
        ],
        links: [
          { label: "Open the Bauhaus preset in the generator", href: "/design-system?primary=ff4d00&secondary=1d4ed8&accent=ffc400&strategy=triadic&radius=sharp&fonts=geometric" },
        ],
        tip: "Red/blue/yellow is also the exact scheme most people with color-vision deficiency confuse. Run the palette through the color-blindness simulator before shipping — functionality shouldn't depend on distinguishing yellow from red.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "Roles in Bauhaus do exactly what the movement intended: they separate jobs by hue, not by tint. Primary is the red action voice; secondary is the blue structural voice (frames, inactive chrome); accent is the yellow that marks one point of emphasis; and the surfaces stay clean near-white so the primaries never muddy each other:",
        ],
        code: `:root {
  --background: #f5f5f2;
  --surface: #ffffff;
  --primary: #ff4d00;
  --secondary: #1d4ed8;
  --accent: #ffc400;
  --foreground: #111111;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "The bold trio is the point, so resist the urge to mute it — if a muted brand needs Bauhaus structure, keep the geometry and drop a single hue. Sharp radius and the geometric pairing do the structural work; let the shapes the previews lay out speak, and keep body copy on white or near-white for contrast.",
          "Where Bauhaus earns its keep is scale and rhythm, so let the marketing preview do the talking first: oversized display type, hard color blocks, type sitting on its baseline like furniture. When something feels off, the fix is usually less color, not more — one hue at full strength per screen honors both the style and accessibility.",
        ],
      },
    ],
  },
{
    slug: "art-deco-design-system",
    title: "Art Deco: midnight, gold, and symmetry",
    metaTitle: "Art Deco Design System — Metallic UI Theme",
    description:
      "Art Deco interface design: stepped geometry, strong symmetry, metallic accents, refined display type. Generate the ceremonial style with a ChromaBrew preset.",
    excerpt:
      "Midnight navy, gold linework, symmetry. The Art Deco style turns an interface into a ceremony — here's the preset.",
    image: "/blog/art-deco-design-system.svg",
    imageAlt: "Art Deco style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["art deco", "gold", "design system", "luxury"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/shade-generator", "/tools/design-token-generator"],
    keyword: "art deco design",
    sections: [
      {
        heading: "The interface as a gilded hall",
        body: [
          "Art Deco draws from the 1920s: stepped and fan-shaped geometry, strong symmetry, metallic gold accents and refined display serifs. Used digitally it reads ceremonial and precise — luxury brands, galas, ticketing and heritage properties reach for it to say 'this is an occasion'.",
          "Recognize it by restraint and symmetry: a dark jewel-toned base, gold or brass doing all the metallic work, stepped lines echoing architecture, and centered, confident compositions. Every trait depends on the others; gold without symmetry is just expensive-looking, and symmetry without gold is plain brown.",
          "The style works because it imports a complete visual culture rather than one trick. The cinematic feel comes from the same moves a great venue makes: a dim room, one warm light source, and details that reward walking closer. In an interface, that translates to a deep dark base, a single metallic voice, and hairline ornament appearing exactly where the eye lands next.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Ceremonial interfaces share four reliable markers of the Deco grammar:",
        ],
        bullets: [
          "Stepped geometry — zigzag, fan and sunburst motifs echo buildings and skyscrapers, not icons",
          "Strong symmetry — centered compositions and mirrored panels; the layout is ceremonial, never tossed",
          "Metallic accent — gold or brass does all the highlight work; nothing else is allowed to sparkle",
          "Refined display type — an elegant serif with deep contrasts, engraved or italic, never chunky",
        ],
      },
      {
        heading: "The Art Deco preset",
        body: [
          "The preset sets a midnight navy as the base — dark enough for the gold to glow — keeps the family analogous so the navy stays deep and rich, uses a refined editorial serif and a generous ratio for that ceremonial display scale, sharpens the radius to fit stepped geometry, and locks the dark background to solid black. A tiny brightness lift keeps the navy from crushing.",
          "Notice what the preset leaves out: a secondary. Art Deco demands one material point of light, and the gold accent is it. Adding a second loud support hue fractures the ceremony. If the system feels like it wants another color, spend it on a deeper navy or a champagne white for paper surfaces rather than a second voice.",
        ],
        links: [
          { label: "Open the Art Deco preset in the generator", href: "/design-system?primary=1f2a44&accent=caa04f&strategy=analogous&radius=sharp&fonts=editorial&ratio=1.333&dbg=solid-black&sat=-5&bright=5" },
        ],
        tip: "Gold on midnight is beautiful but universally tight on contrast. Where gold carries text, tune it down into a softer champagne tone; keep pure gold for linework and ornaments, and put text on navy or white instead.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "The token ladder becomes an evening palette: the navy background and the slightly lighter surface carry the room; primary is the steel-navy body of chrome; accent is the gold reserved for linework, an active state and one call to action; and the foreground is a warm champagne white that keeps text reading above luxury:",
        ],
        code: `:root {
  --background: #1f2a44;
  --surface: #26324f;
  --primary: #314a80;
  --accent: #caa04f;
  --foreground: #e8e4d8;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Swap the navy for emerald, burgundy, or royal purple and the ceremony survives; keep the gold accent regardless, since it is doing the metallic identity. The dark theme should be the default here — open the previews in dark mode first, then make sure the light theme isn't an afterthought.",
          "For a light theme, think 'gallery catalog': ivory surfaces, the same gold doing fine rule lines and small labels, and navy promoted to the ink. Symmetry and the serif carry the identity across both modes; what changes is only where the dark sits. One light pass with those ideas keeps the light theme a member of the family.",
        ],
      },
    ],
  },
{
    slug: "memphis-design-system",
    title: "Memphis: postmodern geometry and deliberate imbalance",
    metaTitle: "Memphis Design System — Playful UI Theme",
    description:
      "Memphis-style interface design: playful geometry, pattern mixing, bright accents. Generate the postmodern style with a ChromaBrew preset.",
    excerpt:
      "Dots, squiggles, loud triads. The Memphis style is play with a point — here's the design system preset with its restraint built in.",
    image: "/blog/memphis-design-system.svg",
    imageAlt: "Memphis style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["memphis", "postmodern", "design system", "playful"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/color-blindness-simulator", "/tools/contrast-checker"],
    keyword: "memphis design",
    sections: [
      {
        heading: "Playfulness with a grid underneath",
        body: [
          "Memphis launched as a rebellion against minimalism in the eighties: squiggles, dots, confetti and loud color clashing on purpose. As an interface language it's youthful and expressive — creative studios, events and content products use it to say 'not corporate', often paired with a straight-laced layout underneath so the play has structure.",
          "Recognize it by tone and tension: playful geometry and pattern mixing, bright accent colors against a plain base, and a casual imbalance that never reads as careless. The serious part is the foundation — a Memphis system is disciplined layout wearing colorful sunglasses, and the restraint is what keeps it from becoming noise.",
          "The group's own label for it — 'a cocktail of everything' — is the honest description. Memphis mixes pattern languages freely, but the reason it still looks designed rather than broken is a plain grid underneath and a rule that only one loud thing speaks per square. Replicate those two rules and you can be as bold as you like.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Memphis is instantly legible, and four cues mark the real thing:",
        ],
        bullets: [
          "Playful geometry — squiggles, dots, confetti and loose shapes mixed into layouts that are otherwise orderly",
          "Pattern mixing — grids, stripes and scattered marks layered on the same surface without apology",
          "Loud triads — three saturated accents clashing on purpose, evenly spaced so the clash reads as intended",
          "A plain base — a quiet, usually white or cream ground that makes every color look louder than it is",
        ],
      },
      {
        heading: "The Memphis preset",
        body: [
          "The preset picks a loud coral-teal-yellow triad — evenly spaced hues so the clashing reads as intentional — rounds the radius to match the doodle energy, uses a grotesque pairing for bold attitude, and pushes saturation up the way the movement demands.",
          "The evenly spaced triad is the quiet engineering Easter egg. Place any three hues 120° apart and they keep their identities while still vibrating against each other. Memphis wants that vibration, but it wants it to feel chosen — which is exactly what an even split delivers. Keep any replacement triad evenly separated and the same deliberate clang survives.",
        ],
        links: [
          { label: "Open the Memphis preset in the generator", href: "/design-system?primary=ff6b6b&secondary=4ecdc4&accent=ffe66d&strategy=triadic&radius=round&fonts=grotesque&sat=12" },
        ],
        tip: "A triad this loud makes text its own casualty. Design a neutral base into the system and let one hue at a time carry color — the moment all three saturate the same screen, contrast and calm both leave.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "Roles in Memphis are a matter of dosage, not hue semantics — every token stays loud, they just never appear at once. Primary carries the featured action, secondary the doodle-pop of the hero, accent the small confetti moments, and the surfaces stay plain so the saturation looks higher than it is. The discipline is literal: one hue per element, never one element wearing all three hues:",
        ],
        code: `:root {
  --background: #ffffff;
  --surface: #fbf7f0;
  --primary: #ff6b6b;
  --secondary: #4ecdc4;
  --accent: #ffe66d;
  --foreground: #241f20;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Any bright triad you love works — just keep the three hues evenly separated so they keep that deliberate clang. Let the previews place color sparingly: primary for the featured action, accent for the doodles, and the neutral surfaces doing the heavy lifting. Check text pairs after every hue swap.",
          "And run the color-blindness check twice, because loud reds and greens are the exact pairing that vanishes for many users. If icons and doodles carry meaning on their own, great; if color is doing semantic work, add a pattern or a shape cue — which Memphis tolerates beautifully, since patterns are native to it.",
        ],
      },
    ],
  },
{
    slug: "cyberpunk-interface-design-system",
    title: "Cyberpunk interface: dark, luminous, technical",
    metaTitle: "Cyberpunk UI Design System — Neon, Dark Theme",
    description:
      "Cyberpunk interface design: dark high-contrast surfaces, luminous accents, angular frames. Generate the neon future style with a ChromaBrew preset.",
    excerpt:
      "Cyan and magenta on near-black, angular panels, dense labels. Here's the cyberpunk interface style as a working design system.",
    image: "/blog/cyberpunk-interface-design-system.svg",
    imageAlt: "Cyberpunk interface style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["cyberpunk", "dark mode", "neon", "design system"],
    relatedHrefs: ["/tools/dark-mode-generator", "/tools/contrast-checker", "/tools/design-token-generator"],
    keyword: "cyberpunk interface",
    sections: [
      {
        heading: "Speculative technology, legible enough to use",
        body: [
          "Cyberpunk interface design imagines technology as dense and slightly hostile: near-black surfaces, luminous cyan and magenta accents, angular frames and panels, and technical microcopy everywhere — speculation numbers, status labels, node graphs. It signals powerful, futuristic utility: analytics tools, AI products and game-adjacent software love it.",
          "Recognize it by contrast and framing: dark high-contrast base, a small set of luminous accents doing real work, sharp angular or clipped panels, and text that reads technical even when it's marketing copy. The discipline is that despite the mood, everything stays readable — a proper cyberpunk system is a dark theme that passes accessibility, not a neon poster.",
          "The genre's actual invention was the interface as a window into a machine, dense with data rather than friendly emptiness. The best cyberpunk products borrow that intensity with a trade: they earn the dense, glowing look through genuinely high information density. If the product is thin, the styling reads as costume; if the product earns its labels, the styling does the work of credibility.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "The neon-future look has four reliable signatures:",
        ],
        bullets: [
          "Dark high-contrast base — near-black surfaces with near-white copy; the mood lives in contrast, not in grey",
          "Luminous accents — cyan and magenta (or one chromatic pair) doing real work: frames, primary action, status",
          "Angular framing — clipped corners, hard panels and diagonal cuts instead of soft rounded chrome",
          "Dense technical copy — labels, IDs and status strings that make the UI feel instrumented",
        ],
      },
      {
        heading: "The cyberpunk preset",
        body: [
          "The preset builds the classic trio — cyan primary, magenta secondary, violet accent — as a split-complementary family so the neon hues feel related rather than random, sets sharp radius for the angular panel language, pairs a technical monospace for the dense label mood, locks the dark background to solid black, and pushes saturation up so the accents genuinely glow.",
          "Split-complementary is the right engine here because full complementary (cyan against orange) reads as sports livery, while true analogous hues go muddy and forgettable. Split keeps the cyan family unified with a warm violet as punctuation. If you swap in a different neon pair, keep them separated enough on the wheel that they stay two colors and never merge into one glow.",
        ],
        links: [
          { label: "Open the cyberpunk preset in the generator", href: "/design-system?primary=06b6d4&secondary=ff2d95&accent=8b5cf6&strategy=split-complementary&radius=sharp&fonts=technical&dbg=solid-black&sat=12" },
        ],
        tip: "Luminous accents sharpen against black, which is exactly when they blow past usable. Body text should never run in cyan or magenta — reserve them for the frames, the primary action and status, and keep copy in the near-whites.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "This is a two-theme system and the roles stay identical in both. The black base carries everything; cyan primary owns frames and the main action; magenta secondary marks the second tier of chrome and warnings; violet accent highlights selection; and body copy lives in near-white, with the accent colors reserved for structure and status rather than for text:",
        ],
        code: `:root {
  --background: #0a0a0c;
  --surface: #121218;
  --primary: #06b6d4;
  --secondary: #ff2d95;
  --accent: #8b5cf6;
  --foreground: #e8ecf2;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Any high-intensity duo works — amber-and-green terminal, ice-blue-and-red — keep the black base and sharp radius and the identity is intact. Prefer the dark theme as the default and the light theme as a concession; then confirm both pass the same contrast report, because neon on white behaves differently.",
          "The dark theme's attitude should carry into the light theme's typographic density: keep the technical font, keep the labels, keep the sharp frames, and simply swap the ink. A cyberpunk light mode that turns into a floaty white dashboard loses the entire brand in one toggle. Keep the instrument, change the lighting.",
        ],
      },
    ],
  },
{
    slug: "biomorphic-design-system",
    title: "Biomorphic: organic shapes and earth colors",
    metaTitle: "Biomorphic Design System — Organic UI Theme",
    description:
      "Biomorphic interface design: organic silhouettes, flowing boundaries, earth-derived colors. Generate the calming natural style with a ChromaBrew preset.",
    excerpt:
      "Leaf forms, flowing edges, sage and clay. The biomorphic style softens the grid — here's the design system preset and its limits.",
    image: "/blog/biomorphic-design-system.svg",
    imageAlt: "Biomorphic style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["biomorphic", "organic", "design system", "natural"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/design-token-generator", "/tools/contrast-checker"],
    keyword: "biomorphic design",
    sections: [
      {
        heading: "Where the grid loosens up",
        body: [
          "Biomorphic design takes cues from living forms — irregular silhouettes, flowing boundaries, rounded organic edges — and pairs them with earth-derived colors: sage, clay, moss, driftwood. It softens the hard grid of typical interface design and reads calm and natural: wellbeing apps, environmental products and elegant calm brands use it.",
          "Recognize it by shape and palette: organic silhouettes that avoid straight edges, flowing boundaries between regions, earth-toned color with low-to-moderate saturation, and a soft asymmetry built around natural balance rather than strict centering. The risk is the opposite of maximalism: too organic, and a screen stops feeling like an interface and starts feeling vague.",
          "The approach borrows from mid-century organic architecture — the idea that a building (or a screen) can feel like it grew rather than got assembled. That is the right lens for the product-fit question: biomorphic surfaces work best where the product wants to feel alive, restorative and unhurried. Products that need instant scanning and dense parallel tasks will fight the style no matter how well it is executed.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "The organic look has four identifying habits:",
        ],
        bullets: [
          "Organic silhouettes — shapes avoid straight edges entirely; corners melt instead of cutting",
          "Flowing boundaries — regions bleed into each other with soft curves rather than meeting at right angles",
          "Earth-derived color — sage, clay, moss and driftwood tones at low-to-moderate saturation",
          "Soft asymmetry — balance built through weight and rhythm, not through mirrored centering",
        ],
      },
      {
        heading: "The biomorphic preset",
        body: [
          "The preset starts from a sage green — the most earth-believable base — keeps the family analogous so the palette stays in a natural neighborhood, rounds the radius to soften corners into flowing edges, pairs a humanist typeface for warmth, and drops saturation so tones read like pigment rather than plastic.",
          "Note that the preset deliberately leaves shape to you. A generator can hand you believable earth colors, but flowing boundaries and organic silhouettes are layout and illustration work. The palette gets you most of the calm on its own; the organic form language is the remaining twenty percent you add in the components.",
        ],
        links: [
          { label: "Open the biomorphic preset in the generator", href: "/design-system?primary=6f9f6e&strategy=analogous&radius=round&fonts=humanist&sat=-5" },
        ],
        tip: "Organic shapes love muted color, and muted color loves to fail contrast. Keep body text on the lightest natural surface and let the organic flourish live in cards and buttons — not under paragraphs.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "The roles fold into a calm ladder. Background is the pale linen the page sits on; surface is the slightly deeper sage of cards; primary is the mid-sage that buttons and links press; and accent is one warm earth tone — a clay gold — used sparingly for moments that should feel alive, like a live dot or a highlighted stat:",
        ],
        code: `:root {
  --background: #f4f6f0;
  --surface: #eef2e8;
  --primary: #6f9f6e;
  --secondary: #7da487;
  --accent: #c2a05a;
  --foreground: #23301f;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Swap the sage for clay, moss, or sea-grey and the natural mood follows; the analogous strategy keeps whatever family you choose grounded. In the previews, let the round radius and humanist pairing do the organic work — layering actual irregular shapes into the UI is where this style quietly turns into a rendering bug, especially in the ecommerce view.",
          "Keep the accent deserved. Because the whole palette is quiet, one warm clay tone instantly reads as a highlight, which means it can power the primary call to action without adding a loud hue. Give the accent a strict job list — live states, one featured number, the active dot — and the calm never has to compete with the interaction.",
        ],
      },
    ],
  },
{
    slug: "maximalist-editorial-design-system",
    title: "Maximalist editorial: type as the loudest element",
    metaTitle: "Maximalist Editorial — Dramatic Type Theme",
    description:
      "Maximalist editorial interface design: dramatic scale, layered typography, dense rhythm, vivid color blocks. Generate the bold style with a ChromaBrew preset.",
    excerpt:
      "Oversized headlines, layered type, color blocks. The maximalist editorial style makes hierarchy the experience — here's the preset.",
    image: "/blog/maximalist-editorial-design-system.svg",
    imageAlt: "Maximalist editorial style preset palette swatches",
    publishedAt: "2026-09-01",
    category: "Design styles",
    tags: ["maximalist", "editorial", "typography", "design system"],
    relatedHrefs: ["/tools/typography-scale-generator", "/tools/color-palette-generator", "/tools/design-token-generator"],
    keyword: "maximalist editorial",
    sections: [
      {
        heading: "When hierarchy is the content",
        body: [
          "Maximalist editorial turns the hierarchy itself into the experience: oversized headlines that dominate the viewport, layered and overlapping typography, dense rhythmic layouts, and vivid color blocks slammed against each other. It's magazine energy — culture brands, media companies and loud portfolios use it to feel alive and opinionated.",
          "Recognize it by scale and density: dramatic type that breaks the grid, nested layers of text and shape, tight editorial rhythm where every inch is doing something, and color blocks used with confidence. The hidden rule is that drama needs a reference point — a layer of calm text and whitespace underneath is what makes the loud parts loud.",
          "The style descends from poster and magazine masthead design, where a single page fought for one second of attention. That heritage is why it works online: the web is an attention auction, and an editorial interface makes its bid with scale rather than noise. The professional executions exercise restraint precisely where amateurs don't — loud everywhere is not maximalism, it is spam for the eyes.",
        ],
      },
      {
        heading: "How to recognize it",
        body: [
          "Four qualities separate a designed maximalist editorial system from a cluttered page:",
        ],
        bullets: [
          "Dramatic scale — one or two type sizes tower over everything else; the headline owns the viewport",
          "Layered composition — text blocks overlap and cross the grid with purpose, never by accident",
          "Dense rhythm — small holdings, rules and labels fill the space; nothing sits lonely",
          "Confident color blocks — one or two full-strength slabs at a time, placed hard against the grid",
        ],
      },
      {
        heading: "The maximalist editorial preset",
        body: [
          "The preset sets a vivid crimson as the master headline hue, a strong blue and an amber for the block-and-accent work, keeps the family related through split-complementary strategy, sharpens the radius so color blocks land as hard slabs, and pairs an editorial serif with the most generous type ratio in the generator — because this style is nearly all type.",
          "Split-complementary earns its place here by keeping the crimson master and its two assistants on speaking terms: blue sits a real distance away for block contrast, while amber nests near the crimson so it can read as a highlight that belongs to the same story. The visible hierarchy — one hue clearly in charge — is the entire discipline of the style.",
        ],
        links: [
          { label: "Open the maximalist editorial preset in the generator", href: "/design-system?primary=e11d48&secondary=2563eb&accent=f59e0b&strategy=split-complementary&radius=sharp&fonts=editorial&ratio=1.333" },
          { label: "Preview the generous type ratio", href: "/tools/typography-scale-generator" },
        ],
        tip: "Layered type over color blocks is where reading collapses. Give headlines a legible background or real contrast step, keep body text on solid light surfaces, and let one hue dominate while the other two stay accents — three full-strength blocks at once is noise.",
      },
      {
        heading: "How the color roles land in this style",
        body: [
          "The roles here are ninety percent dosage. The crimson primary takes the master headline and the one hero block; the blue secondary owns the second-tier blocks and structural rules; the amber accent marks small metadata and the single live call to action; and everything else stays on white or near-white so the loud parts can be loud. One master hue, two helpers, a plain ground:",
        ],
        code: `:root {
  --background: #ffffff;
  --surface: #f7f7f3;
  --primary: #e11d48;
  --secondary: #2563eb;
  --accent: #f59e0b;
  --foreground: #17171a;
}`,
        codeLang: "css",
      },
      {
        heading: "Adapt it",
        body: [
          "Any crimson-family brand works; the anchoring move is keeping the dominant hue dominant. Use the marketing preview to judge headline scale, the SaaS preview to confirm the density stays usable in a working tool, and the generous ratio across all four — then shave the palette down rather than up if the previews feel frantic.",
          "Keep the scale strategy explicit in the tokens. With a 1.333 ratio, the jump from body to display is enormous — and that is the point — but it only holds if body copy stays small, quiet and mechanically readable. The moment body type starts shouting, the style reads as chaos instead of hierarchy. Calm text is not a compromise here; it is the mechanism.",
        ],
      },
    ],
  },
{
    slug: "brand-color-palettes",
    title: "Famous brand colour palettes: exact hex values and how to use them",
    metaTitle: "Brand Color Palettes — Exact Hex Values",
    description:
      "Exact brand colour hex values for 100+ famous companies — Spotify, Stripe, Netflix and more — and how to turn any brand colour into an accessible design system.",
    excerpt:
      "Spotify green, Stripe indigo, Netflix red — exact brand hex values plus a workflow for turning any brand colour into an accessible design system.",
    image: "/blog/brand-color-palettes.svg",
    imageAlt: "Exact hex values for famous brand colors: Spotify green and Stripe indigo",
    publishedAt: "2026-09-08",
    category: "Color theory",
    tags: ["brand colors", "brand colour palettes", "hex values", "color palette", "design system"],
    relatedHrefs: ["/tools/brand-palettes", "/design-system", "/tools/color-palette-generator", "/tools/color-converter"],
    keyword: "brand colour palettes",
    sections: [
      {
        heading: "Every brand colour is a design decision you can borrow",
        body: [
          "A brand colour is a compressed design decision. The stripe next to Spotify's name is a specific green that survived years of designers, focus groups and legal trademark screens. Stripe's indigo reads as fintech before the logo is even legible. These values are not random — they were tuned to be recognised at a glance and to hold up in real products.",
          "That makes them excellent starting colours for your own work. A brand palette is a hue that already passes the two tests your palette will eventually face: it is distinctive, and it performs on screen. Borrowing one as a seed is not copying a brand, it is starting from a colour that has already been battle-tested.",
        ],
      },
      {
        heading: "Where these hex values come from",
        body: [
          "Most brands publish official colour values in their press kits and brand guidelines — the same documents agencies use to build their decks. Our brand palettes dataset in /tools/brand-palettes collects 100+ of these widely published reference values, grouped by sector, so you can browse without tab-hopping through corporate PDFs.",
          "Be aware of what the data is and is not. The values are widely published references rather than legal swatches, they cover only the primary brand colour (most brands have whole systems behind them), and using them does not mean the brand endorses your project. Treat them as starting points, not licences.",
        ],
      },
      {
        heading: "The exact values",
        body: [
          "Here are a handful with the numbers next to them, exactly as they appear in the dataset:",
        ],
        bullets: [
          "Stripe — #635BFF, the indigo that owns modern fintech",
          "Spotify — #1DB954, a green that survives against dark and light backgrounds",
          "Netflix — #E50914, pure alarm red but restrained to a single surface",
          "Slack — #4A154B, a plum chosen for calm long-session software",
          "Instagram — #E4405F, the gradient core of the app icon",
          "Figma — #A259FF, a violet aimed squarely at the design audience",
        ],
      },
      {
        heading: "Start a design system from a brand colour",
        body: [
          "The workflow we built ChromaBrew around takes one hex and does the rest: banks of shades from 50 to 950, semantic tokens, light and dark themes, WCAG contrast checks and production exports. A brand colour is the perfect first input, because it anchors the whole system in a hue you already trust.",
          "Open the generator, drop in the hex, and the scale, tokens and previews follow the hue end to end. From Stripe indigo, the mechanical result looks like this:",
        ],
        code: `:root {
  --background: #f5f4ff;
  --surface: #ffffff;
  --primary: #635bff;
  --secondary: #7a6ff2;
  --accent: #7c3aed;
  --foreground: #1e1b2e;
}`,
        codeLang: "css",
        links: [
          { label: "Browse 110+ real brand colours", href: "/tools/brand-palettes" },
          { label: "Seed the generator with Stripe indigo", href: "/design-system?primary=635bff" },
        ],
        tip: "A brand colour is a starting point, not a licence. Use it as the seed for your own scale and tokens — and don't imply affiliation with the brand whose hue you borrowed.",
      },
      {
        heading: "Why a brand colour is such a good seed",
        body: [
          "A hue-anchored scale inherits the properties of its seed. If Spotify's green reads clearly in an app icon at 16 pixels, the 700 step of a scale derived from that same hue carries the same clarity. You skip the hardest part of palette design — picking a hue that is both distinctive and usable — and jump straight to the structural work of shades, roles and contrast.",
          "The caveat is that a hue is not a palette. The perceptual distance between your brand hue and the neutrals, the darkness of your surface stack, and the exact ratio your typography needs against it are all decisions the generator still has to make. That is precisely what the seed workflow is for: the hue arrives ready, everything downstream is derived and checked.",
        ],
      },
      {
        heading: "Copy it exactly — then make it yours",
        body: [
          "Exactness matters more than people expect. #635BFF and #645CFF are different colours to the eye, and a hex value is a promise you either keep or quietly break. Copy the exact value from the brand palette entry, then regenerate the scale so every derived shade stays true to that hue. Your system can borrow the anchor while being entirely your own.",
        ],
        links: [
          { label: "Check your brand colours for WCAG contrast", href: "/tools/wcag-palette-checker" },
        ],
      },
    ],
  },
  {
    slug: "hex-rgb-hsl-cmyk-which-format",
    title: "HEX, RGB, HSL and CMYK: which colour format should you use?",
    metaTitle: "HEX vs RGB vs HSL vs CMYK — Which to Use",
    description:
      "HEX, RGB, HSL, CMYK and OKLCH compared: what each colour format is for, when it makes sense, and how to convert between them without losing colour.",
    excerpt:
      "Four formats, one colour. When to write hex, when to reach for HSL, why CMYK only matters for print, and why OKLCH beats all of them for scaling colours.",
    image: "/blog/hex-rgb-hsl-cmyk.svg",
    imageAlt: "HEX, RGB, HSL and CMYK colour formats compared",
    publishedAt: "2026-09-09",
    category: "Color theory",
    tags: ["hex", "rgb", "hsl", "cmyk", "oklch", "color converter", "color format"],
    relatedHrefs: ["/tools/color-converter", "/tools/color-palette-generator", "/tools/contrast-checker"],
    keyword: "color format",
    sections: [
      {
        heading: "Four ways to say the same colour",
        body: [
          "The colour your browser displays can be written as #47003A, rgb(71, 0, 58), hsl(326, 100%, 14%) or cmyk(0, 100, 18, 72) — four notations, one identical hue on screen. They are not different colours, they are different vocabularies, and each one was designed around a different job. The format you reach for should be chosen by the job, not habit.",
          "That framing settles most format arguments immediately. Storage, editing, print and perceptual scaling each have a natural fit, and the mismatch — using a perceptual format for storage, or a print format for CSS — is where the practical pain comes from.",
        ],
      },
      {
        heading: "HEX: compact storage, opaque meaning",
        body: [
          "#47A248 is six hex digits in three pairs that are literally R, G and B written in base-16. It is the CSV of colour: compact, unambiguous, pasteable anywhere, and nearly impossible to reason about. You cannot look at a hex value and know whether the colour is dark or saturated — the encoding hides the meaning.",
          "Use hex as the interchange format. It is what design tools, brand guidelines and code exports share. It is also precisely the format you should avoid editing by hand, because editing a value you cannot read is guessing.",
        ],
      },
      {
        heading: "RGB: channels you can feel",
        body: [
          "rgb(71, 0, 58) is the same colour written for the additive physics of a screen: each channel 0–255, mixed like light. The model is intuitive at the channel level — raise the red, the colour warms — and it is the honest representation of how a monitor actually works.",
          "But channel intuition breaks the moment you want qualitative edits. Making a colour 'darker' is not subtracting a constant from every channel; that shifts the hue. RGB is the vocabulary of hardware, not the vocabulary of design intent.",
        ],
      },
      {
        heading: "HSL: built for editing",
        body: [
          "hsl(326, 100%, 14%) is the first format designed around how humans describe colour: hue around a circle, saturation as a percentage, lightness as a percentage. 'Take the hue and make it lighter' is a one-variable edit. This is why colour pickers and design tools let you work in HSL instead of channel triplets.",
          "The catch is perceptual unevenness: a 10% lightness step near the dark end feels much larger than the same step near the middle. HSL is a brilliant editor's vocabulary and a mediocre scaler's vocabulary. For scaling, you want the next format.",
        ],
      },
      {
        heading: "CMYK: beloved only by printers",
        body: [
          "cmyk(0, 100, 18, 72) is subtractive ink percentages — cyan, magenta, yellow, key (black) — and it exists because paper subtracts light instead of adding it. It is indispensable for print: business cards, packaging and brand collateral are specified in CMYK because inks mix differently from pixels.",
          "On screen it is a translation, not a native language. No CSS property, design system or web colour conversation uses CMYK directly, but you will still need to read it when a print designer hands you a brand value in inks. Convert it to hex — that is the version your code and your design system actually consume.",
        ],
      },
      {
        heading: "Why OKLCH matters more than all of them",
        body: [
          "OKLCH is the perceptual answer to HSL's unevenness: its lightness axis matches how humans actually judge brightness, so equal steps are equal to the eye. That is why ChromaBrew derives its entire 50–950 scale in OKLCH — a 700 that is 'one perceptible step' from 600, instead of a number that happens to be 100 apart.",
          "For daily work you still convert into hex to communicate, but you should generate and scale in a perceptual space and translate at the boundary. There is more depth on the trade-offs in our earlier guide.",
        ],
        links: [
          { label: "Deeper dive: HEX vs HSL vs OKLCH", href: "/blog/hex-vs-hsl-vs-oklch" },
        ],
      },
      {
        heading: "Convert without losing the colour",
        body: [
          "Every format in this post is a different spelling of the same hue, and converting should never change the colour. Our colour converter parses any recognisable colour and emits every format side by side — hex, RGB, HSL, CMYK and OKLCH — live, with one-click copy. The same #47003A reads across all five vocabularies:",
        ],
        code: `HEX:  #47003A
RGB:  rgb(71, 0, 58)
HSL:  hsl(326, 100%, 14%)
CMYK: cmyk(0, 100, 18, 72)
OKLCH: oklch(0.162 0.111 324.1)`,
        codeLang: "text",
        links: [
          { label: "Open the colour converter", href: "/tools/color-converter" },
        ],
        tip: "When you hand a colour to a colleague, send the format their tool expects and the hex alongside it — hex is the lowest-common-denominator everyone can paste.",
      },
    ],
  },
  {
    slug: "css-named-colors",
    title: "CSS named colors: the full list of 148 and when to use them",
    metaTitle: "CSS Named Colors — The Full List of 148",
    description:
      "All 148 CSS named colours, the ones worth remembering, when a color name beats a hex value, and how to find the closest named color to any hex.",
    excerpt:
      "tomato, rebeccapurple, deeppink — 148 CSS color names exist and most are unforgettable in the wrong way. When to use them, when not to, and how to find the nearest one.",
    image: "/blog/css-named-colors.svg",
    imageAlt: "CSS named color keywords shown as swatches",
    publishedAt: "2026-09-10",
    category: "Development",
    tags: ["css named colors", "css color names", "css", "web development", "color"],
    relatedHrefs: ["/tools/color-names", "/tools/color-converter", "/tools/color-palette-generator", "/tools/design-token-generator"],
    keyword: "css named colors",
    sections: [
      {
        heading: "Colours already have names in CSS",
        body: [
          "Before hex was invented, software specified colours with words, and CSS kept that vocabulary. The color property accepts 148 named values — from the obvious blue to the suspicious lightgoldenrodyellow — and they all map to exact, fixed hex colours. Named colors are a real token type, not a shorthand: tomato is precisely #FF6347, forever.",
          "In practice most people use a dozen of them and think that is the entire feature. The other 130+ are a useful resource for prototyping, documentation and tests, and a few are arguably the best-looking colours CSS has to offer.",
        ],
      },
      {
        heading: "The complete list",
        body: [
          "Here are all 148 keywords, grouped by colour family for scanning. gray and grey, aqua and cyan, fuchsia and magenta are aliases that resolve to the same hex:",
        ],
        code: `Reds/oranges: red, darkred, firebrick, indianred, brown, maroon, salmon, darksalmon, lightsalmon, coral, tomato, orangered, orange, darkorange, gold, goldenrod, darkgoldenrod, peru, chocolate, saddlebrown, sienna
Pinks/violets: pink, lightpink, hotpink, deeppink, palevioletred, mediumvioletred, violet, plum, orchid, thistle, magenta/fuchsia, mediumorchid, mediumpurple, lavender, purple, rebeccapurple, indigo, darkmagenta, darkviolet, blueviolet
Blues/teals: blue, mediumblue, darkblue, navy, royalblue, dodgerblue, cornflowerblue, steelblue, lightskyblue, skyblue, deepskyblue, lightblue, powderblue, lightsteelblue, cadetblue, teal, cyan/aqua, darkturquoise, turquoise, mediumturquoise, darkcyan, aquamarine, mediumaquamarine, lightseagreen, mediumseagreen, seagreen
Greens/olives: green, darkgreen, forestgreen, lime/limegreen, lawngreen, chartreuse, greenyellow, yellowgreen, olivedrab, darkolivegreen, olive, yellow, khaki, darkkhaki, palegoldenrod
Neutrals/browns: black, white, gray/grey, darkgray/darkgrey, dimgray/dimgrey, lightgray/lightgrey, slategray/slategrey, darkslategray/darkslategrey, lightslategray/lightslategrey, gainsboro, silver, whitesmoke, snow, floralwhite, linen, seashell, oldlace, beige, ivory, cornsilk, blanchedalmond, bisque, antiquewhite, navajowhite, moccasin, papayawhip, peachpuff, sandybrown, tan, burlywood, wheat, rosybrown
Blues/grays/lights: aliceblue, azure, mintcream, honeydew, ghostwhite, lavenderblush, lavender, mistyrose, lightcyan, lightgoldenrodyellow, lightyellow, lightgreen, palegreen, paleturquoise, palevioletred`,
        codeLang: "text",
      },
      {
        heading: "When a name beats a hex value",
        body: [
          "Named colors win when the exact hue is not yet the point. In a prototype, `background: tomato` communicates intent ('we want something tomato-ish here') in a way a hex never can. The same is true in design-token documentation, where `--error: firebrick` reads better than `--error: #B22222` in a bullet point, and in tests, where asserting against an expressive keyword makes failures explainable.",
          "There is a cheaper reason to love them too: they are self-documenting. `color: gold` in a chart legend is a sentence; `color: #FFD700` is homework. For throwaway exploration the readability of a keyword is worth more than the precision you are not using yet.",
        ],
      },
      {
        heading: "When a name is a trap",
        body: [
          "The traps are real. There is no consistent rule to remember which of the 148 your reader knows — hotpink is a specific, saturated magenta-pink, not 'sort of pink'. Aliases multiply confusion (gray and grey are both valid and identical, and slack `green` implies a pure #008000 that most teams do not actually want). And a name carries assumed meaning: a colleague will read `--brand: purple` as a decision, not a placeholder.",
          "The sharpest trap is semantic. `color: green` in a report about environmental data collides with the pre-existing meaning of the word in that context. The moment a colour name is doing double duty as content, switch it to hex or a token.",
        ],
      },
      {
        heading: "Find the closest named colour to any hex",
        body: [
          "When you have a hex and want its nearest keyword, the honest way to compare is perceptual distance — the OKLCH space, not raw RGB difference. Take your value, compute its position, and pick the named colour with the smallest distance. In practice the closest keyword is usually a small shrug: your carefully tuned #5833FF lands nearest to rebeccapurple, which confirms you are one step away from a name that ships.",
          "You can run that comparison by hand with the colour converter: paste your hex and read the OKLCH output, then test candidate keywords until one lands close. Or skip the arithmetic — the colour names tool measures all 148 keywords against your value in OKLab and lists them closest first. If nothing is within a perceptually small distance, use the hex — approximating a precise colour down to a name you half-like is the worst trade in this article.",
        ],
        links: [
          { label: "Find your closest named colour", href: "/tools/color-names" },
          { label: "Check your colours in the converter", href: "/tools/color-converter" },
          { label: "Generate a scale from any colour", href: "/tools/color-palette-generator" },
        ],
      },
      {
        heading: "The ones worth remembering",
        body: [
          "Most names are for completeness; these do real daily work and are worth committing to memory:",
        ],
        bullets: [
          "black, white, gray, silver — the four reliable neutrals",
          "red, green, blue, yellow, orange — status-color primaries",
          "tomato, coral, gold, skyblue, dodgerblue — pleasant mid-tones for charts and accents",
          "crimson, firebrick, indigo, deeppink, rebeccapurple — unmistakable statement colours",
        ],
        tip: "Reach for a named colour when the exact hue does not matter yet — the moment a designer starts eyeballing the difference between tomato and coral, switch to hex or a token.",
      },
    ],
  },
  {
    slug: "types-of-color-blindness",
    title: "Types of color blindness: a practical guide for designers",
    metaTitle: "Color Blindness Types — Protan, Deutan, Tritan",
    description:
      "The eight types of color vision deficiency, how common each one is, how they differ genetically and perceptually, and what that means for your color decisions.",
    excerpt:
      "Protans, deutans, tritans and monochromacy — the full cast of color vision deficiency, with honest prevalence numbers and what each means for your palette.",
    image: "/blog/types-of-color-blindness.svg",
    imageAlt: "A red and green pair shown under normal vision and then under a deutan simulation",
    publishedAt: "2026-09-11",
    category: "Accessibility",
    tags: ["color blindness", "color vision deficiency", "cvd", "accessibility", "wcag"],
    relatedHrefs: ["/tools/color-blindness-simulator", "/tools/contrast-checker", "/tools/color-names"],
    keyword: "types of color blindness",
    sections: [
      {
        heading: "Color vision deficiency, not color blindness",
        body: [
          "The first correction worth making is vocabulary. Most people with color vision deficiency (CVD) are not blind to color at all — they see color, just differently. True blindness to all color exists, but it is vanishingly rare. The umbrella term is color vision deficiency, and 'color blindness' is the common shorthand that most people actually mean when they talk about it.",
          "CVD is common enough that you design for someone with it every day: roughly 1 in 12 men (about 8%) and 1 in 200 women (about 0.5%) have some form. Because the most common types are carried on the X chromosome, the vast majority of affected people are male. This isn't a niche. It is a normal, permanent part of your audience.",
          "The key idea for the rest of this article is the 'eight conditions': for each of the three cone families there is a full form (no cones of that type) and a milder form (reduced sensitivity), plus the rare total forms. Design against the worst case and the milder cases are covered automatically.",
        ],
      },
      {
        heading: "Three cone types, three axes of failure",
        body: [
          "Typical human color vision is trichromatic: three types of cone cell in the retina respond to short (blue), medium (green) and long (red) wavelengths, and the brain mixes their signals into every color you see. Color vision deficiency happens when one of those cone populations is missing or behaves abnormally.",
          "That gives the natural axes of classification. Problems with the long-wavelength (red) cones are protan; problems with the medium-wavelength (green) cones are deutan; problems with the short-wavelength (blue) cones are tritan. Protan and deutan are both colloquially 'red-green', which is accurate about symptoms but hides that they are separate conditions with different genetics.",
        ],
      },
      {
        heading: "The red-green conditions: protan and deutan",
        body: [
          "Red-green deficiency is by far the most common and is what most people picture. Among men: deuteranomaly (reduced green sensitivity) affects around 4.6%, deuteranopia and protanopia (missing green or red cones) around 1.2–1.3% each, and protanomaly (reduced red sensitivity) around 1%. The anomalies outnumber the full forms, which is why it matters that your design survives the milder cases too — they are the ones most of your users with CVD actually have.",
          "People with protan and deutan conditions both struggle to tell reds apart from greens — a red berry against green foliage vanishes, a red error message against a green success next to it turns into two similar buttons. The difference between the two families shows up in brightness: protans see reds as darker (pure red collapses toward a dark brown-grey), deutans barely change overall brightness. Both are inherited, sex-linked traits: a mother can pass them to her sons, and a father never passes them to his.",
        ],
      },
      {
        heading: "The blue-yellow conditions: tritan",
        body: [
          "Tritan deficiency — tritanopia (no blue cones) and tritanomaly (reduced blue sensitivity) — is much rarer, roughly 0.01% of the population, and behaves differently. It is not concentration on the X chromosome, so it affects men and women about equally, and it can also be acquired later in life by eye disease or some medications, unlike the red-green forms which are present from birth.",
          "With tritan deficiency, blue and yellow pairs collapse: navy text on a near-black background, or yellow status indicators on white. Because it can develop over time, a user in your audience may lose blue-yellow discrimination during the lifetime of your product.",
        ],
      },
      {
        heading: "Total color blindness: monochromacy",
        body: [
          "Monochromacy — complete color blindness, called achromatopsia in its rod-only form — is the rarest and most severe, around 1 in 30,000 people. The world appears in shades of grey, at reduced acuity, and people with achromatopsia are often sensitive to bright light.",
          "It is the only CVD where color genuinely disappears. Everything you make must work in grey for these users — which is a brutal, useful design exercise: if a design reads correctly in greyscale, achromatopsia is handled.",
        ],
      },
      {
        heading: "What it means for your color decisions",
        body: [
          "The habits that protect your users are simple and concrete. Never let color be the only channel: pair any color-coded meaning with a second cue like a label, icon, pattern or position. Remember what 'red-green' actually means: a red/green pair that passes WCAG contrast by lightness alone can still collapse together for a deutan user, because contrast is computed from lightness, not hue.",
          "Then verify with a simulator. Run your prototype or a representative screenshot through every condition — worst case first (full forms), then the milder anomalies — and check that your key pairs stay distinguishable. If two colors in a chart differ only in hue and land below the color-difference threshold after simulation, swap one for a different hue family or add a shape cue. Roughly 8% of men depend on you getting this right.",
        ],
        bullets: [
          "deuteranomaly ~4.6%, protanopia/protanomaly ~1.2–1.3% each, deuteranopia ~1.2% of men",
          "tritanopia and tritanomaly ~0.01%, men and women equally",
          "achromatopsia ~1 in 30,000 — total loss of color",
        ],
        tip: "Design against the full conditions (the worst case) and the milder anomalous forms are automatically covered. When a pair fails a check, the fix is usually a different hue family plus a non-color cue — not a tiny tweak of the same hue.",
        links: [
          { label: "Preview colors and images under all eight conditions", href: "/tools/color-blindness-simulator" },
          { label: "Grade a pair with the WCAG contrast checker", href: "/tools/contrast-checker" },
          { label: "Find the closest named colour for any hue", href: "/tools/color-names" },
        ],
      },
    ],
  },
];

/* Daily tutorials, one going live per day — see posts-tutorials-{a,b,c}. */
BLOG_POSTS.push(...TUTORIAL_POSTS_A, ...TUTORIAL_POSTS_B, ...TUTORIAL_POSTS_C);

export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

/**
 * A post is live once its publishedAt date (UTC) has been reached.
 * Future-dated posts stay invisible to the blog index, sitemap and
 * related-article lists until then; the publish cron triggers a rebuild
 * after each date so the post goes live without a code change.
 */
export function isPostLive(post: Pick<BlogPost, "publishedAt">, now: Date = new Date()): boolean {
  const published = Date.parse(`${post.publishedAt}T00:00:00Z`);
  return Number.isNaN(published) || published <= now.getTime();
}

export function livePosts(now: Date = new Date()): BlogPost[] {
  return BLOG_POSTS.filter((post) => isPostLive(post, now));
}

export function postsByCategory(): { category: string; posts: BlogPost[] }[] {
  const map = new Map<string, BlogPost[]>();
  for (const post of livePosts()) {
    const list = map.get(post.category) ?? [];
    list.push(post);
    map.set(post.category, list);
  }
  return [...map.entries()].map(([category, posts]) => ({ category, posts }));
}
