# Chrome Web Store listing — ChromaBrew Color Picker (DRAFT)

Companion to [`chrome-extension/`](../chrome-extension/README.md). Field
limits per the Chrome Web Store: **name ≤ 45 chars**, **summary ≤ 132
chars**, plus a detailed description and permission justifications
reviewed by a human
([best practices](https://developer.chrome.com/docs/webstore/best-listing)).

> **Status: DRAFT — do not publish yet.** The load-unpacked pass
> (`chrome-extension/README.md` → *Verify before publishing*) has not run;
> it needs desktop Chrome.

## Fields

- **Name:** `ChromaBrew Color Picker` (23 chars)
- **Summary** (97 chars): `Pick any color from your screen and open it in the ChromaBrew design system generator in one click.`
- **Category:** Developer Tools
- **Language:** English

## Detailed description (paste-ready)

Pick any color you can see — on a webpage, in another app, anywhere on
your screen — and open it in the ChromaBrew design system generator with
one click.

**How it works**

1. Click the ChromaBrew icon — the side panel opens
2. **Pick color from screen** samples the pixel (Chrome's native eyedropper)
3. **Open in ChromaBrew** loads chromabrew.com/design-system with your color
   already seeded — scale, palette, semantic tokens, WCAG checks and
   exports follow from it

Also paste a hex directly, copy RGB/HSL readouts, and keep your last 10
picks in **Recent** (click to re-use). The generator URL field lets you
point at a local dev server instead of production.

**Privacy by construction**

The extension requests **no host permissions** — it never reads the pages
you visit. Color sampling uses Chrome's built-in EyeDropper API; recent
colors and settings are stored in your own Chrome profile via
`chrome.storage.sync` and are never sent anywhere by us.

**About ChromaBrew**

A free design system generator: one color in, an accessible, production-
ready system out. [chromabrew.com](https://www.chromabrew.com)

## Permission justifications (single purpose: sample a color → open the generator)

| Permission | Justification |
| --- | --- |
| `sidePanel` | Hosts the picker UI in a Chrome side panel; a toolbar popup would close when the native eyedropper takes focus. |
| *(none else)* | No host permissions, no `activeTab`, no `scripting` — the EyeDropper API needs none of them. |

Privacy practices tab: declare **no data collection** (extension stores
only local preferences in Chrome's own sync storage).

## Assets

- Icon 128 × 128 (generate: `node chrome-extension/generate-icons.mjs`)
- Screenshots ≥ 1280 × 800 (dashboard shows current specs at upload):
  1. Side panel with swatch + RGB/HSL readout (dark theme, like
     `screenshots/chrome-extension-panel.png`)
  2. Native eyedropper sampling over a colorful page
  3. Recent history + *Open in ChromaBrew* CTA
  4. Landing on `/design-system` with the color seeded
