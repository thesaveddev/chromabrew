# ChromaBrew Color Picker (Chrome extension)

Pick any color from your screen — or paste a hex — and open it in the
[ChromaBrew design system generator](https://www.chromabrew.com/design-system)
in one click. The handoff is the generator's existing share URL:
`/design-system?primary=RRGGBB`.

The UI lives in a **side panel** rather than a toolbar popup on purpose: a
popup closes the moment focus moves to the native eyedropper, a side panel
stays open while you sample.

## Install (unpacked)

Requires Chrome 114+ (Side Panel API; EyeDropper itself is Chrome 95+).

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder (`chrome-extension/`)
4. Click the ChromaBrew icon in the toolbar — the side panel opens

## Permissions (deliberately minimal)

| Permission | Why |
| --- | --- |
| `sidePanel` | Hosts the picker UI next to the page |
| EyeDropper API | Screen sampling — a web API, needs **no** manifest permission |

There are **no host permissions**: the extension never reads page content.
`chrome.storage.sync` (part of the extension API surface) keeps your recent
colors and settings across your Chrome profile, and `chrome.tabs.create`
opens the generator tab.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | MV3 manifest — side panel, icons, no host access |
| `service-worker.js` | Opens the side panel on toolbar click |
| `sidepanel.html` / `.css` / `.js` | The picker UI and logic (vanilla, no build) |
| `generate-icons.mjs` | Regenerates `icons/*.png` — `node generate-icons.mjs` |
| `icons/` | 16/32/48/128 PNG icons (checked in) |

## Development

Edit → click the reload arrow on `chrome://extensions`. There is no build
step. To seed a **local** dev server instead of production, change
*Generator URL* at the bottom of the panel (e.g. `http://localhost:3000`) —
it persists.

## Verify before publishing

- [ ] Toolbar click opens the side panel
- [ ] *Pick color from screen* samples a color; RGB/HSL/hex update
- [ ] Picked color appears under *Recent* and survives a panel reopen
- [ ] *Open in ChromaBrew* lands on `/design-system?primary=…` seeded
- [ ] Pasting a hex into the input applies it live; Enter records history
- [ ] Copy button puts `#rrggbb` on the clipboard
- [ ] Panel reads correctly in light **and** dark system themes

Publishing to the Web Store: zip the folder contents (manifest at the zip
root) and upload at <https://chrome.google.com/webstore/devconsole>. The
store listing copy lives in [`docs/CHROME_EXTENSION_LISTING.md`](../docs/CHROME_EXTENSION_LISTING.md).
