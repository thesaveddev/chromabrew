export interface PostSection {
  heading: string;
  /** Paragraphs / list items rendered under the heading. */
  body: string[];
  /** Support bullet point. */
  bullets?: string[];
  /** Info callout. */
  tip?: string;
  /** Optional code block rendered under the section. */
  code?: string;
  codeLang?: string;
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
