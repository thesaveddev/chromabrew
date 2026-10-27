import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SCANNER_OFFLINE_MESSAGE, WORKER_HEARTBEAT_MS } from "@/lib/audit/types";
import { UrlFormView, type UrlFormViewProps } from "./url-form";

/**
 * The audit form.
 *
 * What it has to get right is what it does when there is no scanner: it used to
 * accept a URL, write a queued row and report a queued audit, and the reader
 * found out ten minutes later that nothing had ever been coming for it. So the
 * submit is withheld rather than answered, the reason is stated, and the two ways
 * of having no scanner — never started, or stopped — are told apart instead of
 * being flattened into one message.
 *
 * Rendered to static markup so no DOM dependency is needed, as the other audit
 * components' tests do.
 */
const LAST_SEEN = "2026-10-13T12:00:00.000Z";
const SEEN_AT = Date.parse(LAST_SEEN);

function render(overrides: Partial<UrlFormViewProps> = {}): string {
  const props: UrlFormViewProps = {
    url: "",
    onUrlChange: () => {},
    scope: "single_page",
    onScopeChange: () => {},
    viewport: "desktop",
    onViewportChange: () => {},
    onSubmit: () => {},
    loading: false,
    error: "",
    offline: false,
    lastSeenAt: null,
    now: 0,
    ...overrides,
  };
  return renderToStaticMarkup(createElement(UrlFormView, props));
}

describe("UrlFormView with a scanner", () => {
  it("offers the audit and says nothing about availability", () => {
    const html = render();

    expect(html).toContain("Analyze Website");
    expect(html).not.toContain("Scanner offline");
    expect(html).not.toContain(SCANNER_OFFLINE_MESSAGE);
    // Online is the ordinary case and does not need announcing: a status line
    // that is always there stops meaning anything.
    expect(html).not.toContain('role="status"');
  });

  it("keeps the limits stated before they are hit", () => {
    const html = render();

    expect(html).toContain("Free audits are limited to");
    expect(html).toContain("hashed IP address");
  });

  it("offers the whole-site scope and disables the one that is not ready", () => {
    const html = render();

    // The two executable scopes are selectable; the third stays visible but
    // disabled, so the roadmap is legible without the API ever receiving it.
    expect(html).toContain("Whole site (up to 5 pages)");
    expect(html).toContain("Selected pages");
    expect(html).toContain("coming soon");
  });

  it("explains whichever scope is selected, in the scanner's own words", () => {
    // The description under the picker is the selected scope's, so choosing
    // the crawl says exactly what will be crawled before the reader commits.
    const html = render({ scope: "homepage_plus_pages" });

    expect(html).toContain("Crawls same-origin links from your URL");
    expect(html).not.toContain("Analyse just the URL you submit");
  });

  it("offers both viewports and describes why the choice matters", () => {
    const html = render();

    expect(html).toContain("Desktop 1280 x 720");
    expect(html).toContain("Mobile 390 x 844");
    expect(html).toContain("Contrast is measured at this size");
  });
});

describe("UrlFormView with no scanner", () => {
  it("withholds the submit instead of answering it", () => {
    const html = render({ offline: true, lastSeenAt: LAST_SEEN, now: SEEN_AT + 252_000 });

    expect(html).toContain("Scanner offline");
    // Not "Analyze Website" with an error ready behind it: the point is that the
    // form does not take a URL it cannot act on.
    expect(html).not.toContain("Analyze Website");
    expect(html).toContain("disabled");
  });

  it("says nothing was queued, in the same words the API refuses with", () => {
    const html = render({ offline: true, lastSeenAt: LAST_SEEN, now: SEEN_AT });

    // The shared string, so the refusal and the state cannot drift apart — and it
    // answers the fear a reader actually has here: not "I cannot scan" but "did I
    // just queue an audit that will fail later".
    expect(html).toContain(SCANNER_OFFLINE_MESSAGE);
    expect(html).toContain("Nothing was queued");
  });

  it("announces the state and says how long the scanner has been quiet", () => {
    const html = render({ offline: true, lastSeenAt: LAST_SEEN, now: SEEN_AT + 252_000 });

    // A live region, so the change is announced rather than only seen: the button
    // it explains is disabled and therefore not focusable, which means a
    // keyboard user never lands on it to hear the reason.
    expect(html).toContain('role="status"');
    expect(html).toContain("Silent for 4m 12s.");
  });

  it("promises a retry it can actually make", () => {
    const html = render({ offline: true, lastSeenAt: LAST_SEEN, now: SEEN_AT });

    expect(html).toContain(
      `checks again every ${Math.round(WORKER_HEARTBEAT_MS / 1_000)} seconds`,
    );
    expect(html).toContain("come back on its own");
  });

  it("distinguishes a scanner that stopped from one that was never run", () => {
    const stopped = render({ offline: true, lastSeenAt: LAST_SEEN, now: SEEN_AT + 1_000 });
    const never = render({ offline: true, lastSeenAt: null, now: SEEN_AT });

    expect(stopped).toContain("Silent for 1s.");
    expect(stopped).not.toContain("No scanner has checked in yet");

    // No duration is invented for a beat that never arrived: "never ran" sends a
    // reader to their deployment, "offline for 4m" sends them to their logs.
    expect(never).toContain("No scanner has checked in yet.");
    expect(never).not.toContain("Silent for");
  });

  it("invents no duration before its own clock has ticked", () => {
    // `useQueueClock` reports 0 until its first tick. An age measured against a
    // zero clock would be decades, so the line waits rather than lying.
    const html = render({ offline: true, lastSeenAt: LAST_SEEN, now: 0 });

    expect(html).toContain("Scanner offline");
    expect(html).not.toContain("Silent for");
    expect(html).not.toContain("No scanner has checked in yet");
  });
});

describe("UrlFormView example audit", () => {
  it("offers a one-click example instead of an empty field to think about", () => {
    const html = render({ exampleUrl: "https://chromabrew.com/design-system" });

    expect(html).toContain("No URL handy?");
    expect(html).toContain("Audit our own generator page as an example");
  });

  it("stays out of the way where no example is wanted", () => {
    const html = render();

    expect(html).not.toContain("No URL handy?");
  });
});

describe("UrlFormView while submitting", () => {
  it("does not invite a second submit", () => {
    const html = render({ loading: true, url: "example.com" });

    expect(html).toContain("Starting scan...");
    expect(html).not.toContain("Analyze Website");
    expect(html).toContain("disabled");
  });

  it("still shows a server error when one comes back", () => {
    const html = render({ error: "Free audits are limited to 3 per hour." });

    expect(html).toContain("Free audits are limited to 3 per hour.");
  });
});
