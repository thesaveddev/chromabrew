export interface PostSection {
  heading: string;
  /** Paragraphs / list items rendered under the heading. */
  body: string[];
  /** Support bullet point. */
  bullets?: string[];
  /** Info callout. */
  tip?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
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
    slug: "how-to-build-an-accessible-color-palette",
    title: "How to build an accessible color palette (2026 guide)",
    metaTitle: "How to Build an Accessible Color Palette — WCAG AA/AAA Guide",
    description:
      "Learn how to build an accessible color palette from a single brand color: shades, tints, semantic roles, and WCAG AA/AAA contrast checks — with a free generator.",
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
          "Every accessible palette starts in one place: a single seed color. Pick the primary brand color that represents your product — this becomes the anchor for everything else.",
          "From there you expand outward into a full scale of tints and shades. Rather than manually lightening and darkening hex values (which produces muddy, inconsistent steps), the scale should be computed in a perceptually uniform color space like OKLCH.",
        ],
        tip: "In OKLCH, evenly spaced steps look evenly spaced to the eye. Stepping raw HEX values produces scales where some steps look identical and others jump wildly.",
      },
      {
        heading: "Generate a perceptual 50–950 scale",
        body: [
          "Design systems generally use an eleven-step scale from very light (50) to very dark (950). The base brand color typically sits around the 500 step, with lighter tints above and darker shades below.",
          "A perceptually even scale gives you reliable options for every UI surface: backgrounds, borders, surfaces, text, and actions all need a consistent set of values that harmonize.",
        ],
        bullets: [
          "50–200: light tints for backgrounds and surfaces",
          "300–400: soft accents and disabled states",
          "500: the brand base color",
          "600–700: hover and active states",
          "800–950: strong text and high-contrast accents",
        ],
      },
      {
        heading: "Define semantic roles, not just swatches",
        body: [
          "An accessible palette is more than a row of pretty swatches. Map each scale step to a semantic role — background, foreground, primary, surface, border — so components consume meaning instead of hard-coded values.",
          "Semantic roles update in one place. If you retheme, you swap the mapping, not every button across your app.",
        ],
        tip: "Semantic tokens (like --color-background and --color-foreground) are what make a design system maintainable and accessible by default.",
      },
      {
        heading: "Check every foreground/background pair",
        body: [
          "Accessibility is about contrast between pairs, not individual colors. Every text color must be checked against the background it sits on.",
          "The WCAG 2.x thresholds are: 4.5:1 for normal text (AA), 7:1 for normal text (AAA), and 3:1 for large text (AA). A single palette can have failing pairs — the fix is to adjust lightness while keeping the hue.",
          "Use a palette checker that tests every combination at once so you catch failures before they ship, not after.",
        ],
        tip: "Ask for automatic fix suggestions: adjust a failing color's lightness along the OKLCH lightness axis to meet the threshold while preserving the brand hue.",
      },
      {
        heading: "The one-click workflow",
        body: [
          "Put it together and the whole process can be one step: pick a color, generate an accessible scale, define semantics, and export as CSS variables or JSON tokens. No sign-up, everything runs in your browser.",
        ],
      },
    ],
  },
  {
    slug: "hex-vs-hsl-vs-oklch",
    title: "HEX vs HSL vs OKLCH: which color space should you use?",
    metaTitle: "HEX vs HSL vs OKLCH — Which CSS Color Space to Use",
    description:
      "HEX, HSL and OKLCH compared: how each color space works, when to reach for it, and why perceptually uniform OKLCH wins for design systems.",
    excerpt:
      "Three color spaces, three jobs. Here's what HEX, HSL and OKLCH actually are and when each earns its place.",
    publishedAt: "2026-08-21",
    category: "Color theory",
    tags: ["hex", "hsl", "oklch", "css", "design tokens"],
    relatedHrefs: ["/tools/hex-to-rgb", "/tools/hex-to-hsl", "/tools/design-token-generator"],
    keyword: "HEX vs HSL vs OKLCH",
    sections: [
      {
        heading: "HEX: the universal ID",
        body: [
          "HEX is a base-16 encoding of red, green and blue channels, written as #3a86ff. It's compact, everywhere, and instantly recognizable, but it's a machine representation — it tells you nothing about how a human perceives the color.",
          "Use HEX for storing and sharing exact color values, exporting from design tools, and pasting into config files. It's the lingua franca of the web.",
        ],
      },
      {
        heading: "HSL: the human-friendly model",
        body: [
          "HSL stands for hue, saturation and lightness. It structures a color the way people actually think about it — what hue is it, how saturated, how light or dark?",
          "This makes HSL great for creating variations: pull lightness down for a darker hover state while keeping the same hue. But HSL has a hidden flaw — it is not perceptually uniform. A lightness jump at 90% looks very different from the same jump at 40%.",
          "Use HSL when you need to reason about a color's relationship to lightness or hue in simple, readable ways.",
        ],
        tip: "All three are freely convertible — you can paste any HEX into ChromaBrew and get instant hsl() and oklch() readouts.",
      },
      {
        heading: "OKLCH: the perceptually uniform future",
        body: [
          "OKLCH is a modern color space designed to match human perception. Equal steps in OKLCH lightness, chroma (saturation) and hue look equal to the eye — which is exactly what you want when generating color scales.",
          "That's why design systems increasingly compute scales in OKLCH and store them as oklch() in modern CSS. ChromaBrew generates every palette and shade scale in OKLCH, then converts to the most compatible output for you.",
        ],
        bullets: [
          "HEX: exact reference values, machines, exports",
          "HSL: reasoning about lightness/hue, readable variations",
          "OKLCH: perceptually even scales and design-system generation",
        ],
      },
      {
        heading: "When you don't need to choose",
        body: [
          "In practice you rarely hand-pick one everywhere. Store source colors in HEX or oklch(), derive scales perceptually, and export whatever your stack consumes. The generator does the conversion so you can work in whichever is clearest for the task.",
        ],
      },
    ],
  },
  {
    slug: "tailwind-v4-color-scale-from-one-color",
    title: "Generate a Tailwind v4 color scale from one color",
    metaTitle: "Tailwind v4 Color Scale — Generate @theme From One Color",
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
          "Tailwind CSS v4 moved color configuration into native CSS custom properties using the @theme directive. You declare --color-* variables and utilities like bg-brand-600 and text-brand-300 are generated automatically.",
          "Because it's plain CSS, you can paste the block straight into your stylesheet entry file.",
        ],
        tip: "Run the @theme block into your CSS entry and Tailwind v4 picks up bg-brand-500, text-brand-700 and every other color utility without extra config.",
      },
      {
        heading: "Why a perceptual 50–950 scale",
        body: [
          "Tailwind's convention is an eleven-step scale from 50 to 950. Generate each step in OKLCH so tints stay bright and shades stay rich — no washed-out lights or muddy darks.",
          "The base brand color maps to the 500 step, which is the natural default for primary actions and links.",
        ],
      },
      {
        heading: "Rename and reuse",
        body: [
          "You can rename the generated scale before copying — every variable and utility reference follows along. Build a whole multi-color theme (brand, accent, neutral) from separate seed colors and combine the blocks.",
        ],
        tip: "Pair the scale with a contrast check so your brand-900 on brand-50 and similar combinations actually meet WCAG AA.",
      },
    ],
  },
  {
    slug: "dark-mode-the-right-way",
    title: "Dark mode the right way: don't just invert your colors",
    metaTitle: "Dark Mode Design — Semantic Tokens, Not Color Inversion",
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
        heading: "Why inversion fails",
        body: [
          "A naive dark theme inverts light mode brightness. The result is harsh: saturated accents glow awkwardly against near-black, and raised surfaces behave backwards. In dark mode, raised layers should get lighter — not darker — to read as \"higher\".",
        ],
      },
      {
        heading: "Model elevation with semantic tokens",
        body: [
          "Use semantic tokens for backgrounds (background, surface, surface-raised, overlay) instead of hard-coded grays. In dark mode, elevation is expressed by increasing lightness: background is darkest, each surface above it is slightly lighter, cards sit above surfaces, and overlays/menus sit highest.",
          "Saturated accents also need desaturating in the dark so they feel calm instead of neon.",
        ],
      },
      {
        heading: "Check contrast in both themes",
        body: [
          "Every foreground/background pair must pass WCAG in both light and dark. Because dark surfaces are near-black, you get lots of headroom for light text — but watch pairs like accent-on-surface, which can slip.",
          "A generator that checks contrast automatically and adjusts lightness along the OKLCH axis keeps both themes accessible with one click.",
        ],
        tip: "Export CSS variables or JSON tokens and you can ship light + dark from a single source of truth.",
      },
    ],
  },
  {
    slug: "svg-vs-jpg-when-to-use-which",
    title: "SVG vs JPG: when to use which (and how to convert)",
    metaTitle: "SVG vs JPG — When to Use Each and How to Convert",
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
          "SVG is vector — it describes shapes as math (paths, rectangles, curves) and scales infinitely without losing quality. JPG is raster — a grid of pixels fixed to a resolution; scaling up blurs it.",
          "That rule decides most other differences between the two.",
        ],
        bullets: [
          "Scaling: SVG stays sharp at any size; JPG degrades as you enlarge",
          "Transparency: SVG supports it; JPG does not (it needs a background)",
          "File size: SVG wins for logos and icons; JPG wins for photos",
          "Editing: SVG is editable in code and design tools; JPG is a finished image",
        ],
      },
      {
        heading: "When to use SVG",
        body: [
          "Logos, icons, illustrations, charts and diagrams — anything geometric or flat. SVGs are typically small, crisp, and can be styled with CSS.",
        ],
        tip: "If you have an SVG and need a raster copy for a platform that rejects SVGs (some email clients, social uploads), convert it to JPG or PNG.",
      },
      {
        heading: "When to use JPG",
        body: [
          "Photographs and anything with rich gradients and lots of detail. JPG compresses these efficiently, trading a little quality for small file sizes.",
        ],
      },
      {
        heading: "Converting between them",
        body: [
          "SVG → JPG: render the SVG to a canvas at your chosen scale and export at 92% quality. JPG needs a background, so the converter adds white.",
          "JPG → SVG: reduce the image to a limited color palette via quantization, then output optimized rectangles. Best for logos and illustrations with flat colors — photos become huge files.",
        ],
        tip: "Both conversions run entirely in your browser with ChromaBrew — nothing is uploaded to a server.",
      },
    ],
  },
];

export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function postsByCategory(): { category: string; posts: BlogPost[] }[] {
  const map = new Map<string, BlogPost[]>();
  for (const post of BLOG_POSTS) {
    const list = map.get(post.category) ?? [];
    list.push(post);
    map.set(post.category, list);
  }
  return [...map.entries()].map(([category, posts]) => ({ category, posts }));
}
