/**
 * Bundle entry for the in-browser audit.
 *
 * Built by `scripts/build-in-browser-bundle.mjs` (esbuild, IIFE) into a
 * single classic script. Two ways to run it, one code path:
 *
 *   - bookmarklet: a script tag pointing at the hosted bundle — loading it
 *     runs the audit, because a bookmarklet cannot call back into anything;
 *   - Chrome extension: the side panel injects the same file into the
 *     current tab via `chrome.scripting.executeScript`, and it runs on load.
 *
 * A host-element + running-flag guard keeps double-injection (double-clicking
 * the bookmarklet, or injecting twice) to a single run and a single panel.
 */

import { runInBrowserAudit } from "./in-browser-audit";
import {
  OVERLAY_HOST_ID,
  renderOverlayError,
  renderOverlayResult,
  renderOverlayRunning,
} from "./in-browser-overlay";

declare global {
  interface Window {
    __chromabrewAuditRunning?: boolean;
  }
}

async function main(): Promise<void> {
  if (window.__chromabrewAuditRunning) return;
  if (document.getElementById(OVERLAY_HOST_ID)) return;
  window.__chromabrewAuditRunning = true;
  renderOverlayRunning();
  try {
    const result = await runInBrowserAudit(document);
    renderOverlayResult(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    renderOverlayError(message || "unknown error");
  } finally {
    window.__chromabrewAuditRunning = false;
  }
}

void main();
