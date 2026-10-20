# Figma Community listing — ChromaBrew plugin (DRAFT)

Ready-to-publish copy and a gallery plan for the v1 plugin in
[`figma-plugin/`](../figma-plugin/README.md), per [`LAUNCH_PLAN.md`](LAUNCH_PLAN.md) §5.

> **Status: DRAFT — do not publish yet.** The manual in-Figma pass
> (README "Import & test manually", steps 1–5) has not run; it needs a
> desktop Figma session. Publish only after that checklist is green.

Specs from Figma's publishing docs
([publish classic plugins to Community](https://help.figma.com/hc/en-us/articles/360042293394-Publish-classic-plugins-to-the-Figma-Community),
[Grow your audience on Community](https://help.figma.com/hc/en-us/articles/22166943560983-Grow-your-audience-on-Community)):
icon **128 × 128 px**, cover/thumbnail **1920 × 1080 px**, up to **10**
supporting previews at 1920 × 1080 px.

## 1. Name

**Primary:** `ChromaBrew — Color Scale & Design Token Generator`

Rationale: brand first (searches for "ChromaBrew" must land on it), then
the two highest-intent keywords — *color scale* and *design token* — in the
order a designer would type them.

Alternatives:

- `ChromaBrew: Design System Variables (Scale, Palette, Semantic Tokens)` — longer, more keyword coverage, clunkier card
- `Color Scale + Semantic Tokens by ChromaBrew` — leads with the generic intent, weaker brand recall

Keep the **plugin manifest name** (`figma-plugin/manifest.json`) aligned
with whatever is chosen — the Community title and manifest name should not
disagree.

## 2. Short description (search result / card line)

> Turn any hex into an accessible 50–950 color scale, harmony palette and
> semantic tokens — as native Figma variables with Light & Dark modes.
> Free, offline, from ChromaBrew.

## 3. Long description (About — paste-ready)

**ChromaBrew for Figma** turns one color into a complete, accessible design
system — as native Figma variables, without leaving your file.

Enter a hex (or just select a shape — the plugin reads its solid fill) and
press Generate. The same engine that powers the ChromaBrew web generator
runs locally inside Figma and creates one variable collection:

- **scale/50–950** — an 11-step perceptual ramp that keeps your brand's
  character instead of washing it out
- **palette/** — harmony swatches (complementary, analogous, triadic,
  split-complementary, monochromatic, tetradic) labelled by role
- **semantic/** — background, surface, foreground, primary, success,
  warning, danger and every other semantic token, in **Light and Dark
  modes** — flip them with Figma's native mode switcher

That's **49 variables** in a collection named after your colour
(`ChromaBrew #47003A`). Re-running with the same colour updates in place —
no duplicate collections, no cleanup.

**Runs entirely offline.** The plugin has no network access; your colours
never leave your file.

**Free, forever.** ChromaBrew is a free design system generator — this
plugin is its Figma half. Generate on the web at
[chromabrew.com/design-system](https://www.chromabrew.com/design-system?utm_source=figma&utm_medium=community&utm_campaign=plugin-v1)
for the full workflow — WCAG contrast checks, live UI previews and
production exports (CSS, JSON, Tailwind, shadcn/ui) — then bring the same
system into Figma here.

v1 ships color tokens (scale, palette, semantic). Typography styles are
next.

## 4. Tags / keywords

Priority order (whatever the publish form's tag field accepts):

1. color palette
2. design system
3. design tokens
4. variables
5. accessibility
6. wcag
7. color scale
8. dark mode

Keyword parity with the web surface — `/design-system` metadata says
*"Turn one color into an accessible design system: scale, palette, semantic
tokens, light and dark themes, WCAG checks and production-ready exports.
Free."* The listing deliberately uses the same nouns in the same shapes so
Figma search, Google and on-site SEO reinforce one keyword set (LAUNCH_PLAN
§5: "title and description carry the same keyword set as /design-system").

## 5. Links

- **Generator (About link):**
  `https://www.chromabrew.com/design-system?utm_source=figma&utm_medium=community&utm_campaign=plugin-v1`
- **Privacy:** `https://www.chromabrew.com/privacy` — the plugin collects
  and transmits nothing (`networkAccess: none`); say so plainly in the
  listing's privacy field.

## 6. Icon and cover

| Asset | Spec | Plan |
| --- | --- | --- |
| Plugin icon | 128 × 128 PNG | Reuse the cross-product mark introduced with the Chrome extension: four quadrants (plum `#47003a`, gold, teal, cream) — same identity on both stores. Source art: `chrome-extension/generate-icons.mjs` palette. |
| Cover / thumbnail | 1920 × 1080 PNG | Art-directed hero (shot 0 below), not a raw screenshot. |

## 7. Gallery image plan (5 of the available 10 slots)

All previews **1920 × 1080**, captured from a **real working file** — a
small component set (buttons, cards, a nav bar) actually tinted by the
generated variables, never lorem placeholders (LAUNCH_PLAN §5: "gallery
images show variables landing in a real file"). Consistent treatment: one
annotation style (thin white keyline + 14 px label), Figma UI set to a
single theme for every shot, text readable at 100% zoom.

| # | Title | What it proves | Capture steps |
| --- | --- | --- | --- |
| 0 | **Cover** | The promise in one glance | Composite, not a screenshot: the 11-step ramp as full-height bars bleeding off the bottom edge, plugin window floating over it, wordmark + one-line value prop ("One color →49 accessible Figma variables"). |
| 1 | **Start from any color** | Zero-friction entry | Real file, select a shape with a solid fill → open plugin → input prefills from the fill → press Generate. Crop to the plugin window + selection. |
| 2 | **One click → a full scale** | The core output | After Generate, show the Variables panel expanded on `scale/50…950` with the collection header and both modes visible; the ramp swatches in the file beside it. |
| 3 | **Light and Dark, built in** | The differentiator | Two-panel composite: same semantic tokens (e.g. `semantic/background`, `semantic/foreground`) with the mode switcher on **Light** on the left and **Dark** on the right, values visibly different — plus the file UI showing the two themes. |
| 4 | **Harmony palettes by role** | Breadth | `palette/*` group expanded, role labels visible, the harmony swatches applied to buttons/chips in the real file. |
| 5 | **Tokens in a real component** | Credibility | Components (button states, card, alert) driven by the variables — the "variables landing in a real file" shot. Hover/pressed states showing `primary-hover`/`primary-active` in use. |

Optional 6th if web↔Figma reads well: chromabrew.com generator beside the
same system in Figma (the generate-on-web → use-in-Figma story).

Production notes:

- Capture at 1 × and export exactly 1920 × 1080; check text legibility at
  card size (Figma grid crops previews).
- No personal/project data visible in panels (emails, client names).
- Write alt text per image for accessibility — fitting, for this plugin.

## 8. Publish checklist

- [ ] Manual in-Figma pass green ([`figma-plugin/README.md`](../figma-plugin/README.md) steps 1–5)
- [ ] Manifest name/description match the listing title above
- [ ] Icon 128 × 128, cover + ≥5 previews at 1920 × 1080 exported
- [ ] About link with UTM resolves to `/design-system` (check once in a browser)
- [ ] Privacy field: "No data is collected or transmitted" + privacy link
- [ ] Price: **Free** — deliberately; Figma's native payments take 15% and
      Pro/Audit entitlement already lives on the web (LAUNCH_PLAN §5)
- [ ] After publish: record installs/listing clicks weekly
      ([`LAUNCH_PLAN.md`](LAUNCH_PLAN.md) §7 metrics table)
