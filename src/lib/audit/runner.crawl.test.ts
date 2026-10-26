import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RenderedPage } from "./browser";
import type { PageRenderer } from "./pipeline";
import type { TextSample } from "./types";

/**
 * The crawl loop, end to end against a mocked database.
 *
 * The pipeline tests prove one page analyses correctly; the crawl planner
 * tests prove the right pages are chosen. What neither proves is the loop
 * between them — that a five-page scope really writes five page rows, counts
 * them live, never visits one page twice, survives a dead link, and finishes
 * with a status the report can stand behind. That loop is what this file
 * asserts, with a renderer that hands out canned pages and a database that
 * records what the runner wrote.
 */

const db = vi.hoisted(() => ({
  scan: { findUnique: vi.fn(), update: vi.fn() },
  scannedPage: { create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  finding: { createMany: vi.fn() },
}));

const screenshotStore = vi.hoisted(() => ({
  saveScreenshot: vi.fn(),
  readScreenshot: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("./screenshot-store", () => screenshotStore);

import { runClaimedScan } from "./runner";

const HTML = (title: string) => `<!doctype html>
<html lang="en"><head><title>${title}</title>
<meta name="description" content="Fixture."><meta name="viewport" content="width=device-width">
</head><body><h1>${title}</h1></body></html>`;

/** DNS stub: every host resolves publicly, so no lookup happens. */
const resolve = async () => ["93.184.216.34"];

let pageCounter = 0;

/** A renderer that serves one canned page per URL, with internal links. */
function renderer(pages: Record<string, { title: string; links: string[]; status?: number }>): PageRenderer {
  return {
    available: async () => true,
    render: async (url: URL): Promise<RenderedPage> => {
      const entry = pages[url.toString()];
      if (!entry) throw new Error(`unexpected URL ${url.toString()}`);
      const samples: TextSample[] = [];
      return {
        finalUrl: url.toString(),
        statusCode: entry.status ?? 200,
        contentType: "text/html",
        title: entry.title,
        html: HTML(entry.title),
        screenshot: new Uint8Array([1, 2, 3]),
        textSamples: samples,
        textSamplesTruncated: false,
        unmeasurableSamples: 0,
        unmeasurableReasons: {},
        links: {
          anchorsSeen: entry.links.length,
          distinct: entry.links.length,
          internal: entry.links.length,
          external: 0,
          externalHosts: [],
          truncated: false,
          links: entry.links.map((href) => ({ href, text: "", internal: true, nofollow: false })),
        },
        blockedRequests: [],
        requestCount: 1,
        axeResults: null,
        elementRects: [],
        axeVersion: null,
        axeError: "axe not loaded in fixtures",
        loadTimeMs: 100,
      };
    },
  };
}

function scanRow(scope: string, pagesTotal: number) {
  return {
    id: "scan-1",
    url: "https://example.com/",
    normalizedUrl: "https://example.com/",
    status: "running",
    scope,
    viewportWidth: 1280,
    viewportHeight: 720,
    pagesScanned: 0,
    pagesTotal,
    pagesFailed: 0,
    errorMessage: null,
    createdAt: new Date(),
    startedAt: new Date(),
    completedAt: null,
    durationMs: null,
    metadata: { stage: "validating", ruleCount: 10 },
  };
}

/** Every scan.update call, as plain objects. */
function scanUpdates(): Array<Record<string, unknown>> {
  return db.scan.update.mock.calls.map((call) => call[0].data);
}

describe("runClaimedScan crawl loop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageCounter = 0;
    db.scannedPage.create.mockImplementation(() => {
      pageCounter += 1;
      return Promise.resolve({ id: `page-${pageCounter}` });
    });
    db.scannedPage.update.mockResolvedValue({});
    db.finding.createMany.mockResolvedValue({ count: 0 });
    db.scan.update.mockResolvedValue({});
    // The worker-local file exists by default; the disk-failure test overrides.
    screenshotStore.saveScreenshot.mockResolvedValue("scan-1/page-1.png");
    screenshotStore.readScreenshot.mockResolvedValue(null);
  });

  it("visits the seed and its same-origin links once each, then completes", async () => {
    db.scan.findUnique.mockResolvedValue(scanRow("homepage_plus_pages", 5));

    await runClaimedScan("scan-1", {
      resolve,
      renderer: renderer({
        "https://example.com/": {
          title: "Home",
          links: ["https://example.com/pricing", "https://example.com/about"],
        },
        "https://example.com/pricing": { title: "Pricing", links: [] },
        "https://example.com/about": { title: "About", links: ["https://example.com/"] },
      }),
    });

    // Three pages: the seed, then both links. The /about page links back to
    // the seed, and the seed is never scanned twice.
    expect(db.scannedPage.create).toHaveBeenCalledTimes(3);
    const writtenUrls = db.scannedPage.create.mock.calls.map((call) => call[0].data.url);
    expect(writtenUrls).toEqual([
      "https://example.com/",
      "https://example.com/pricing",
      "https://example.com/about",
    ]);

    // The final status counts what really happened, and the crawl's ceiling
    // was replaced by the site's real page count along the way.
    const final = scanUpdates().at(-1) as { status: string; pagesScanned: number; pagesFailed: number };
    expect(final.status).toBe("completed");
    expect(final.pagesScanned).toBe(3);
    expect(final.pagesFailed).toBe(0);
    expect(scanUpdates().some((update) => update.pagesTotal === 3)).toBe(true);
  });

  it("never exceeds the scope's page budget", async () => {
    db.scan.findUnique.mockResolvedValue(scanRow("homepage_plus_pages", 5));

    await runClaimedScan("scan-1", {
      resolve,
      renderer: renderer({
        "https://example.com/": {
          title: "Home",
          links: [
            "https://example.com/a",
            "https://example.com/b",
            "https://example.com/c",
            "https://example.com/d",
            "https://example.com/e",
            "https://example.com/f",
          ],
        },
        "https://example.com/a": { title: "A", links: [] },
        "https://example.com/b": { title: "B", links: [] },
        "https://example.com/c": { title: "C", links: [] },
        "https://example.com/d": { title: "D", links: [] },
        "https://example.com/e": { title: "E", links: [] },
        "https://example.com/f": { title: "F", links: [] },
      }),
    });

    // The seed plus four of six candidates: five pages, never six.
    expect(db.scannedPage.create).toHaveBeenCalledTimes(5);
    const final = scanUpdates().at(-1) as { pagesScanned: number };
    expect(final.pagesScanned).toBe(5);
  });

  it("records a dead follow-up page and finishes the rest", async () => {
    db.scan.findUnique.mockResolvedValue(scanRow("homepage_plus_pages", 5));

    await runClaimedScan("scan-1", {
      resolve,
      renderer: renderer({
        "https://example.com/": {
          title: "Home",
          links: ["https://example.com/gone", "https://example.com/ok"],
        },
        // /gone is missing from the fixture, so the renderer throws for it —
        // the shape a refused or broken page takes.
        "https://example.com/ok": { title: "Fine", links: [] },
      }),
    });

    // Both pages are accounted for: the dead one carries its error, the live
    // one its findings, and the scan is partial rather than failed.
    expect(db.scannedPage.create).toHaveBeenCalledTimes(3);
    const failedRow = db.scannedPage.create.mock.calls
      .map((call) => call[0].data)
      .find((data) => data.url === "https://example.com/gone");
    expect(failedRow?.errorMessage).toBeTruthy();

    const final = scanUpdates().at(-1) as {
      status: string;
      pagesScanned: number;
      pagesFailed: number;
      errorMessage: string | null;
    };
    expect(final.status).toBe("partially_completed");
    // A failed page still counts as visited — the same accounting a single
    // 404 page has always had (scanned 1, failed 1) — so the reader can see
    // three attempts, one of which could not be analysed.
    expect(final.pagesScanned).toBe(3);
    expect(final.pagesFailed).toBe(1);
    expect(final.errorMessage).toMatch(/1 of 3 pages/);
  });

  it("scans exactly one page for the single-page scope", async () => {
    db.scan.findUnique.mockResolvedValue(scanRow("single_page", 1));

    await runClaimedScan("scan-1", {
      resolve,
      renderer: renderer({
        "https://example.com/": {
          title: "Home",
          // Links exist but the scope forbids following them: one page means
          // one page, or the scope selector is a lie.
          links: ["https://example.com/pricing"],
        },
        "https://example.com/pricing": { title: "Pricing", links: [] },
      }),
    });

    expect(db.scannedPage.create).toHaveBeenCalledTimes(1);
    const final = scanUpdates().at(-1) as { status: string; pagesScanned: number };
    expect(final.status).toBe("completed");
    expect(final.pagesScanned).toBe(1);
  });

  it("ends the crawl at the seed when the seed itself failed", async () => {
    db.scan.findUnique.mockResolvedValue(scanRow("homepage_plus_pages", 5));

    await runClaimedScan("scan-1", {
      resolve,
      renderer: renderer({
        // The 404 page's links are the error document's links, not the
        // site's — following them would audit the wrong thing.
        "https://example.com/": { title: "Not found", links: ["https://example.com/pricing"], status: 404 },
        "https://example.com/pricing": { title: "Pricing", links: [] },
      }),
    });

    expect(db.scannedPage.create).toHaveBeenCalledTimes(1);
    const final = scanUpdates().at(-1) as { status: string; pagesFailed: number };
    expect(final.status).toBe("partially_completed");
    expect(final.pagesFailed).toBe(1);
  });

  it("stores the screenshot bytes independently of the worker's disk", async () => {
    db.scan.findUnique.mockResolvedValue(scanRow("single_page", 1));
    // The worker-local file write fails — a full disk, a rotated volume — and
    // the old code lost the screenshot with it.
    screenshotStore.saveScreenshot.mockRejectedValue(new Error("disk full"));

    await runClaimedScan("scan-1", {
      resolve,
      renderer: renderer({ "https://example.com/": { title: "Home", links: [] } }),
    });

    // The bytes reached the database anyway: that is the copy the web tier
    // serves, and it must not depend on this host's filesystem.
    const bytesUpdate = db.scannedPage.update.mock.calls
      .map((call) => call[0].data)
      .find((data) => data.screenshotData instanceof Uint8Array);
    expect(bytesUpdate).toBeTruthy();
  });
});
