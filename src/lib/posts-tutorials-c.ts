import type { BlogPost } from "./posts";

/** Daily tutorials, batch 3 of 3: November 9–18, 2026. */
export const TUTORIAL_POSTS_C: BlogPost[] = [
  {
    slug: "mix-brand-colors-tints",
    title: "Mix tints and blends from two brand colors",
    metaTitle: "Mix Brand Colors Tutorial — Tints & Blends That Stay Vivid",
    description:
      "A worked tutorial: blend two brand colors at any ratio in OKLCH, build an 11-step transition scale, and use it for gradients and hovers.",
    excerpt:
      "Blend in perceptual space: midpoints that stay vivid, not muddy.",
    publishedAt: "2026-11-09",
    category: "Tutorials",
    tags: ["color mixing", "blends", "tutorial"],
    relatedHrefs: ["/tools/color-mixer", "/tools/css-gradient-generator"],
    keyword: "mix brand colors tutorial",
    sections: [
      {
        heading: "Mix in OKLCH or don't bother",
        body: [
          "Averaging two hex values in RGB drags the midpoint toward gray — the infamous muddy middle. Mixing in OKLCH interpolates lightness, chroma, and hue along perceptual paths, so a teal-to-violet blend at 50% is vividly itself instead of dishwater. Enter both brand colors, set the ratio, and read the mixed HEX, RGB, and HSL at once.",
          "Ratios are design decisions: 50/50 for a true midpoint (dividers, blended illustrations), 80/20 for 'brand A warmed by brand B' (tinted surfaces, soft hovers). Save both — the ratio that looks right today is the token someone needs tomorrow.",
        ],
      },
      {
        heading: "Build the 11-step transition scale",
        body: [
          "The blend scale from 0% to 100% is a ready-made transition ramp: use adjacent steps for gradient stops that flow without banding, and pick hover states from two steps over. Because every step shares the perceptual path, the whole ramp feels related in a way hand-picked stops rarely achieve.",
          "Check the middle steps for their own uses — a 50% brand blend often makes a distinctive secondary accent that belongs to neither parent, exactly what illustration palettes and empty states want.",
        ],
        links: [
          { label: "Blend your two colors", href: "/tools/color-mixer" },
          { label: "Turn the ramp into a gradient", href: "/tools/css-gradient-generator" },
        ],
      },
      {
        heading: "Keep blends out of text",
        body: [
          "Mid-blends are usually mid-tone, which means mid-contrast — decoration, not communication. Use blends for backgrounds, illustrations, and transitions; when a blend must carry text, darken it to a passing step first and note that the text variant is a separate token, not the blend itself.",
          "One discipline saves blend systems: record the parent colors and ratio for every blend (teal-80/violet-20), never just the output hex. Ratios regenerate; orphaned hexes fossilize.",
        ],
        tip: "If a blend looks muddy even in OKLCH, the parents are too far apart in lightness — nudge the darker parent lighter before mixing rather than blaming the mixer.",
        links: [
          { label: "Check blend text pairs", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "find-exact-color-name",
    title: "Name any color and use names well in code",
    metaTitle: "Find Color Names Tutorial — CSS Names & When to Use Them",
    description:
      "A worked tutorial: identify the closest named color for any value, learn the names worth memorizing, and know when names must give way to hex.",
    excerpt:
      "From eyedropper to 'tomato': names for speed, hex for precision.",
    publishedAt: "2026-11-10",
    category: "Tutorials",
    tags: ["color names", "css", "tutorial"],
    relatedHrefs: ["/tools/color-names", "/tools/color-converter"],
    keyword: "find color name tutorial",
    sections: [
      {
        heading: "Identify the closest name",
        body: [
          "Paste any hex and get the nearest CSS named color with its distance — the moment a mockup says 'a coral-ish red,' you can answer 'tomato, #ff6347' in seconds. Names are a communication tool first: they let designers and developers point at the same thing without reading hex aloud.",
          "Learn the working set, not the catalog: the four neutrals (black, white, gray, silver), status primaries (red, green, blue, yellow, orange), pleasant mid-tones (tomato, coral, gold, skyblue, dodgerblue), and statement colors (crimson, indigo, rebeccapurple). Twenty names cover 90% of conversations.",
        ],
      },
      {
        heading: "Use names for speed, hex for truth",
        body: [
          "Names shine in prototypes, sketches, teaching examples, and chart series where exact hue does not matter yet — color: tomato is faster to write and easier to review than #ff6347. They fail the moment precision matters: brand colors, measured contrast pairs, and token values must be hex or oklch, because 'close to tomato' is not a specification.",
          "The handoff rule: names may appear in drafts and examples, never in the token file. A token named tomato holding #ff6347 is fine (the name is a label); a stylesheet reaching for tomato where the brand needs #e11d48 is a bug wearing a friendly face.",
        ],
        links: [
          { label: "Name any color value", href: "/tools/color-names" },
          { label: "Convert it precisely", href: "/tools/color-converter" },
        ],
      },
      {
        heading: "Mind the naming traps",
        body: [
          "CSS names are historical accidents, not a system: gray is darker than darkgray in some orderings, and lightgoldenrodyellow exists while obvious gaps do not. Never assume a name's lightness from its English — sample it.",
          "And names carry no contrast information. 'Lightblue text on white' sounds fine and measures ~2:1. The name got you talking; the checker gets you shipping.",
        ],
        tip: "Teach juniors the working set explicitly in week one. Shared color vocabulary removes a surprising amount of review friction.",
        links: [
          { label: "Verify named pairs before shipping", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "convert-hex-rgb-hsl-oklch",
    title: "Convert between HEX, RGB, HSL, and OKLCH confidently",
    metaTitle: "Convert Color Formats Tutorial — HEX, RGB, HSL, OKLCH",
    description:
      "A worked tutorial: see one color in every format at once, learn which format each job wants, and stop fearing OKLCH values.",
    excerpt:
      "One color, four languages: pick the right format for each job.",
    publishedAt: "2026-11-11",
    category: "Tutorials",
    tags: ["color formats", "oklch", "tutorial"],
    relatedHrefs: ["/tools/color-converter"],
    keyword: "convert color formats tutorial",
    sections: [
      {
        heading: "See all four at once",
        body: [
          "Enter any value — hex, rgb(), hsl(), or oklch() — and read all four equivalents side by side. The immediate payoff is translation fluency: a designer hands you hsl(220 80% 55%), the codebase speaks hex, and you convert without a round trip through guesswork.",
          "Do one deliberate exercise: take your brand primary through all four and note which representation teaches you something. HEX teaches nothing (it is a serial number); RGB shows channel balance; HSL shows the hue-saturation-lightness story; OKLCH shows perceptual lightness — the number that predicts contrast.",
        ],
      },
      {
        heading: "Match the format to the job",
        body: [
          "HEX for storage and handoff (compact, universal). RGB when manipulating channels in code or canvas. HSL when a human must reason about the color ('make it lighter' = raise L). OKLCH when generating scales, mixing, or doing anything where perceptual evenness matters — and increasingly in stylesheets themselves, where oklch() is now broadly supported.",
          "The common mistake is doing perceptual work in RGB: lightening by adding equal RGB amounts shifts hue as well as lightness. If adjustments keep producing 'wrong' colors, the format — not your eye — is at fault.",
        ],
        links: [
          { label: "Convert any value instantly", href: "/tools/color-converter" },
        ],
      },
      {
        heading: "Learn to read oklch() values",
        body: [
          "oklch(0.62 0.19 250) reads left to right: 62% perceptual lightness, strong chroma, blue hue angle. Lightness 0–1 maps to feel (0.95 near-white, 0.25 near-black); chroma ~0 is gray and 0.2+ is vivid; hue is wheel degrees like HSL. Within a week these read as fluently as hex — and unlike hex, they tell you whether white text will pass before you check.",
          "A practical rule of thumb: text on white needs lightness below ~0.55 for saturated hues; text on black needs lightness above ~0.75. Rough, useful, and a good reason to reach for OKLCH first.",
        ],
        tip: "When a codebase mixes formats, convert everything to one representation during your first pass. Mixed-format stylesheets hide duplicate colors.",
      },
    ],
  },
  {
    slug: "test-palette-color-blindness",
    title: "Test your palette for color blindness in ten minutes",
    metaTitle: "Test Palette for Color Blindness — Tutorial",
    description:
      "A worked tutorial: simulate protan, deutan, and tritan vision on your palette, fix red-green collisions, and add non-color cues.",
    excerpt:
      "See your palette through 8% of men's eyes — then fix what vanishes.",
    publishedAt: "2026-11-12",
    category: "Tutorials",
    tags: ["color blindness", "accessibility", "tutorial"],
    relatedHrefs: ["/tools/color-blindness-simulator", "/tools/contrast-checker"],
    keyword: "test palette color blindness tutorial",
    sections: [
      {
        heading: "Simulate the three families",
        body: [
          "Run your palette through protan (red-blind), deutan (green-blind), and tritan (blue-blind) simulations. Roughly 1 in 12 men has some red-green deficiency, so deutan and protan are not edge cases — they are a standing fraction of every audience. Tritan is rarer but worth the same ten seconds.",
          "Look for collisions, not ugliness: two colors that were distinct and are now identical. Red/green status pairs, green/amber chart neighbors, and red error text on green-tinted grounds are the classic casualties.",
        ],
      },
      {
        heading: "Fix collisions with lightness, not new hues",
        body: [
          "When two colors collide under simulation, separate them by lightness first: darken one, lighten the other. Lightness differences survive every form of color blindness, while hue swaps just move the collision to a different deficiency. A dark red versus a light green works for everyone; a 'better' red versus green works for no one new.",
          "Then add redundancy where it matters: error states get icons plus text, chart series get labels or patterns, required fields get symbols as well as red. Color is never the only channel for meaning — that rule outlives every palette.",
        ],
        links: [
          { label: "Simulate your palette", href: "/tools/color-blindness-simulator" },
        ],
      },
      {
        heading: "Lock the fixes with contrast",
        body: [
          "Lightness-separated pairs usually pass contrast as a side effect — verify anyway, because 'usually' is not a measurement. Re-run the separated pairs through the checker and record them as the accessible variants, keeping the originals for decoration-only roles where they cannot mislead.",
          "Make simulation part of the palette definition of done: every new brand or chart color gets simulated before merge. Ten minutes per palette beats a single 'why can't I tell these apart' support ticket — and there will be thousands of users who never file it.",
        ],
        tip: "Grayscale preview is the fastest first pass: if the design works in gray, its structure never depended on hue. Simulate in full color second for the collisions gray cannot show.",
        links: [
          { label: "Verify the fixed pairs", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "audit-palette-wcag-matrix",
    title: "Audit a whole palette for WCAG in one matrix",
    metaTitle: "Audit Palette WCAG Matrix Tutorial — Every Pair at Once",
    description:
      "A worked tutorial: load every palette color into the matrix, read AA grades for all pairs, and turn failures into a fix list.",
    excerpt:
      "Every pair graded at a glance: the palette audit that beats 20 tabs.",
    publishedAt: "2026-11-13",
    category: "Tutorials",
    tags: ["wcag", "palette audit", "tutorial"],
    relatedHrefs: ["/tools/wcag-palette-checker", "/tools/contrast-checker"],
    keyword: "audit palette wcag matrix tutorial",
    sections: [
      {
        heading: "Load the full working set",
        body: [
          "Add every color the UI actually uses — text inks, grounds, action fills, accents, status colors, borders. Not the whole scale (a 950-step ramp would drown the matrix), just the stops with jobs, around 6–10 colors. The matrix grades every foreground/background combination for AA normal and large text in one view.",
          "Read it by row: pick each text color and scan across its backgrounds. Failures cluster — usually one offending ground or one over-ambitious accent — and the cluster pattern tells you whether to fix one color or rethink a role.",
        ],
      },
      {
        heading: "Turn red cells into a fix list",
        body: [
          "Every failing cell becomes a ticket with three fields: the pair, its ratio, and the intended use. Sort by use, not by ratio — a 2:1 body-text failure outranks a 4.3:1 metadata near-miss regardless of the numbers. Assign each fix a tactic: darken/lighten the text step, change the ground, or restrict the pair to large-text-only roles.",
          "Large-text passes are legitimate keepers for headings and icons — mark them as such explicitly ('accent/white: 3.2:1, display only') so nobody later uses them for body copy. A documented limitation beats an undiscovered one.",
        ],
        links: [
          { label: "Run the matrix on your palette", href: "/tools/wcag-palette-checker" },
        ],
      },
      {
        heading: "Re-run on every palette change",
        body: [
          "Palettes change; the matrix is the regression suite. Re-run when any color is added, when themes change, and before releases — it takes a minute and catches the 'quick tweak' that broke three pairs. Screenshot or export the clean matrix as the release's accessibility evidence.",
          "Beyond ~8 colors the matrix gets dense: split decorative ramps into a separate check and keep the working set tight. The matrix audits decisions, not swatches — colors without roles do not belong in it.",
        ],
        tip: "Pair the matrix with a live page scan: the matrix proves the palette can pass, the audit proves the built page does. Both green is the actual goal.",
        links: [
          { label: "Drill into single pairs", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "pair-type-scale-with-color",
    title: "Pair a type scale with your color system",
    metaTitle: "Pair Type Scale with Color Tutorial — Typography & Contrast",
    description:
      "A worked tutorial: build a type scale, assign colors per level with contrast that holds, and keep display type expressive yet legible.",
    excerpt:
      "Sizes and colors, decided together: type that reads at every level.",
    publishedAt: "2026-11-14",
    category: "Tutorials",
    tags: ["typography", "type scale", "tutorial"],
    relatedHrefs: ["/tools/typography-scale-generator", "/tools/contrast-checker"],
    keyword: "pair type scale color tutorial",
    sections: [
      {
        heading: "Generate the scale first, color second",
        body: [
          "Build the size ramp with a consistent ratio (1.25 for products, 1.333 for editorial) from a 16px base: body, lead, h4 up to display. Sizes decided first, because size determines which contrast threshold each level lives under — and that decides how much color freedom each level gets.",
          "The key insight: large display type (24px+ or 18.66px+ bold) passes at 3:1, body needs 4.5:1. Your brand color that fails body copy may be perfectly legal for H1s. The scale tells you where color can play and where ink must rule.",
        ],
      },
      {
        heading: "Assign ink by level",
        body: [
          "Body and UI text get the near-black ink at 7:1+ — reading surfaces deserve AAA even when the policy only demands AA. Secondary text steps down one ink level but stays above 4.5:1. Display type earns the brand color where it passes 3:1; captions and metadata get the muted ink with an explicit 'not for essential info' contract.",
          "Dark mode replays the same assignments with its own inks — never reuse light ink values. Display color especially needs its lifted twin, since saturated brand hues darken perceptually on dark grounds.",
        ],
        links: [
          { label: "Generate your type scale", href: "/tools/typography-scale-generator" },
          { label: "Verify each level's ink", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Stress-test the extremes",
        body: [
          "Test the smallest text (captions, labels, footnotes) ruthlessly — small sizes plus muted colors is where contrast goes to die, and bumping captions one pixel or one ink step is the cheapest accessibility win available. Test display type at its actual rendered size, not the design-file size; responsive scaling can drop a 'large' heading under the threshold on mobile.",
          "Document level-to-ink pairings as tokens (text-display, text-body, text-muted) bound to the scale. Type and color decided together, stored together, shipped together.",
        ],
        tip: "Zoom the page to 200% and read it. Reflow breakage and thin-weight washout show up immediately — the closest thing to borrowing someone else's eyes.",
      },
    ],
  },
  {
    slug: "svg-to-jpg-social-graphics",
    title: "Turn SVG graphics into JPGs for social and email",
    metaTitle: "SVG to JPG Tutorial — Social & Email Graphics",
    description:
      "A worked tutorial: convert vector graphics to JPG at the right scale for posts and email, with backgrounds handled and text kept crisp.",
    excerpt:
      "Vectors in, post-ready JPGs out: scale, background, send.",
    publishedAt: "2026-11-15",
    category: "Tutorials",
    tags: ["svg", "jpg", "social", "tutorial"],
    relatedHrefs: ["/tools/svg-to-jpg"],
    keyword: "svg to jpg social graphics tutorial",
    sections: [
      {
        heading: "Match the export to the destination",
        body: [
          "Social and email are pixel mediums with known sizes: 1080×1350 for portrait posts, 1200×630 for link cards, ~600px wide for email bodies. Set the export scale so the SVG's aspect matches the slot — scaling a wide graphic into a square slot crops the message, and the converter preserves your artwork faithfully, including the mistake.",
          "Export at 2x the display size for retina screens. JPGs cannot re-sharpen; pixels you do not export do not exist on anyone's phone.",
        ],
      },
      {
        heading: "Flatten transparency deliberately",
        body: [
          "JPG has no alpha channel — transparent regions become a matte color, defaulting unpredictably if you do not choose. Set the background explicitly: brand surface for graphics, white for email (dark-mode email clients mangle transparency into muddy boxes otherwise).",
          "Text-heavy graphics deserve PNG instead (JPG artifacts blur small letterforms), but when the slot demands JPG, keep the quality high and the text large. A 14px caption rasterized to JPG is a rumor, not copy.",
        ],
        links: [
          { label: "Convert your SVG now", href: "/tools/svg-to-jpg" },
        ],
      },
      {
        heading: "Keep the vector original",
        body: [
          "Never treat the JPG as the master: archive the SVG alongside every export with the scale recorded. Next month's size change or color tweak then takes a minute instead of a redesign — vectors regenerate, rasters only degrade.",
          "Batch related graphics in one session (all social sizes from one master) so colors and type stay consistent across slots. Consistency across a campaign reads as professionalism; five slightly different reds read as five vendors.",
        ],
        tip: "Preview the JPG at actual size on a phone before scheduling. Desktop monitors forgive sins that phone screens broadcast.",
      },
    ],
  },
  {
    slug: "vectorize-raster-to-svg",
    title: "Convert JPG logos and icons to clean SVG",
    metaTitle: "Convert JPG to SVG Tutorial — Clean Vectors from Rasters",
    description:
      "A worked tutorial: vectorize raster logos and icons with the right color count, clean the result, and know when redrawing beats converting.",
    excerpt:
      "Pixels to paths: vectorize what converts, redraw what doesn't.",
    publishedAt: "2026-11-16",
    category: "Tutorials",
    tags: ["vectorize", "svg", "logo", "tutorial"],
    relatedHrefs: ["/tools/jpg-to-svg"],
    keyword: "convert jpg to svg tutorial",
    sections: [
      {
        heading: "Start with art that wants vectorizing",
        body: [
          "Conversion quality is decided before upload: flat logos, icons, and simple illustrations with solid fills vectorize beautifully; photographs and soft gradients vectorize into thousand-path approximations nobody should ship. Audit the source honestly — crisp edges and limited colors in, clean paths out.",
          "Use the highest-resolution source available. Vectorizers trace pixel edges, so a 200px thumbnail yields wobbly paths while the 2000px master yields confident ones. Garbage in, wobbly out.",
        ],
      },
      {
        heading: "Tune the color count to the artwork",
        body: [
          "Set the color count near the artwork's real palette: a two-color logo gets two (plus anti-aliasing tolerance), not twelve. Too many colors produces confetti paths that bloat the file and muddy edges; too few merges distinct shapes. Preview at full size and count whether each color earns its paths.",
          "Batch-convert icon sets in one session with one setting so stroke weights and corner rounding stay consistent. A settings change mid-set is visible across the product.",
        ],
        links: [
          { label: "Vectorize your raster now", href: "/tools/jpg-to-svg" },
        ],
      },
      {
        heading: "Know when to redraw instead",
        body: [
          "Conversion has honest limits: fine typography, precise geometry, and tiny details come back soft or wrong. If the result needs more than ten minutes of cleanup, redrawing the mark as native SVG is faster and yields a smaller, sharper file — conversion is a shortcut, not a religion.",
          "Whatever the route, the SVG becomes the master from that moment: archive it, version it, and export rasters from it. The converted file's job is to end raster supremacy, not to join it.",
        ],
        tip: "Compare the vector against the raster at 400% zoom: edges should be smoother, fills flatter. If it looks worse magnified, the source or settings need another pass.",
      },
    ],
  },
  {
    slug: "brand-palette-case-study-workflow",
    title: "From a brand you admire to a system of your own",
    metaTitle: "Brand Palette Case Study Tutorial — Learn, Don't Copy",
    description:
      "A worked tutorial: study a famous brand palette, extract its principles, and build an original system — inspiration with clean hands.",
    excerpt:
      "Study the masters, ship originals: the honest brand-stealing workflow.",
    publishedAt: "2026-11-17",
    category: "Tutorials",
    tags: ["brand palettes", "case study", "tutorial"],
    relatedHrefs: ["/tools/brand-palettes", "/tools/design-token-generator"],
    keyword: "brand palette case study tutorial",
    sections: [
      {
        heading: "Study principles, not hex values",
        body: [
          "Browse reference brand colors and ask structural questions: how many hues do they actually use? Where does the accent appear — and where is it conspicuously absent? How dark is their ink, how warm their neutrals? A fintech's single-blue-plus-ink discipline teaches more than its exact #2563eb ever will.",
          "Write down three principles from the study ('one hue, two neutrals, accent under 10%') before touching any tool. Principles transfer to your brand; hex values transfer someone else's identity onto your product.",
        ],
      },
      {
        heading: "Seed your own system from one color",
        body: [
          "Pick your own seed — a color with a reason (product personality, audience, differentiation from competitors, never 'looks like theirs but shifted'). Use it as the generator's primary and build the full system: scales, tokens, both themes, exports. The admired brand informed your judgment; the system is yours by construction.",
          "Run the differentiation check explicitly: place your palette beside the inspiration and two competitors. If a stranger could confuse them, push one dimension — hue family, accent strategy, or neutral temperature — until the family resemblance is to the principles, not the colors.",
        ],
        links: [
          { label: "Browse reference brand colors", href: "/tools/brand-palettes" },
          { label: "Build your own system", href: "/design-system" },
        ],
      },
      {
        heading: "Credit and compliance",
        body: [
          "Reference values are not brand guidelines: never ship a lookalike identity, never imply affiliation, and verify any color you must match (partner co-branding, app-store badges) against the owner's current materials. 'Widely cited' is not 'official,' and brand colors change.",
          "Tokenise the finished system so its originality is structural, not asserted. A documented system with roles, contrast guarantees, and a name of its own is unmistakably yours — which was the point of studying the masters in the first place.",
        ],
        tip: "Keep a one-page rationale: seed color and why, principles borrowed, differentiation check. Future you — and future teammates — will treat it as the palette's constitution.",
        links: [
          { label: "Export your original system", href: "/tools/design-token-generator" },
        ],
      },
    ],
  },
  {
    slug: "first-website-audit-walkthrough",
    title: "Run your first website audit and read the report",
    metaTitle: "First Website Audit Tutorial — Scan & Read the Report",
    description:
      "A worked tutorial: scan your site, understand render modes, read findings by severity, apply the first fixes, and re-scan to prove it.",
    excerpt:
      "Scan, read, fix, prove: your first audit end to end.",
    publishedAt: "2026-11-18",
    category: "Tutorials",
    tags: ["audit", "accessibility", "tutorial"],
    relatedHrefs: ["/tools/contrast-checker", "/tools/wcag-palette-checker"],
    keyword: "first website audit tutorial",
    sections: [
      {
        heading: "Scan a page you're allowed to test",
        body: [
          "Enter a public URL you own or are authorized to test — never pages behind logins or with private data. The worker renders the page in a real browser, captures a screenshot, and measures contrast, accessibility findings, and metadata. A single page takes seconds; watch the progress rather than navigating away, since the report streams in stages.",
          "Note the render mode on the finished report. Browser mode means full measurement (computed styles, script-built content included); fetch mode means the page resisted rendering and whole finding categories are absent. A fetch-mode report with zero findings is not a clean bill — it is an incomplete exam.",
        ],
        links: [
          { label: "Run the free audit", href: "/audit" },
        ],
      },
      {
        heading: "Read findings by severity, fix by effort",
        body: [
          "Start with errors (they block users), then warnings, then notices — but fix in order of effort within each band. A button contrast fix that takes replacing one token beats a structural heading-order repair that takes a sprint, even if both are errors. Momentum matters: each fixed finding re-proves the process works.",
          "Every finding carries its why and its fix: read the recommendation fully before editing, because the suggested values were recalculated for your page, not copied from a generic list. Apply, then verify in your own CSS — the report guides, your codebase decides.",
        ],
      },
      {
        heading: "Re-scan to prove the fix",
        body: [
          "Fixes without re-scans are intentions. Re-run the audit on the same URL after deploying and compare finding counts — the delta is your evidence for the release notes, the client, or the compliance folder. Keep the before/after reports; automated accessibility evidence compounds in value.",
          "Fold the survivors into prevention: failing colors become palette tokens with guarantees, structural findings become component patterns. The audit's highest use is not finding this month's issues but making next month's impossible.",
        ],
        tip: "Schedule the re-scan before you start fixing. A calendar invite for verification is what separates audits that ship from audits that decorate.",
        links: [
          { label: "Fix palette colors the audit flags", href: "/tools/wcag-palette-checker" },
        ],
      },
    ],
  },
];
