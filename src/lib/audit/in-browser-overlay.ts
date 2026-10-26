/**
 * Results overlay for the in-browser audit bundle.
 *
 * Vanilla DOM + Shadow DOM, no dependencies: this ships inside a bookmarklet
 * and an extension content script, so it cannot assume React, the site's CSS,
 * or any build-time CSS pipeline. Shadow DOM isolates the panel's styles from
 * the audited page (and vice versa) — the page's own stylesheets never leak
 * into the report, and the report never restyles the page.
 *
 * Nothing here sends data anywhere. Copy/download are explicit user actions
 * on results already sitting in their tab.
 */

import type { InBrowserAuditResult } from "./in-browser-audit";
import type { FindingDraft, FindingSeverityId } from "./types";

export const OVERLAY_HOST_ID = "chromabrew-audit-overlay";

const SEVERITY_LABEL: Record<FindingSeverityId, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  informational: "Informational",
};

const SEVERITY_COLOR: Record<FindingSeverityId, string> = {
  critical: "#b91c1c",
  high: "#c2410c",
  medium: "#a16207",
  low: "#0369a1",
  informational: "#52525b",
};

const CSS = `
:host { all: initial; }
.cb-panel {
  position: fixed; top: 12px; right: 12px; z-index: 2147483647;
  width: min(430px, calc(100vw - 24px)); max-height: calc(100vh - 24px);
  display: flex; flex-direction: column;
  background: #fff; color: #18181b;
  border: 1px solid #e4e4e7; border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,.25);
  font: 13px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.cb-head { padding: 12px 14px; border-bottom: 1px solid #e4e4e7; }
.cb-head h2 { margin: 0; font-size: 14px; font-weight: 700; }
.cb-head p { margin: 4px 0 0; color: #52525b; font-size: 12px; overflow-wrap: anywhere; }
.cb-body { padding: 12px 14px; overflow-y: auto; }
.cb-foot {
  padding: 10px 14px; border-top: 1px solid #e4e4e7;
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}
.cb-foot small { color: #71717a; font-size: 11px; flex-basis: 100%; }
.cb-btn {
  border: 1px solid #d4d4d8; background: #fff; color: #18181b;
  border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor: pointer;
}
.cb-btn:hover { background: #f4f4f5; }
.cb-btn-primary { background: #18181b; border-color: #18181b; color: #fff; }
.cb-btn-primary:hover { background: #3f3f46; }
.cb-pill {
  display: inline-block; border-radius: 999px; padding: 1px 8px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: #fff; margin-right: 6px; vertical-align: 1px;
}
.cb-finding { border: 1px solid #e4e4e7; border-radius: 8px; padding: 8px 10px; margin: 8px 0; }
.cb-finding h3 { margin: 0 0 4px; font-size: 13px; }
.cb-finding p { margin: 4px 0; color: #3f3f46; font-size: 12px; }
.cb-finding code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px;
  background: #f4f4f5; border-radius: 4px; padding: 0 4px; overflow-wrap: anywhere;
}
.cb-finding details { margin-top: 4px; font-size: 12px; color: #3f3f46; }
.cb-finding summary { cursor: pointer; color: #18181b; font-weight: 600; }
.cb-meta { color: #71717a; font-size: 11px; margin-top: 6px; }
.cb-empty {
  border: 1px solid #a7f3d0; background: #ecfdf5; color: #065f46;
  border-radius: 8px; padding: 10px 12px; font-size: 12px;
}
.cb-warn {
  border: 1px solid #fcd34d; background: #fffbeb; color: #92400e;
  border-radius: 8px; padding: 10px 12px; font-size: 12px; margin-bottom: 8px;
}
`;

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function severityPill(doc: Document, severity: FindingSeverityId): HTMLElement {
  const pill = doc.createElement("span");
  pill.className = "cb-pill";
  pill.style.background = SEVERITY_COLOR[severity];
  pill.textContent = SEVERITY_LABEL[severity];
  return pill;
}

function findingCard(doc: Document, finding: FindingDraft): HTMLElement {
  const card = doc.createElement("article");
  card.className = "cb-finding";
  const heading = doc.createElement("h3");
  heading.appendChild(severityPill(doc, finding.severity));
  heading.appendChild(doc.createTextNode(finding.title));
  card.appendChild(heading);

  card.appendChild(el("p", "", finding.description));
  if (finding.elementSelector) {
    const sel = el("p", "");
    sel.appendChild(doc.createTextNode("Element: "));
    const code = doc.createElement("code");
    code.textContent = finding.elementSelector;
    sel.appendChild(code);
    card.appendChild(sel);
  }
  if (finding.wcagCriterion) {
    card.appendChild(el("p", "cb-meta", finding.wcagCriterion));
  }
  const details = doc.createElement("details");
  const summary = doc.createElement("summary");
  summary.textContent = "Why this matters · what to do";
  details.appendChild(summary);
  details.appendChild(el("p", "", finding.whyMatters));
  details.appendChild(el("p", "", finding.recommendation));
  card.appendChild(details);
  return card;
}

function closeOverlay(): void {
  document.getElementById(OVERLAY_HOST_ID)?.remove();
}

function shell(title: string, subtitle: string): { host: HTMLElement; body: HTMLElement } {
  closeOverlay();
  const host = document.createElement("div");
  host.id = OVERLAY_HOST_ID;
  const shadow = host.attachShadow({ mode: "open" });
  // Adoptable stylesheets would be cleaner, but a plain <style> node works in
  // every host the bookmarklet can land on, including older Chromium builds.
  const style = document.createElement("style");
  style.textContent = CSS;
  const panel = document.createElement("div");
  panel.className = "cb-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", title);

  const head = document.createElement("div");
  head.className = "cb-head";
  const h2 = document.createElement("h2");
  h2.textContent = title;
  const sub = document.createElement("p");
  sub.textContent = subtitle;
  head.appendChild(h2);
  head.appendChild(sub);

  const body = document.createElement("div");
  body.className = "cb-body";

  const foot = document.createElement("div");
  foot.className = "cb-foot";
  const close = document.createElement("button");
  close.className = "cb-btn";
  close.type = "button";
  close.textContent = "Close";
  close.addEventListener("click", closeOverlay);
  foot.appendChild(close);
  const note = document.createElement("small");
  note.textContent = "Ran entirely in this tab against the page you see. Nothing was uploaded.";
  foot.appendChild(note);

  panel.appendChild(head);
  panel.appendChild(body);
  panel.appendChild(foot);
  shadow.appendChild(style);
  shadow.appendChild(panel);
  document.documentElement.appendChild(host);
  return { host, body };
}

/** Running state, shown while axe + measurements execute. */
export function renderOverlayRunning(): void {
  const { body } = shell("Auditing this page…", window.location.href);
  body.appendChild(el("p", "", "Measuring contrast, running axe-core and checking page structure in this tab."));
}

/** Failure state: the audit itself could not run (never a finding). */
export function renderOverlayError(message: string): void {
  const { body } = shell("This-page audit could not run", window.location.href);
  const warn = el("div", "cb-warn", `The audit did not run: ${message}`);
  body.appendChild(warn);
}

/** Finished state: the report, drawn from the live page. */
export function renderOverlayResult(result: InBrowserAuditResult): void {
  const subtitle = result.title ? `${result.title} — ${result.url}` : result.url;
  const { host, body } = shell(
    `This page: ${result.findings.length} issue${result.findings.length === 1 ? "" : "s"}`,
    subtitle,
  );
  const shadow = host.shadowRoot;
  const foot = shadow?.querySelector(".cb-foot");

  if (!result.coverage.engines.axe && result.coverage.axeError) {
    const warn = document.createElement("div");
    warn.className = "cb-warn";
    warn.textContent = `axe-core did not run (${result.coverage.axeError}). Contrast and structure findings below still stand — the absence of axe findings is “not checked”, not a pass.`;
    body.appendChild(warn);
  }

  if (result.findings.length === 0) {
    const ok = document.createElement("div");
    ok.className = "cb-empty";
    ok.textContent =
      "Every rule that ran passed on this page. That is a good result — it is not a WCAG conformance statement, only that these specific checks found nothing.";
    body.appendChild(ok);
  } else {
    for (const finding of result.findings) {
      body.appendChild(findingCard(document, finding));
    }
  }

  const coverage = document.createElement("p");
  coverage.className = "cb-meta";
  const engines = [
    "structure",
    "contrast",
    result.coverage.engines.axe ? "axe-core" : null,
  ].filter(Boolean);
  coverage.textContent =
    `Checked with ${engines.join(" + ")} in ${(result.durationMs / 1000).toFixed(1)}s. ` +
    `Contrast measured on ${result.coverage.measurable} text runs; ` +
    `${result.coverage.unmeasurable} could not be measured (image/gradient behind, or an unresolvable colour) and were not reported as failures.` +
    (result.duplicatesGrouped > 0 ? ` ${result.duplicatesGrouped} duplicate report${result.duplicatesGrouped === 1 ? "" : "s"} grouped.` : "");
  body.appendChild(coverage);

  if (foot) {
    const copy = document.createElement("button");
    copy.className = "cb-btn cb-btn-primary";
    copy.type = "button";
    copy.textContent = "Copy results (JSON)";
    copy.addEventListener("click", () => {
      const payload = JSON.stringify(result, null, 2);
      void navigator.clipboard?.writeText(payload).then(
        () => {
          copy.textContent = "Copied";
        },
        () => {
          copy.textContent = "Copy failed — select manually";
        },
      );
    });
    foot.insertBefore(copy, foot.firstChild);
  }
}
