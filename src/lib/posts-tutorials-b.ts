import type { BlogPost } from "./posts";

/** Daily tutorials, batch 2 of 3: October 30 – November 8, 2026. */
export const TUTORIAL_POSTS_B: BlogPost[] = [
  {
    slug: "tailwind-theme-from-brand-color",
    title: "Turn your brand color into a Tailwind v4 theme",
    metaTitle: "Tailwind v4 Theme from a Brand Color — Tutorial",
    description:
      "A worked tutorial: generate a Tailwind CSS v4 @theme block from one brand hex, use the utilities, and keep dark mode in sync.",
    excerpt:
      "One hex to @theme: brand utilities, dark mode included.",
    publishedAt: "2026-10-30",
    category: "Tutorials",
    tags: ["tailwind", "theme", "tutorial"],
    relatedHrefs: ["/tools/tailwind-color-generator", "/tools/dark-mode-generator"],
    keyword: "tailwind v4 theme brand color tutorial",
    sections: [
      {
        heading: "Generate the @theme block",
        body: [
          "Enter your brand hex and copy the generated @theme block into your stylesheet. You get the full tonal range as --color-brand-* variables, which Tailwind v4 turns into utilities automatically: bg-brand-600, text-brand-700, border-brand-200. No config file, no plugin — v4 themes live in CSS.",
          "Check the generated range before pasting: you want usable extremes (a near-white 50 for grounds, a near-black 950 for ink) and an action stop around 500–600 that passes white text. Regenerate from a slightly adjusted seed if the action stop fails — cheaper now than overriding later.",
        ],
      },
      {
        heading: "Use the scale like a system",
        body: [
          "Map roles to stops once and reuse them: surfaces from 50–100, borders from 200–300, actions at the passing stop, hover one step darker, ink from 900. When every component reads from the same stops, the interface gains the visual rhythm that scattered hex values never produce.",
          "Resist arbitrary values (bg-[#3b82f680]) after setting up the theme — each one is a color decision made without the system's knowledge. If a value recurs twice, it belongs in the theme.",
        ],
        links: [
          { label: "Generate your @theme block", href: "/tools/tailwind-color-generator" },
        ],
      },
      {
        heading: "Keep dark mode honest",
        body: [
          "Tailwind's dark: variant switches utilities, not color sense — dark: variants pointing at the same stops will look wrong, because dark surfaces need lighter fills. Generate a proper dark palette and define its roles separately (raised surfaces get lighter, text goes to low-numbered stops), then point dark: utilities at those stops.",
          "Verify the critical pairs in both modes: body text, action fills, borders against their grounds. Two modes, two measurement passes — the theme is only done when both read clean.",
        ],
        tip: "Name a reviewer 'dark-mode owner' for every PR that touches color. Unowned dark mode rots within a quarter.",
        links: [
          { label: "Generate the dark palette", href: "/tools/dark-mode-generator" },
        ],
      },
    ],
  },
  {
    slug: "shadcn-theme-from-brand-color",
    title: "Theme shadcn/ui with your brand in five minutes",
    metaTitle: "shadcn/ui Brand Theme Tutorial — oklch Variables",
    description:
      "A worked tutorial: paste a brand color, get light and dark shadcn variable blocks, apply them, and keep charts and sidebar coherent.",
    excerpt:
      "Brand in, themed components out: shadcn variables that just work.",
    publishedAt: "2026-10-31",
    category: "Tutorials",
    tags: ["shadcn", "theme", "tutorial"],
    relatedHrefs: ["/tools/shadcn-theme-generator"],
    keyword: "shadcn brand theme tutorial",
    sections: [
      {
        heading: "Generate both mode blocks",
        body: [
          "Enter your brand hex and copy the :root block into your global stylesheet, then the .dark block beside it. Every shadcn component — buttons, dialogs, dropdowns, toasts — re-themes instantly because they all read the same variables. The chart-1…5 and sidebar tokens come along, so data visualization and navigation match the theme from the first paste.",
          "Before applying, glance at the generated primary in both modes: light primary should pass white text, dark primary should be lifted and slightly desaturated. If either looks off, adjust the seed rather than hand-editing ten variables — the generator's coherence is the point.",
        ],
      },
      {
        heading: "Apply and smoke-test every component",
        body: [
          "Paste, run, and walk the component gallery: primary and secondary buttons, destructive actions, badges, tabs, the sidebar, one chart. The usual casualty is the destructive token (red must pass white text in both modes) and muted text on muted backgrounds. Fix casualties at the seed level so light and dark stay in sync.",
          "Keep --radius intentional: the generator carries a radius through, but set it to match your brand's corner language (sharp for technical, large for friendly) rather than accepting the default blindly.",
        ],
        links: [
          { label: "Generate your shadcn theme", href: "/tools/shadcn-theme-generator" },
        ],
      },
      {
        heading: "Own the theme going forward",
        body: [
          "Commit the blocks as the theme's source of truth and route all future color tweaks through regeneration, not hand edits — hand-edited variables drift between modes within months. When the brand evolves, regenerate from the new seed and diff the blocks; the diff is your migration plan.",
          "One boundary to respect: marketing pages may need colors outside the system (campaign hues, illustration palettes). Let them — the component theme governs product UI, not every pixel the company ships.",
        ],
        tip: "Screenshot the gallery in both modes on theme day and file the images. Future 'did we break dark mode?' questions answer themselves by diffing.",
      },
    ],
  },
  {
    slug: "dark-mode-palette-from-scratch",
    title: "Build a dark mode palette that isn't inverted light mode",
    metaTitle: "Dark Mode Palette Tutorial — Real Dark Semantics",
    description:
      "A worked tutorial: derive dark surfaces, text, accents, and status colors from your brand, with elevation and contrast handled properly.",
    excerpt:
      "Darkness by design: surfaces, elevation, and accents done right.",
    publishedAt: "2026-11-01",
    category: "Tutorials",
    tags: ["dark mode", "palette", "tutorial"],
    relatedHrefs: ["/tools/dark-mode-generator", "/tools/contrast-checker"],
    keyword: "dark mode palette tutorial",
    sections: [
      {
        heading: "Start from the background, not the brand",
        body: [
          "Dark mode begins with the ground: pick a near-black with a whisper of hue (pure #000 feels stark and makes OLED smear; a tinted charcoal feels designed). Layer surfaces upward from there — page, card, raised — each one step lighter, because in the dark, elevation reads as lightness, the exact inverse of light mode's shadows.",
          "Text then inverts its logic too: primary text near-white, secondary at ~70% opacity of it, muted lower still. Generate the dark theme from your brand color rather than inverting the light ramp — inversion produces harsh complements and dead accents.",
        ],
      },
      {
        heading: "Rescue your accent for the dark",
        body: [
          "Brand primaries built for white backgrounds usually fail on dark ones — a deep blue button that passes white text vanishes into charcoal. The fix is a lifted twin: same hue, higher lightness, slightly lower chroma. Users read it as the same brand because hue carries identity; lightness carries the mode.",
          "Status colors need the same treatment: success green, warning amber, and error red all have dark-mode variants that are lighter and a touch softer. Never reuse light-mode status fills on dark grounds — red-on-charcoal at 3:1 is how errors go unread.",
        ],
        links: [
          { label: "Generate the dark theme", href: "/tools/dark-mode-generator" },
        ],
      },
      {
        heading: "Verify with dimmed eyes",
        body: [
          "Measure every text pair in dark mode separately — light-mode passes transfer nothing. Then do the physical test: dim the monitor to 30% and use the interface. Dark mode is consumed in beds and red-eyes; borders that vanish and grays that merge at low brightness are real failures, not edge cases.",
          "Shadows get demoted in the dark (halve their opacity; elevation is carried by surface lightness now) and focus rings get promoted — a glowing ring is often the only landmark on a dark form. Check both before calling the mode done.",
        ],
        tip: "Ship a 'true black' OLED option only if users ask. Tinted charcoal tests better for readability; pure black is a preference, not an upgrade.",
        links: [
          { label: "Measure the dark pairs", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "gradient-hero-background-tutorial",
    title: "Design a hero gradient people remember",
    metaTitle: "Hero Gradient Background Tutorial — Tasteful & Vivid",
    description:
      "A worked tutorial: build a hero background gradient with real lightness travel, place content over it safely, and export production CSS.",
    excerpt:
      "Lightness travel, safe text zone, clean CSS: heroes that glow.",
    publishedAt: "2026-11-02",
    category: "Tutorials",
    tags: ["gradient", "hero", "tutorial"],
    relatedHrefs: ["/tools/css-gradient-generator", "/tools/contrast-checker"],
    keyword: "hero gradient background tutorial",
    sections: [
      {
        heading: "Give the gradient somewhere to travel",
        body: [
          "A hero gradient needs distance: two stops with genuine lightness separation stretched across the full hero at a shallow angle (150–170° reads natural; 45° reads sporty). Same-hue light-to-dark is the safe masterpiece — deep violet into soft lavender carries a whole hero without a single extra color.",
          "Two hues earn their complexity when they share saturation: violet-to-blue for calm, amber-to-rose for energy. Mismatched saturation (neon meets pastel) is the actual cause of most 'cheap gradient' complaints, not the hue count.",
        ],
      },
      {
        heading: "Carve out the text zone",
        body: [
          "Headlines do not float on gradients — they sit in planned safe zones. Either darken one region of the gradient behind the copy (a radial deepening works invisibly), lay a transparent-to-black scrim under the text block, or set the copy panel on flat color overlapping the gradient's edge. Pick one deliberately; 'it looks fine on my monitor' is how 2:1 headlines ship.",
          "Measure at the lightest pixel under the text, then have someone else read it on a phone outdoors. Hero copy is brand copy — it must survive the worst screen, not the designer's calibrated one.",
        ],
        links: [
          { label: "Build the gradient visually", href: "/tools/css-gradient-generator" },
          { label: "Verify the headline passes", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Export and future-proof",
        body: [
          "Copy the production CSS with a flat-color fallback declared first for ancient browsers, and store the stops as tokens — heroes get re-themed, and retyping gradient stops from a screenshot is how drift starts. If the brand hue shifts next year, the token update re-flows every gradient at once.",
          "One restraint: a single gradient per viewport. Two competing gradients (hero plus CTA band plus footer) turn richness into noise — let one moment glow and keep the rest flat.",
        ],
        tip: "Animate gradients sparingly (slow background-position drift) and respect prefers-reduced-motion. A moving hero that ignores motion settings is an accessibility failure with good aesthetics.",
      },
    ],
  },
  {
    slug: "gradient-text-that-reads",
    title: "Gradient text that stays readable",
    metaTitle: "Gradient Text Tutorial — Readable & Accessible",
    description:
      "A worked tutorial on background-clip text gradients: picking stop pairs with enough darkness, fallback colors, and contrast honesty.",
    excerpt:
      "Clip, contrast, fallback: gradient headlines done responsibly.",
    publishedAt: "2026-11-03",
    category: "Tutorials",
    tags: ["gradient text", "typography", "tutorial"],
    relatedHrefs: ["/tools/css-gradient-generator", "/tools/contrast-checker"],
    keyword: "gradient text readable tutorial",
    sections: [
      {
        heading: "Build it on background-clip",
        body: [
          "The technique: transparent text color over a background gradient clipped to the glyphs (background-clip: text). It works in all modern browsers and degrades to whatever color you declare — which is exactly where most implementations fail, by declaring nothing and degrading to invisible text.",
          "Always declare the fallback first: a solid color close to the gradient's midpoint. Older browsers and some assistive-technology render paths show the fallback, so it must pass contrast on its own — treat it as a real text color, not a formality.",
        ],
        code: ".gradient-text {\\n  color: #6d28d9; /* fallback: must pass on its own */\\n  background: linear-gradient(120deg, #7c3aed, #db2777);\\n  -webkit-background-clip: text;\\n  background-clip: text;\\n  -webkit-text-fill-color: transparent;\\n  color: transparent;\\n}",
        codeLang: "css",
      },
      {
        heading: "Keep the dark end honest",
        body: [
          "Gradient text fails contrast at its lightest stop — a violet-to-pink headline on white passes at the violet end and fails at the pink. The fix is choosing pairs whose lightest stop still clears 3:1 for large display type (gradient text should never be body copy), or deepening the whole pair until it does.",
          "Restrict gradient text to short display strings: hero phrases, section titles, numbers. A paragraph of gradient text is unreadable by design — the eye needs a stable color to track lines.",
        ],
        links: [
          { label: "Test the lightest stop", href: "/tools/contrast-checker" },
          { label: "Build the pair", href: "/tools/css-gradient-generator" },
        ],
      },
      {
        heading: "Mind motion and meaning",
        body: [
          "Never convey meaning by the gradient alone — 'red items are overdue' fails the moment the gradient shifts hue across words. Pair color with labels, icons, or position, the same rule as any color-coded UI.",
          "Animated gradient text (shifting background-position) is a highlight, not a default: gate it behind prefers-reduced-motion checks and keep one static instance as the baseline experience. Delight that excludes is just exclusion with better kerning.",
        ],
        tip: "Screenshot the headline, blur it slightly, and check the words still separate from the background. The squint test catches gradient-text failures in seconds.",
      },
    ],
  },
  {
    slug: "card-elevation-shadows",
    title: "Elevation shadows for cards, modals, and menus",
    metaTitle: "Card Elevation Shadows Tutorial — Layered Depth",
    description:
      "A worked tutorial: assign shadow levels to cards, dropdowns, and modals with two-layer recipes that read as real depth.",
    excerpt:
      "Resting, raised, overlay: three shadow levels, zero mud.",
    publishedAt: "2026-11-04",
    category: "Tutorials",
    tags: ["shadows", "elevation", "tutorial"],
    relatedHrefs: ["/tools/css-shadow-generator", "/tools/design-token-generator"],
    keyword: "card elevation shadows tutorial",
    sections: [
      {
        heading: "Three levels cover every interface",
        body: [
          "Define resting (cards, tiles), raised (dropdowns, popovers, sticky bars), and overlay (modals, drawers, toasts) — and nothing else. Each level gets a two-layer recipe: a tight contact shadow plus a soft ambient. When a designer wants 'something between card and modal,' the answer is one of the three, because a fourth level is how elevation systems dissolve into per-component snowflakes.",
          "Generate each layer with the sliders, then combine with commas. Resting stays whisper-quiet (single-digit opacities); overlays earn their drama with deeper contact shadows plus a backdrop dim — the dim does half the layering work before shadows even register.",
        ],
      },
      {
        heading: "Pair shadows with surfaces",
        body: [
          "Shadows alone cannot carry elevation on busy backgrounds — a card shadow over a photo or gradient disappears. Pair each level with a surface rule: resting cards get a solid fill slightly lifted from the page ground, overlays get fills plus the dim. Shadow plus surface plus (for overlays) dim is the full recipe; any one alone is fragile.",
          "Borders deserve a vote too: a 1px border in a mid-tone at low opacity sharpens every level, especially resting cards whose shadows are too faint to define edges on their own.",
        ],
        links: [
          { label: "Design each shadow layer", href: "/tools/css-shadow-generator" },
        ],
      },
      {
        heading: "Tokenise and police the levels",
        body: [
          "Save the three levels as shadow-sm, shadow-md, shadow-lg tokens and ban raw box-shadow values in component code — lint it if the stack allows. Elevation consistency is a system property; it cannot survive individual judgment calls in fifty files.",
          "Revisit the levels once per theme change and once a year otherwise. Shadows are lighting, and lighting changes when backgrounds change — a level tuned for flat gray grounds needs re-tuning for textured or dark ones.",
        ],
        tip: "Stack all three levels on one test page during review. If resting and raised are indistinguishable, widen the gap before shipping — subtlety that nobody perceives is just absence.",
        links: [
          { label: "Tokenise the three levels", href: "/tools/design-token-generator" },
        ],
      },
    ],
  },
  {
    slug: "focus-rings-glow-shadows",
    title: "Focus rings and glows people can actually see",
    metaTitle: "Focus Rings & Glow Shadows Tutorial — Visible Keyboard UX",
    description:
      "A worked tutorial: build 3:1 focus indicators with box-shadow rings, add tasteful glows, and test the tab order like a keyboard user.",
    excerpt:
      "Rings that survive every background: visible focus by construction.",
    publishedAt: "2026-11-05",
    category: "Tutorials",
    tags: ["focus", "accessibility", "shadows", "tutorial"],
    relatedHrefs: ["/tools/css-shadow-generator", "/tools/contrast-checker"],
    keyword: "focus rings glow shadows tutorial",
    sections: [
      {
        heading: "Build the ring from two layers",
        body: [
          "The robust focus ring is two box-shadows: a 2px inner ring in the page background color (to cut through any backdrop) plus a 2–4px outer ring in the action hue. This double ring stays visible on white, on images, on brand fills — everywhere a single outline color eventually fails.",
          "Size it generously: 2px minimum thickness with a 2px offset from the element. Hairline rings disappear at normal viewing distances, and rings hugging the edge merge with borders. Visibility is the entire job; subtlety is the enemy.",
        ],
        code: ":focus-visible {\\n  outline: none;\\n  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #2563eb;\\n}",
        codeLang: "css",
      },
      {
        heading: "Check 3:1 against every neighbor",
        body: [
          "Focus indicators must hit 3:1 against adjacent colors — the UI-component threshold, not the text one. Check the ring color against the element fill, the page ground, and (for the double ring) both layers against each other. Brand-hue rings usually pass on white and fail on brand fills, which is exactly where the white separator layer earns its place.",
          "Never remove focus styles to 'clean up' the design, and never show rings on mouse click (use :focus-visible, which shows them for keyboard input). Both failure modes are common, and both abandon keyboard users.",
        ],
        links: [
          { label: "Design the ring layers", href: "/tools/css-shadow-generator" },
          { label: "Verify 3:1 everywhere", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Glows are decoration — treat them so",
        body: [
          "Glow shadows (large-blur, colored, low-opacity) make CTAs and active states feel alive, but they are decoration layered over a passing base state — the button must work with glows disabled. Keep glow opacity low enough that text on the glowing element still passes, since the glow lightens the fill beneath the label.",
          "Test the tab order end-to-end after styling: ring on every interactive element, in a sensible sequence, with no traps. A beautiful ring on a broken order is paint on a locked door.",
        ],
        tip: "Dim the screen and tab through with only the keyboard. Every stop should announce itself visually before you read a word — if you hunt for the ring, it failed.",
      },
    ],
  },
  {
    slug: "transparency-ui-overlays",
    title: "Transparency in UI: scrims, glass, and overlays",
    metaTitle: "Transparency in UI Tutorial — Scrims, Glass & Overlays",
    description:
      "A worked tutorial: use rgba and HEX8 for scrims, glass cards, and modal dims — with contrast checks for the blended result.",
    excerpt:
      "See-through, still readable: transparency with the math done.",
    publishedAt: "2026-11-06",
    category: "Tutorials",
    tags: ["transparency", "alpha", "overlays", "tutorial"],
    relatedHrefs: ["/tools/alpha-channel", "/tools/contrast-checker"],
    keyword: "transparency ui overlays tutorial",
    sections: [
      {
        heading: "The scrim: transparency's highest calling",
        body: [
          "A scrim is a transparent-to-opaque black gradient over imagery that gives text a predictable background. Build it from two stops of black (0% to ~70%) rather than a flat overlay — the gradient preserves the image's drama at the top while the text zone at the bottom is effectively solid. Headlines on photos without scrims are the web's most common contrast failure.",
          "Get the values as HEX8 or rgba in one pass and declare the scrim as its own layer, not baked into the image. Content changes; the scrim's protection should not depend on any particular photo.",
        ],
      },
      {
        heading: "Glass cards without the washout",
        body: [
          "Glassmorphism (translucent fill plus backdrop blur) fails when the fill is too transparent: text floats over whatever is behind, contrast unmeasurable. The fix is a fill opaque enough to anchor text (start around 70% of the surface color) with the blur providing the glass feel, not the transparency. Blur is atmosphere; opacity is structure.",
          "Check the card's text against the busiest background it can sit on, not the calmest. Glass over a flat gray passes; the same glass over photography fails — and cards move.",
        ],
        links: [
          { label: "Compute exact transparent values", href: "/tools/alpha-channel" },
        ],
      },
      {
        heading: "Measure the blend, not the swatch",
        body: [
          "A contrast ratio belongs to the final pixel: 50% black over white is gray, and it is the gray that must pass. Sample rendered colors (eyedropper the composited result) for scrims and overlays rather than trusting the base swatch — transparency math in your head is always optimistic.",
          "Modal dims get the same treatment: the dim must darken the page enough that the dialog reads as a separate layer, typically black at 40–60%. Below that the page competes; above it the context vanishes.",
        ],
        tip: "Test overlays over the loudest page in the product, not the cleanest. Transparency that survives the dashboard survives everything.",
        links: [
          { label: "Verify the blended pairs", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "design-tokens-developer-handoff",
    title: "Hand off design tokens developers will actually use",
    metaTitle: "Design Tokens Handoff Tutorial — From Palette to Code",
    description:
      "A worked tutorial: export semantic tokens as CSS and JSON, document the roles, and set up a handoff no one has to guess at.",
    excerpt:
      "Tokens that survive handoff: export, document, and name them right.",
    publishedAt: "2026-11-07",
    category: "Tutorials",
    tags: ["design tokens", "handoff", "tutorial"],
    relatedHrefs: ["/tools/design-token-generator", "/tools/tailwind-color-generator"],
    keyword: "design tokens developer handoff tutorial",
    sections: [
      {
        heading: "Export both formats from one source",
        body: [
          "Generate the token set once and export CSS variables for the stylesheet plus JSON for the design pipeline — same values, two shapes, zero re-typing. The CSS carries the runtime (colors, shadows, radii the browser reads); the JSON carries the system of record designers and tooling diff against.",
          "Keep tiers separated: primitive values (the raw scale), semantic roles (background, primary, danger), and component assignments (button-fill). Developers consume the top tier; the lower tiers exist so a rebrand touches primitives, not fifty components.",
        ],
      },
      {
        heading: "Document roles, not values",
        body: [
          "A token file without docs is a riddle: is surface-sunken darker or lighter than surface? Write one line per semantic token — where it goes, what sits on it, its contrast guarantee. The five minutes per token pays back every time someone new touches the UI.",
          "Include the contrast contract explicitly: which pairs are guaranteed (text-primary on background) and which are not (accent on accent). Developers make correct choices from contracts, not from hex literacy.",
        ],
        links: [
          { label: "Export your token set", href: "/tools/design-token-generator" },
        ],
      },
      {
        heading: "Make the handoff a pipeline, not a file drop",
        body: [
          "A tokens file emailed once rots within a quarter. Commit the JSON to the repo both sides share, version it, and review token diffs like code — a changed primitive with fifty dependents deserves the same scrutiny as a changed API. Changelogs for color sound excessive until the first silent regression.",
          "For Tailwind stacks, emit the theme block from the same source so utilities and tokens cannot disagree. Two sources of color truth is zero sources.",
        ],
        tip: "Run a quarterly token audit: grep for raw hex/rgb values in component code. Every hit is a token that is missing or undiscoverable — fix the system, not just the instance.",
        links: [
          { label: "Emit the Tailwind theme", href: "/tools/tailwind-color-generator" },
        ],
      },
    ],
  },
  {
    slug: "color-token-naming-system",
    title: "Name color tokens so the system scales",
    metaTitle: "Color Token Naming Tutorial — Names That Scale",
    description:
      "A worked tutorial on token naming: role-based names, numbered scales, theme-proof conventions, and the names to never use.",
    excerpt:
      "Names are the API: role-based tokens that survive rebrands.",
    publishedAt: "2026-11-08",
    category: "Tutorials",
    tags: ["design tokens", "naming", "tutorial"],
    relatedHrefs: ["/tools/design-token-generator"],
    keyword: "color token naming tutorial",
    sections: [
      {
        heading: "Name roles, never appearances",
        body: [
          "text-primary survives a rebrand; dark-gray-800 does not. Every semantic token name should describe the job (background, surface, border, primary, danger, on-primary) so values can change underneath without renaming anything. Appearance names (light-blue, pale-green) are tech debt with a friendly face — the day the 'blue' becomes teal, every name lies.",
          "Numbered scales are the exception that proves the rule: brand-50…950 describe positions in a ramp, which is structural, not decorative. Keep numbers for ramps, roles for everything built from them.",
        ],
      },
      {
        heading: "Build theme-proof conventions",
        body: [
          "Names must mean the same thing in both themes: surface is 'the card fill' in light and dark alike, even though the values invert. Never encode a theme in a name (dark-bg, light-text) — that strands every token in one mode and forces a parallel naming universe for the other.",
          "State belongs in suffixes, not new names: action, action-hover, action-active, action-disabled read as one family with predictable physics. A developer who learns the suffix pattern can guess any token correctly, which is the real test of a naming system.",
        ],
        links: [
          { label: "Generate a token set to name", href: "/tools/design-token-generator" },
        ],
      },
      {
        heading: "Retire names deliberately",
        body: [
          "Tokens accumulate: campaigns, experiments, and dead features leave orphans. Quarterly, grep usage and deprecate the unused — mark deprecated for one release with a pointer to the replacement, then delete. Deletion without deprecation breaks someone's screen; deprecation without deletion litters the system forever.",
          "Cap the palette of roles, not just values: if the system has four blues doing one job, merge them and alias the old names during transition. Fewer roles, each with a documented reason to exist, is what 'scales' actually means.",
        ],
        tip: "If a token needs a comment explaining what it is for, the name failed. Rename it — comments on names are the system telling you it is confused.",
      },
    ],
  },
];
