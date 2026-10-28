import { beforeEach, describe, expect, it, vi } from "vitest";

import { SCAN_QUEUE_ABANDON_MS, SCAN_QUEUE_NOTICE_MS } from "./types";

const db = vi.hoisted(() => ({ updateMany: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { scan: { updateMany: db.updateMany } } }));

import {
  expireAbandonedScan,
  normalizeSelectedPages,
  recoverStaleScans,
  seedErrorMessage,
  validateScanRequest,
} from "./runner";

/**
 * Closing rows nothing is coming for.
 *
 * Both functions are the reason a missing worker degrades into an honest
 * failure instead of a queue that never drains: the sweep clears the rows a dead
 * worker left behind (they hold the two scanner slots), and the targeted expiry
 * lets a reader's own poll end their wait. What matters is that neither of them
 * touches a scan that is still live.
 */
describe("recoverStaleScans", () => {
  beforeEach(() => db.updateMany.mockReset());

  it("closes interrupted runs and abandoned queue entries, and reports both", async () => {
    db.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 2 });

    await expect(recoverStaleScans()).resolves.toBe(3);
    expect(db.updateMany).toHaveBeenCalledTimes(2);

    const [running, queued] = db.updateMany.mock.calls.map((call) => call[0]);

    expect(running.where.status).toBe("running");
    expect(running.where.startedAt.lt).toBeInstanceOf(Date);
    expect(running.data.status).toBe("failed");
    expect(running.data.errorMessage).toMatch(/interrupted before it finished/);
    expect(running.data.completedAt).toBeInstanceOf(Date);

    expect(queued.where.status).toBe("queued");
    // The same ten minutes as an interrupted run: this is the system's definition
    // of "nobody is coming back for this".
    expect(Date.now() - queued.where.createdAt.lt.getTime()).toBeCloseTo(
      SCAN_QUEUE_ABANDON_MS,
      -3,
    );
    expect(queued.data.status).toBe("failed");
    expect(queued.data.errorMessage).toMatch(/No scanner started this audit in time/);
  });
});

/**
 * The seed page's failure is the scan's message. A bot-blocked seed ends a
 * whole-site crawl before it starts, so that message must say the crawl never
 * started and offer the two ways through — the allowlist and the in-browser
 * audit — rather than just naming the HTTP code.
 */
describe("seedErrorMessage", () => {
  it("keeps the plain status message for an ordinary error document", () => {
    expect(
      seedErrorMessage({ statusCode: 500, blockedProvider: null, maxPages: 5 }),
    ).toBe("The page responded with HTTP 500; findings describe the error document.");
  });

  it("names the block and the in-browser way through for a single page", () => {
    const message = seedErrorMessage({
      statusCode: 403,
      blockedProvider: "Cloudflare",
      maxPages: 1,
    });
    expect(message).toContain("Cloudflare bot verification blocked the seed page");
    expect(message).toContain("/audit/this-page");
    expect(message).not.toContain("crawl never started");
  });

  it("says the crawl never started when a whole-site seed is blocked", () => {
    const message = seedErrorMessage({
      statusCode: 403,
      blockedProvider: "Cloudflare",
      maxPages: 5,
    });
    expect(message).toContain("so the crawl never started and no pages were audited");
    expect(message).toContain("/audit/this-page");
  });

  it("says the selected pages were never audited when their seed is blocked", () => {
    const message = seedErrorMessage({
      statusCode: 403,
      blockedProvider: "Cloudflare",
      maxPages: 10,
      scope: "selected_pages",
    });
    expect(message).toContain("so none of the selected pages were audited");
    expect(message).not.toContain("crawl never started");
    expect(message).toContain("/audit/this-page");
  });
});

/**
 * The explicit page list behind the selected-pages scope.
 *
 * The scope is only honest if the list it scans is exactly the list the reader
 * typed: the seed is scanned anyway so listing it again must not double-scan
 * it, junk must be refused with a message before anything is written, and a
 * list longer than the budget must be refused rather than quietly truncated —
 * a reader who listed eleven pages and got ten audited would never know which
 * one was skipped.
 */
describe("normalizeSelectedPages", () => {
  const SEED = "https://example.com/";

  it("normalizes entries, assumes https, and drops blanks and repeats", () => {
    expect(
      normalizeSelectedPages({
        seedNormalizedUrl: SEED,
        selectedPages: [
          "example.com/pricing",
          "https://example.com/pricing",
          "https://example.com/about?utm_source=x",
          "   ",
          42,
        ],
        maxPages: 10,
      }),
    ).toEqual(["https://example.com/pricing", "https://example.com/about"]);
  });

  it("drops the seed URL itself instead of scanning it twice", () => {
    expect(
      normalizeSelectedPages({
        seedNormalizedUrl: SEED,
        selectedPages: ["https://example.com/", "https://example.com/about"],
        maxPages: 10,
      }),
    ).toEqual(["https://example.com/about"]);
  });

  it("refuses an empty list with the way forward", () => {
    expect(() =>
      normalizeSelectedPages({ seedNormalizedUrl: SEED, selectedPages: [], maxPages: 10 }),
    ).toThrow(/at least one more page URL/);
  });

  it("refuses a list past the budget instead of truncating it", () => {
    const pages = Array.from({ length: 10 }, (_, i) => `https://example.com/p${i}`);
    expect(() =>
      normalizeSelectedPages({ seedNormalizedUrl: SEED, selectedPages: pages, maxPages: 10 }),
    ).toThrow(/up to 10 pages/);
  });

  it("refuses junk with the validator's own message", () => {
    expect(() =>
      normalizeSelectedPages({
        seedNormalizedUrl: SEED,
        selectedPages: ["https://example.com/about", "not a url at all!!!"],
        maxPages: 10,
      }),
    ).toThrow();
  });
});

describe("validateScanRequest with selected_pages", () => {
  it("accepts the scope with a page list and returns it normalized", () => {
    const result = validateScanRequest({
      url: "example.com",
      scope: "selected_pages",
      viewportId: "desktop",
      selectedPages: ["example.com/pricing", "https://example.com/about"],
    });

    expect(result.normalizedUrl).toBe("https://example.com/");
    expect(result.scope.id).toBe("selected_pages");
    expect(result.selectedPages).toEqual([
      "https://example.com/pricing",
      "https://example.com/about",
    ]);
  });

  it("refuses the scope without a page list", () => {
    expect(() =>
      validateScanRequest({
        url: "example.com",
        scope: "selected_pages",
        viewportId: "desktop",
        selectedPages: [],
      }),
    ).toThrow(/at least one more page URL/);
  });

  it("ignores a page list on other scopes", () => {
    const result = validateScanRequest({
      url: "example.com",
      scope: "single_page",
      viewportId: "desktop",
      selectedPages: ["https://example.com/pricing"],
    });

    expect(result.selectedPages).toEqual([]);
  });
});

describe("expireAbandonedScan", () => {
  beforeEach(() => db.updateMany.mockReset());

  it("closes one abandoned queued scan and says that it did", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });

    await expect(expireAbandonedScan("cmv4dead")).resolves.toBe(true);

    const call = db.updateMany.mock.calls[0][0];
    expect(call.where.id).toBe("cmv4dead");
    // Guarded by status and age, so it can never close a scan a worker has
    // claimed or one that is merely waiting its turn.
    expect(call.where.status).toBe("queued");
    expect(Date.now() - call.where.createdAt.lt.getTime()).toBeCloseTo(SCAN_QUEUE_ABANDON_MS, -3);
    expect(call.data.status).toBe("failed");
    expect(call.data.errorMessage).toMatch(/No scanner started this audit in time/);
  });

  it("leaves a scan that is still inside the notice window alone", async () => {
    // The guard the database applies: a scan that is only *waiting* is not old
    // enough to match, so the update changes nothing and the row stays queued.
    db.updateMany.mockResolvedValue({ count: 0 });

    await expect(expireAbandonedScan("cmv4waiting")).resolves.toBe(false);
    expect(db.updateMany).toHaveBeenCalledTimes(1);
    expect(SCAN_QUEUE_NOTICE_MS).toBeLessThan(SCAN_QUEUE_ABANDON_MS);
  });
});
