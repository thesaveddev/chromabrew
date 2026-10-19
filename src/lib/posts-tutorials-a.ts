import type { BlogPost } from "./posts";

/**
 * Daily tutorials, batch 1 of 3: October 20–29, 2026.
 *
 * One tutorial goes live per day via `publishedAt` (the publish workflow
 * triggers a rebuild each date). Every tutorial is a worked how-to tied to a
 * free tool — concrete values, real steps, no filler.
 */
export const TUTORIAL_POSTS_A: BlogPost[] = [
  {
    slug: "complementary-color-palette-tutorial",
    title: "Build a complementary palette that doesn't clash",
    metaTitle: "Complementary Color Palette Tutorial — Opposites That Work",
    description:
      "A worked tutorial: take one brand color, find its complement, and tame the pair into a palette with neutrals, roles, and contrast-safe text.",
    excerpt:
      "Opposite hues, zero clashes: turn one brand color and its complement into a working palette.",
    publishedAt: "2026-10-20",
    category: "Tutorials",
    tags: ["complementary", "palette", "tutorial", "color harmony"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/contrast-checker"],
    keyword: "complementary palette tutorial",
    sections: [
      {
        heading: "Start with your one non-negotiable color",
        body: [
          "Every complementary palette begins with a single decision: the primary. Take your brand color — say a confident blue like #2563eb — and generate the complementary strategy. The tool hands you the opposite hue (a warm orange) plus supporting tints. That raw pair is intentionally loud; your job in the next steps is to give each side a role so they stop competing.",
          "Assign dominance before you touch anything else: roughly 60% of the interface goes neutral, 30% goes to your primary blue (actions, links, key surfaces), and the complement gets at most 10% — CTAs, highlights, the one element per screen that must win attention. A complement used sparingly looks decisive; used equally it looks like a sports team.",
        ],
      },
      {
        heading: "Tame the complement before shipping it",
        body: [
          "Pure complements at full saturation vibrate against each other — the classic clash. Fix it by stepping the accent down: use a tint of the orange for backgrounds and save full saturation for small elements (a button, a badge, an underline). If the orange still shouts, shift it slightly toward the nearest neutral; a burnt orange keeps the energy with half the noise.",
          "Then build the quiet majority. Pull two neutrals — one near-white surface and one dark ink — ideally with a whisper of your primary hue so the grays feel like they belong to the same family. Most interfaces live or die on these neutrals, not on the accent pair.",
        ],
        tip: "Squint at the palette: if the complement is the first thing you see, it owns too much. The primary should lead, neutrals should disappear, and the accent should surprise.",
        links: [
          { label: "Generate your complementary pair", href: "/tools/color-palette-generator" },
        ],
      },
      {
        heading: "Check the pairs people actually read",
        body: [
          "Run the combinations that carry text: body copy on the light neutral, links in primary on white, button labels on the primary fill, and the accent wherever it touches type. Body text needs 4.5:1; large headings can pass at 3:1. Complements often fail here — white on vivid orange rarely passes — so be ready to darken the accent one or two steps for its text duties while keeping the vivid version for decoration.",
          "When you are done you have a palette with jobs, not just colors: neutral surfaces, a primary for action, an accent for emphasis, and every text pair measured. Save the hex values into tokens so the decisions survive contact with real code.",
        ],
        links: [
          { label: "Measure every text pair", href: "/tools/contrast-checker" },
          { label: "Tokenise the finished palette", href: "/tools/design-token-generator" },
        ],
      },
    ],
  },
  {
    slug: "triadic-tetradic-palettes-explained",
    title: "Triadic and tetradic palettes without the rainbow mess",
    metaTitle: "Triadic & Tetradic Palettes — Three and Four Hues That Work",
    description:
      "A worked tutorial on three- and four-hue palettes: when to reach for them, how to keep one hue in charge, and the saturation trick that prevents chaos.",
    excerpt:
      "Three or four hues, one boss: how to run multi-hue palettes without the rainbow effect.",
    publishedAt: "2026-10-21",
    category: "Tutorials",
    tags: ["triadic", "tetradic", "palette", "tutorial"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/color-blindness-simulator"],
    keyword: "triadic tetradic palette tutorial",
    sections: [
      {
        heading: "When three hues earn their place",
        body: [
          "Triadic palettes (three hues evenly spaced on the wheel) suit products that need genuine variety: dashboards with multiple data series, playful consumer brands, illustrations. If your interface is mostly text and forms, you do not need three hues — a complementary or analogous palette will be calmer and easier to keep accessible.",
          "Generate the triadic strategy from your primary and look at the raw output honestly. Three full-saturation hues at equal weight is the rainbow mess everyone fears. The palette is a starting set of directions, not a finished system — the next step is hierarchy.",
        ],
      },
      {
        heading: "One hue leads, the rest support",
        body: [
          "Elect a dominant hue (usually your brand color) and demote the other two to supporting roles: one for secondary accents, one reserved for special states like success or highlights. Then desaturate the supporters by 20–30% relative to the leader. Equal saturation is what makes multi-hue palettes feel chaotic; unequal saturation is what makes them feel designed.",
          "Tetradic (four hues, two complementary pairs) follows the same law with stricter discipline: pick one dominant, one secondary, and let the remaining two appear only as rare highlights. Four equal hues never work in UI — they barely work in flags.",
        ],
        tip: "Convert the palette to grayscale mentally: if the three hues collapse to similar grays, they will also blur together for users with color blindness. Check with a simulator before you commit.",
        links: [
          { label: "Generate triadic and tetradic sets", href: "/tools/color-palette-generator" },
          { label: "Test them under color blindness", href: "/tools/color-blindness-simulator" },
        ],
      },
      {
        heading: "Lock it with neutrals and roles",
        body: [
          "Multi-hue palettes need stronger neutrals than simple ones, because the hues need somewhere quiet to sit. Define your surfaces, ink, and borders first, then place each hue into named roles: primary actions, secondary accents, data series one through three, status colors. A hue without a role gets deleted — that rule alone prevents rainbow creep as the product grows.",
          "Finally, check text pairs per hue. With three or four hues, at least one will fail white text; plan its dark variant now rather than discovering it in QA.",
        ],
        links: [
          { label: "Grade every combination at once", href: "/tools/wcag-palette-checker" },
        ],
      },
    ],
  },
  {
    slug: "analogous-palette-brand-design",
    title: "Design a calm brand palette with analogous hues",
    metaTitle: "Analogous Palette Tutorial — Calm, Cohesive Brand Color",
    description:
      "A worked tutorial: build a serene brand palette from neighboring hues, add depth with lightness steps, and keep it from going flat.",
    excerpt:
      "Neighbors, not opposites: a calm analogous palette with depth built in.",
    publishedAt: "2026-10-22",
    category: "Tutorials",
    tags: ["analogous", "palette", "branding", "tutorial"],
    relatedHrefs: ["/tools/color-palette-generator", "/tools/shade-generator"],
    keyword: "analogous palette tutorial",
    sections: [
      {
        heading: "Pick your center hue and its neighbors",
        body: [
          "Analogous palettes take 2–4 hues that sit side by side on the wheel — teal into green, violet into blue. Start from the emotion of the center hue (teal reads fresh and technical, violet reads premium) and generate the analogous strategy. The result feels harmonious by construction, which is both the appeal and the trap.",
          "The trap is flatness: neighbors blend, so nothing stands out. Decide up front which hue is the action color and which are atmosphere. In a teal-green-blue set, teal takes buttons and links while green and blue wash backgrounds and illustrations.",
        ],
      },
      {
        heading: "Create depth with lightness, not new hues",
        body: [
          "Since hue variety is deliberately low, all your depth must come from lightness steps. Generate a full shade scale for the primary hue: near-white tints for page backgrounds, mid tones for borders and secondary surfaces, deep shades for text and footer grounds. Five to seven stops turn three sleepy hues into a system with foreground, middle, and background.",
          "Keep one escape hatch for emphasis: a single warm accent (amber, coral) used under 5% of the time. Analogous palettes earn their calm; the accent earns its interruptions — empty states, success moments, the one CTA per flow.",
        ],
        links: [
          { label: "Build lightness scales from your hue", href: "/tools/shade-generator" },
          { label: "Generate the analogous set", href: "/tools/color-palette-generator" },
        ],
      },
      {
        heading: "Test for monotony and contrast",
        body: [
          "The failure mode of analogous palettes is everything merging: section boundaries vanish, buttons hide. Check adjacent surfaces against each other — not just text — and ensure at least a visible lightness step between card, page, and sidebar. Borders in a mid-tone of the family rescue more analogous designs than any hue tweak.",
          "Then run the text pairs. Analogous mid-tones are notorious for 3:1 near-misses on white; darken text colors decisively rather than hovering at the boundary.",
        ],
        tip: "Show the palette to someone for three seconds, then hide it. If they remember one color, the hierarchy works. If they remember 'blueish,' add contrast between roles.",
        links: [
          { label: "Measure the text pairs", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "extract-logo-colors-for-web",
    title: "Turn your logo into web-ready colors",
    metaTitle: "Extract Logo Colors for Your Website — Tutorial",
    description:
      "A worked tutorial: pull the exact colors out of a logo file, pick which ones survive on the web, and convert them into CSS-ready values.",
    excerpt:
      "From logo file to stylesheet: extract, select, and ship your brand colors.",
    publishedAt: "2026-10-23",
    category: "Tutorials",
    tags: ["logo", "brand colors", "extraction", "tutorial"],
    relatedHrefs: ["/tools/image-color-extractor", "/tools/color-converter"],
    keyword: "extract logo colors tutorial",
    sections: [
      {
        heading: "Extract from the right file",
        body: [
          "Use the highest-resolution logo you have — ideally the master PNG or SVG export, not a compressed social avatar. Upload it to the extractor and note the dominant colors with their coverage percentages. A typical logo yields 2–4 real colors plus anti-aliasing noise; ignore anything under ~3% coverage, which is edge blending, not brand intent.",
          "Screenshot the values immediately. Logo colors drift across exports (a #e11d48 becomes #e0244c through compression), so record the canonical hex from the vector master and treat extractions as confirmation, not scripture.",
        ],
      },
      {
        heading: "Decide what survives on the web",
        body: [
          "Logos and interfaces need different things. A gradient logo mark might extract five stops you should never use as UI fills; a black wordmark gives you ink but no accent. Promote one logo color to primary action color, keep one as accent, and derive neutrals separately — logo files rarely contain usable grays.",
          "Convert each survivor into every format your stack needs in one pass: HEX for design files, RGB/HSL for manipulation, OKLCH for scale generation. One conversion session beats six scattered ones.",
        ],
        links: [
          { label: "Extract colors from the logo file", href: "/tools/image-color-extractor" },
          { label: "Convert formats in one view", href: "/tools/color-converter" },
        ],
      },
      {
        heading: "Stress-test before you commit",
        body: [
          "Put each extracted color through two checks: contrast against white and against your dark surface for its intended role, and a color-blindness simulation. Logo colors chosen for print often fail both — a vivid red that sings on a business card can be unreadable as a 14px link.",
          "Failures are normal and fixable: keep the exact logo hex for the mark itself (brand integrity matters there) and use an adjusted step of the same hue for interactive roles. Same family, different jobs.",
        ],
        tip: "Keep a tiny brand sheet: logo hex (sacred), UI primary (adjusted), accent, neutrals. Four lines prevent a hundred future arguments.",
        links: [
          { label: "Check the survivors for contrast", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "photo-to-homepage-palette",
    title: "Steal your homepage palette from a great photo",
    metaTitle: "Photo to Homepage Palette — Tutorial",
    description:
      "A worked tutorial: pick the right photo, extract a palette, and turn it into homepage sections with readable text and one clear accent.",
    excerpt:
      "One photo, one homepage: from extraction to sections that read.",
    publishedAt: "2026-10-24",
    category: "Tutorials",
    tags: ["photo", "homepage", "palette", "tutorial"],
    relatedHrefs: ["/tools/image-color-extractor", "/tools/color-palette-generator"],
    keyword: "photo to homepage palette",
    sections: [
      {
        heading: "Choose a photo with range",
        body: [
          "The photo is the palette, so choose like a colorist: you want a clear dominant tone, a secondary, and something dark for text grounds. Landscapes with sky, land, and shadow do this naturally; monochrome golden-hour shots collapse to one hue and leave you stranded. If the brand already uses photography, pick the hero image — the palette will then match the site's imagery for free.",
          "Extract and take the top four colors by coverage. Immediately discard near-duplicates (two blues within a few degrees merge into one) — you want range, not a histogram.",
        ],
      },
      {
        heading: "Map colors to homepage sections",
        body: [
          "Assign before you decorate: darkest extraction becomes footer and text ink, the dominant mid-tone becomes section backgrounds and cards, the lightest becomes page ground, and the highest-chroma color becomes the accent for CTAs and highlights. A homepage reads as designed when each section's background was chosen, not decorated.",
          "Generate proper scales from the two most-used colors so buttons get hover states and cards get borders — raw extraction points cannot do that work alone.",
        ],
        links: [
          { label: "Extract the photo's colors", href: "/tools/image-color-extractor" },
          { label: "Scale the two workhorses", href: "/tools/shade-generator" },
        ],
      },
      {
        heading: "Protect readability over mood",
        body: [
          "Photo palettes fail at text first: mid-tone mood colors at 2:1 pretending to be text colors. Every headline and body pair gets measured, and anything under its threshold gets darkened without apology — mood lives in backgrounds and imagery, legibility lives in type, and the two budgets are separate.",
          "The accent needs the same audit wherever it touches text. Dusty photo accents make lovely illustrations and terrible links; split the roles (vivid for decoration, darkened step for communication) and the palette keeps both its soul and its function.",
        ],
        tip: "Overlay test: place each text color directly on the photo at low opacity. If it survives the busiest part of the image, it survives anywhere.",
        links: [
          { label: "Measure every section's text", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
  {
    slug: "check-text-contrast-wcag",
    title: "Check your text contrast the WCAG way",
    metaTitle: "Check Text Contrast for WCAG — Step-by-Step Tutorial",
    description:
      "A worked tutorial: measure any text/background pair, read AA and AAA results for normal and large text, and know exactly what to fix.",
    excerpt:
      "Stop guessing about gray text: measure any pair in 60 seconds.",
    publishedAt: "2026-10-25",
    category: "Tutorials",
    tags: ["contrast", "wcag", "accessibility", "tutorial"],
    relatedHrefs: ["/tools/contrast-checker"],
    keyword: "check text contrast wcag tutorial",
    sections: [
      {
        heading: "Enter the pair exactly as shipped",
        body: [
          "Open the contrast checker and enter the two colors precisely as your CSS renders them — the computed text color and the computed background behind it, not the design-file intention. Transparency, gradients, and images behind text all change the real values, so sample the rendered pixel when in doubt.",
          "Read the ratio first, then the verdicts. The ratio (like 4.6:1) is the measurement; AA/AAA for normal and large text are the judgments. Normal text needs 4.5:1 for AA; large text (roughly 18.66px bold or 24px regular and up) needs 3:1.",
        ],
      },
      {
        heading: "Prioritize by where users read",
        body: [
          "Not all failures are equal. Body copy and form labels fail loudly — fix those first. Secondary metadata (timestamps, captions) failing AA is still a failure, but it harms fewer tasks; either darken it or accept it as decoration, never as information. Disabled states are the one legal exemption — they have no contrast requirement, though they still must not be the only signal.",
          "Check both themes. A pair passing in light mode routinely fails in dark mode, and vice versa — the checker takes seconds, so there is no excuse for shipping one mode unmeasured.",
        ],
        links: [
          { label: "Check your pairs now", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Record the decision",
        body: [
          "Contrast passes rot: a later redesign lightens the gray and nobody re-measures. Write passing pairs into tokens with names that encode the guarantee (text-primary, text-muted) and treat any new gray as guilty until checked. Teams that tokenize contrast keep it; teams that remember hex values lose it.",
          "For the full palette, graduate to the matrix view — every pair graded at once beats twenty individual checks when the palette changes.",
        ],
        tip: "The most common silent failure is placeholder text. It looks intentional at 2:1 and reads as broken to low-vision users — measure it like body copy.",
        links: [
          { label: "Grade the whole palette at once", href: "/tools/wcag-palette-checker" },
        ],
      },
    ],
  },
  {
    slug: "aaa-large-text-contrast",
    title: "When to aim for AAA (and when AA is enough)",
    metaTitle: "AAA vs AA Contrast — When to Aim Higher",
    description:
      "A practical tutorial on WCAG's AAA level: which text deserves 7:1, why large display type is the easy win, and where chasing AAA wastes effort.",
    excerpt:
      "7:1 isn't for everything: spend AAA where readers actually benefit.",
    publishedAt: "2026-10-26",
    category: "Tutorials",
    tags: ["aaa", "contrast", "accessibility", "tutorial"],
    relatedHrefs: ["/tools/contrast-checker"],
    keyword: "aaa contrast tutorial",
    sections: [
      {
        heading: "Know what AAA actually demands",
        body: [
          "AAA requires 7:1 for normal text and 4.5:1 for large text — a full step above AA's 4.5:1 and 3:1. In practice 7:1 means near-black on white (or the reverse); brand-colored body text almost never qualifies. That is why AAA is not the general target: it would outlaw most colored text on the web.",
          "Measure your current body pair first. If it sits between 4.5:1 and 7:1, you are AA-passing and AAA-failing — the normal, healthy state for most products. The question is which text deserves the climb to 7:1, not whether everything must.",
        ],
      },
      {
        heading: "Spend AAA on long-form reading",
        body: [
          "AAA pays off where people read for minutes, not seconds: documentation, articles, ebooks, terms, help centers. If your product has a reading surface, make its body text 7:1 — usually by darkening the ink one step — and users with low vision feel it immediately. This is the highest-value AAA investment on the web.",
          "Large display type is the cheap win: headings at 24px+ only need 4.5:1 for AAA, which most brand colors already clear. Check your H1 color once and you may bank a AAA claim for every hero on the site.",
        ],
        links: [
          { label: "Measure your reading surfaces", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Don't chase AAA where it harms",
        body: [
          "AAA everywhere has costs: muted secondary text forced to near-black flattens hierarchy, and brand accents banned from type push color out of the interface entirely. UI chrome, metadata, and decorative text are legitimate AA territory — hierarchy is accessibility too, and a flat wall of 7:1 text helps nobody.",
          "The defensible policy: AAA for sustained reading and display type, AA everywhere else, nothing below AA carrying meaning. Write it down; it ends debates.",
        ],
        tip: "If marketing wants brand-colored body copy, offer the trade explicitly: accent for headings (AAA at large sizes is easy), near-black for paragraphs. Both sides keep what matters.",
      },
    ],
  },
  {
    slug: "fix-failing-contrast-pair",
    title: "Fix a failing contrast pair without wrecking the design",
    metaTitle: "Fix Failing Contrast — Keep the Hue, Pass the Ratio",
    description:
      "A worked tutorial: take a real failing pair, find the nearest passing color that preserves the hue, and verify it in both themes.",
    excerpt:
      "Same hue, passing ratio: rescue failing pairs instead of deleting them.",
    publishedAt: "2026-10-27",
    category: "Tutorials",
    tags: ["contrast fix", "accessibility", "tutorial"],
    relatedHrefs: ["/tools/contrast-checker", "/tools/shade-generator"],
    keyword: "fix failing contrast pair",
    sections: [
      {
        heading: "Measure how far you are from passing",
        body: [
          "Enter the failing pair and read the gap, not just the verdict. A 4.2:1 pair needs a nudge — one lightness step. A 2.1:1 pair needs surgery — different color or different background. The size of the gap decides the tactic, and most pairs designers actually ship are in nudge range, which is good news.",
          "Identify which side should move. Backgrounds usually have more freedom (darken a surface, add a scrim), while brand text colors are politically expensive to change. Move the side with fewer stakeholders first.",
        ],
      },
      {
        heading: "Shift lightness, protect hue",
        body: [
          "Use the nearest-accessible fix: it walks the failing color darker (or lighter on dark backgrounds) along the same hue until the ratio passes, changing lightness while preserving identity. A teal link at 3.9:1 becomes a slightly deeper teal at 4.5:1 — recognizably the same brand, legally different luminance.",
          "Resist the urge to overshoot to 7:1 'to be safe.' Every extra step away from the brand hue costs recognition; pass with margin (aim ~4.7:1 for a 4.5:1 requirement to survive rendering differences) and stop.",
        ],
        links: [
          { label: "Get the nearest passing color", href: "/tools/contrast-checker" },
          { label: "Find the right step on the scale", href: "/tools/shade-generator" },
        ],
      },
      {
        heading: "Verify the fix everywhere it appears",
        body: [
          "A fixed pair is a token change, not a one-spot edit: the same teal appears in links, icons, borders, and charts. Re-check each context, because the fix was computed against one background and the color may sit on three. The palette matrix catches the stragglers in one view.",
          "Finally, check the other theme. Contrast fixes are mode-specific — a darkened light-mode link is irrelevant to dark mode, which needs its own pass. Two modes, two measurements, no exceptions.",
        ],
        tip: "Screenshot the before/after pair side by side for the design review. 'Same hue, now passing' ends the aesthetic objection before it forms.",
        links: [
          { label: "Re-grade the full palette", href: "/tools/wcag-palette-checker" },
        ],
      },
    ],
  },
  {
    slug: "build-shade-scale",
    title: "Build a shade scale from one hex in ten minutes",
    metaTitle: "Build a Shade Scale from One Color — Tutorial",
    description:
      "A worked tutorial: turn a single brand hex into a 50–950 scale with even perceptual steps, and name the stops your UI actually needs.",
    excerpt:
      "One hex in, eleven stops out: a scale with even steps and named jobs.",
    publishedAt: "2026-10-28",
    category: "Tutorials",
    tags: ["shade scale", "oklch", "tutorial"],
    relatedHrefs: ["/tools/shade-generator", "/tools/tailwind-color-generator"],
    keyword: "build shade scale tutorial",
    sections: [
      {
        heading: "Generate in OKLCH, not in hex math",
        body: [
          "Enter your brand hex and generate the scale in OKLCH mode. Equal numeric steps in OKLCH look like equal visual steps; equal steps in RGB clump in the middle and jump at the ends. This single choice is the difference between a scale that looks hand-tuned and one that looks auto-generated.",
          "Take the full 50–950 range even if you think you need three stops. You need three stops today; the hover state, the disabled tint, and the dark-mode surface arrive next quarter, and regenerating mid-project shifts every existing color.",
        ],
      },
      {
        heading: "Name the stops by job",
        body: [
          "A scale without roles is a rainbow with numbers. Assign the jobs now: 50–100 for page and card grounds, 200–300 for borders and dividers, 500–600 for the primary action fill, 700–800 for hover and text-on-light, 900+ for ink and dark-mode grounds. Write these into tokens immediately — roles are what stop the next designer from eyeballing a new gray.",
          "Check the action stop against white (and the ink stop against the 100 ground) as you assign. A scale whose 600 fails white text is a scale that will betray you in QA; pick the passing neighbor now.",
        ],
        links: [
          { label: "Generate your scale", href: "/tools/shade-generator" },
          { label: "Verify the action stops", href: "/tools/contrast-checker" },
        ],
      },
      {
        heading: "Export it into the stack",
        body: [
          "Copy the scale as CSS variables for plain stylesheets or as a Tailwind v4 theme block if that is the stack — same stops, both formats, no re-typing. Keep the OKLCH values where the toolchain supports them; they survive future adjustments (a global saturation shift, a dark-mode derivation) far better than hex.",
          "One maintenance rule: the scale is append-only. Never edit a middle stop in place — every surface using it shifts silently. Add stops or rename roles, but 500 stays 500.",
        ],
        tip: "Print the scale (yes, on paper) and squint: steps should march evenly with no sudden jumps. Your eyes catch bad spacing faster than any number.",
        links: [
          { label: "Export for Tailwind v4", href: "/tools/tailwind-color-generator" },
        ],
      },
    ],
  },
  {
    slug: "hover-states-from-color-scale",
    title: "Derive hover, active, and disabled states from your scale",
    metaTitle: "Hover, Active & Disabled States from a Color Scale",
    description:
      "A worked tutorial: stop eyeballing interactive states — derive hover, active, focus, and disabled directly from scale steps with rules that hold.",
    excerpt:
      "No more eyeballed hovers: derive every state from the scale by rule.",
    publishedAt: "2026-10-29",
    category: "Tutorials",
    tags: ["hover states", "interaction", "design tokens", "tutorial"],
    relatedHrefs: ["/tools/shade-generator", "/tools/contrast-checker"],
    keyword: "hover states color scale tutorial",
    sections: [
      {
        heading: "The one-step rule for hover and active",
        body: [
          "The most reliable system in UI color: hover is one scale step darker than rest (one step lighter in dark mode), active is two steps. If your primary button rests at 600, hover is 700, active is 800. No eyeballing, no per-button snowflakes — the rule works because perceptual scales make each step feel equal.",
          "Apply it uniformly: links, menu items, table rows, chips. Users learn the physics of your interface from repetition; five different hover behaviors teach them nothing.",
        ],
      },
      {
        heading: "Focus and disabled need their own logic",
        body: [
          "Focus is not a darker state — it is an added ring. Use a 2px outline in the action hue at full saturation plus a 2px offset, and never remove it for aesthetics; keyboard users navigate by it. Check the ring against adjacent colors at 3:1, the UI-component threshold.",
          "Disabled is reduced opacity on the resting state (around 50%) with no hover response at all — and crucially, disabled must never be the only signal. Pair it with helper text explaining why, because grayed controls test users' patience more than their eyes.",
        ],
        links: [
          { label: "Find your state steps", href: "/tools/shade-generator" },
        ],
      },
      {
        heading: "Verify states like a user, not a designer",
        body: [
          "Tab through the interface with the monitor dimmed: every focus ring must be findable, every hover distinguishable from rest, every disabled control obviously inert. Then measure the text pairs in each state — hover darkens backgrounds, which usually helps contrast, but light-mode-to-dark hover inversions can break it.",
          "Document the rules as tokens (action-hover, action-active, focus-ring) rather than values. When the brand hue changes next year, the physics survive.",
        ],
        tip: "Record a 10-second clip of tabbing through the form and watch it back. State problems you glide past live become obvious on replay.",
        links: [
          { label: "Check state text pairs", href: "/tools/contrast-checker" },
        ],
      },
    ],
  },
];
