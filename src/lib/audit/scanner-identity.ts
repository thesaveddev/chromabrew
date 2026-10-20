/**
 * How the scanner presents itself on the wire.
 *
 * Two identities, on purpose:
 *
 *   - `SCANNER_USER_AGENT` (defined beside the rules in `analyzer.ts`) is the
 *     honest one. It is what gets written to the scan row as provenance and
 *     what site owners are pointed at when they ask who was scanning them.
 *
 *   - `SCANNER_BROWSER_UA` is what page requests actually carry. The renderer
 *     drives a real browser; sending a non-browser user-agent *from a browser
 *     context* is a mismatch only bots exhibit, and it made bot protections
 *     challenge pages that a human visitor would have been let straight
 *     through. Presenting as the browser the scanner genuinely is — same UA
 *     family, same language header, no automation flags — is consistency, not
 *     spoofing: it is what Googlebot's own verification model assumes.
 *
 * This reduces *accidental* challenges; it is not (and must not be sold as) a
 * way through a protection that has decided this scanner is unwelcome. When a
 * site still challenges us, `challenge.ts` says so plainly and the report
 * points the owner at /audit/scanner to allowlist the scanner properly.
 */

/**
 * A current stable Chrome-on-Windows UA. It intentionally does not carry the
 * product name: a browser does not, and the honest identity lives in
 * `SCANNER_USER_AGENT` for logs, the database and the allowlist docs.
 */
export const SCANNER_BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const SCANNER_ACCEPT_LANGUAGE = "en-US,en;q=0.9";

/**
 * Chromium launch flags. `--disable-blink-features=AutomationControlled`
 * removes the `navigator.webdriver` tell — the remaining flag is the single
 * most-triggered bot signal on managed challenge deployments.
 */
export const SCANNER_LAUNCH_ARGS = [
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--disable-blink-features=AutomationControlled",
];

/**
 * Injected into every page before any site script runs. The launch flag above
 * alone leaves older tells in place; this removes the property pages read to
 * detect automation. Applied to the scanner's own pages only — it changes what
 * the audited page can *measure*, never what the audit measures.
 */
export const SCANNER_INIT_SCRIPT =
  'Object.defineProperty(Navigator.prototype, "webdriver", { get: () => undefined });';
