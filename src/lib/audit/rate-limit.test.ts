import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FREE_CRAWL_SCANS_PER_DAY,
  MAX_CONCURRENT_SCANS,
  PRO_CRAWL_SCANS_PER_DAY,
  SCAN_QUEUE_ABANDON_MS,
} from "./types";

const db = vi.hoisted(() => ({ count: vi.fn(), findFirst: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: { scan: { count: db.count, findFirst: db.findFirst } } }));

import { ACCOUNT_SCANS_PER_HOUR, checkScanQuota } from "./rate-limit";

/**
 * The gate that decides whether a scan may start.
 *
 * Two things about it are load-bearing and neither is visible from a passing
 * request: *which* rows it counts as busy, and *which* limit it names when it
 * refuses. Getting the first wrong shut the feature down permanently the moment
 * the worker stopped — every submission answering "the scanner is busy with
 * other audits" while an abandoned row held a slot — and getting the second
 * wrong told people they had used up audits they never ran.
 */
describe("checkScanQuota", () => {
  beforeEach(() => {
    db.count.mockReset();
    db.findFirst.mockReset();
  });

  it("counts a running scan and a recent queued one, but not an abandoned queue", async () => {
    db.count.mockResolvedValue(0);
    db.findFirst.mockResolvedValue(null);

    const decision = await checkScanQuota({ userId: null, ipHash: "abc123" });
    expect(decision.allowed).toBe(true);

    const where = db.count.mock.calls[0][0].where;
    expect(where).toEqual({
      OR: [
        { status: "running" },
        { status: "queued", createdAt: { gte: expect.any(Date) } },
      ],
    });

    // The cutoff is the queue's abandonment window, not the notice window: a
    // scan that is merely waiting still holds its slot.
    const cutoff = where.OR[1].createdAt.gte as Date;
    expect(Date.now() - cutoff.getTime()).toBeCloseTo(SCAN_QUEUE_ABANDON_MS, -3);
  });

  it("refuses a full queue as a busy moment, never as the caller's own allowance", async () => {
    db.count.mockResolvedValue(MAX_CONCURRENT_SCANS);

    const decision = await checkScanQuota({ userId: "user-1", ipHash: null });

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("queue_full");
    expect(decision.reason).toContain("Every scanner is busy");
    // The interface appends the per-hour and per-day limits to a quota refusal
    // and to nothing else; this reason must not invite that.
    expect(decision.reason).not.toMatch(/per hour|per day|reached/i);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
    // The queue is checked before the caller is, so a refusal to identify
    // yourself cannot walk around a full scanner.
    expect(db.count).toHaveBeenCalledTimes(1);
  });

  it("names the caller's hourly allowance when that is what they hit", async () => {
    db.count
      .mockResolvedValueOnce(0) // nothing occupying a scanner
      .mockResolvedValueOnce(ACCOUNT_SCANS_PER_HOUR) // this hour
      .mockResolvedValueOnce(0); // today
    const oldest = new Date(Date.now() - 30 * 60 * 1000);
    db.findFirst.mockResolvedValue({ createdAt: oldest });

    const decision = await checkScanQuota({ userId: "user-1", ipHash: null });

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("quota");
    expect(decision.reason).toContain(`${ACCOUNT_SCANS_PER_HOUR} audits this hour`);
    // The retry is the moment the oldest scan in the window falls out of it.
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
    expect(decision.retryAfterSeconds).toBeLessThanOrEqual(30 * 60);
  });

  it("lets a crawl through inside its own daily allowance", async () => {
    db.count.mockResolvedValue(0);
    db.findFirst.mockResolvedValue(null);

    const decision = await checkScanQuota({
      userId: "user-1",
      ipHash: null,
      scope: "homepage_plus_pages",
      isPro: false,
    });

    expect(decision.allowed).toBe(true);
    // The multi-page budget is counted separately from the general
    // hourly/daily scans: the last count query covers both multi-page scopes.
    const crawlWhere = db.count.mock.calls.at(-1)![0].where;
    expect(crawlWhere.scope).toEqual({ in: ["homepage_plus_pages", "selected_pages"] });
  });

  it("holds selected-pages scans to the same multi-page budget", async () => {
    db.count.mockResolvedValue(0);
    db.findFirst.mockResolvedValue(null);

    const allowed = await checkScanQuota({
      userId: "user-1",
      ipHash: null,
      scope: "selected_pages",
      isPro: false,
    });

    expect(allowed.allowed).toBe(true);
    const crawlWhere = db.count.mock.calls.at(-1)![0].where;
    expect(crawlWhere.scope).toEqual({ in: ["homepage_plus_pages", "selected_pages"] });
  });

  it("refuses a crawl over the free allowance with the upgrade path", async () => {
    db.count
      .mockResolvedValueOnce(0) // scanner free
      .mockResolvedValueOnce(0) // this hour
      .mockResolvedValueOnce(0) // today
      .mockResolvedValueOnce(FREE_CRAWL_SCANS_PER_DAY); // crawls today
    db.findFirst.mockResolvedValue(null);

    const decision = await checkScanQuota({
      userId: "user-1",
      ipHash: null,
      scope: "homepage_plus_pages",
      isPro: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("quota");
    expect(decision.reason).toContain("whole-site");
    expect(decision.reason).toContain(`Pro for ${PRO_CRAWL_SCANS_PER_DAY} a day`);
  });

  it("refuses a selected-pages scan over the budget in its own words", async () => {
    db.count
      .mockResolvedValueOnce(0) // scanner free
      .mockResolvedValueOnce(0) // this hour
      .mockResolvedValueOnce(0) // today
      .mockResolvedValueOnce(FREE_CRAWL_SCANS_PER_DAY); // multi-page today
    db.findFirst.mockResolvedValue(null);

    const decision = await checkScanQuota({
      userId: "user-1",
      ipHash: null,
      scope: "selected_pages",
      isPro: false,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("quota");
    expect(decision.reason).toContain("selected-pages");
    expect(decision.reason).not.toContain("whole-site");
  });

  it("holds Pro crawls to the higher allowance, not the free one", async () => {
    db.count.mockResolvedValue(0);
    db.findFirst.mockResolvedValue(null);

    const allowed = await checkScanQuota({
      userId: "user-1",
      ipHash: null,
      scope: "homepage_plus_pages",
      isPro: true,
    });
    expect(allowed.allowed).toBe(true);
  });

  it("counts against the caller's own identity, not everyone's", async () => {
    db.count.mockResolvedValue(0);
    db.findFirst.mockResolvedValue(null);

    await checkScanQuota({ userId: null, ipHash: "hashed" });

    const identityQueries = db.count.mock.calls.slice(1).map((call) => call[0].where);
    expect(identityQueries).toHaveLength(2);
    for (const where of identityQueries) {
      expect(where.ipHash).toBe("hashed");
      expect(where.userId).toBeUndefined();
    }
  });
});
