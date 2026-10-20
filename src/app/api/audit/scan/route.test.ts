import { beforeEach, describe, expect, it, vi } from "vitest";

import { SCANNER_OFFLINE_CODE, SCANNER_OFFLINE_MESSAGE, WORKER_HEARTBEAT_STALE_MS } from "@/lib/audit/types";

const db = vi.hoisted(() => ({
  workerHeartbeat: { findFirst: vi.fn() },
  scan: {
    count: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/auth/config", () => ({ auth: vi.fn(async () => null) }));

import { POST } from "./route";

/**
 * Enqueueing an audit.
 *
 * The endpoint used to write a `queued` row whether or not anything was there to
 * claim it, so a reader whose scanner was down got a queued audit and found out
 * ten minutes later. The refusal is the part that makes the interface's "scanner
 * offline" true rather than advisory, and it is asserted here rather than only
 * through the form because a stale page, a cached form and a direct API call all
 * arrive at this route and none of them go through the form.
 */
function post(body: unknown): Request {
  return new Request("http://localhost/api/audit/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function queuedRow() {
  return {
    id: "cmv4queued",
    url: "https://example.com",
    normalizedUrl: "https://example.com/",
    status: "queued",
    scope: "single_page",
    viewportWidth: 1280,
    viewportHeight: 720,
    pagesScanned: 0,
    pagesTotal: 1,
    pagesFailed: 0,
    errorMessage: null,
    createdAt: new Date(2026, 9, 13, 12, 0, 0),
    startedAt: null,
    completedAt: null,
    durationMs: null,
    metadata: { stage: "validating" },
  };
}

describe("POST /api/audit/scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.scan.count.mockResolvedValue(0);
    db.scan.create.mockResolvedValue({ id: "cmv4queued" });
    db.scan.findUnique.mockResolvedValue(queuedRow());
  });

  it("refuses while no scanner is beating, and writes nothing", async () => {
    db.workerHeartbeat.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: new Date(Date.now() - WORKER_HEARTBEAT_STALE_MS - 1_000),
      stoppedAt: null,
    });

    const response = await POST(post({ url: "example.com", scope: "single_page" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    // The same code and message the form renders as a state, so the two ends of
    // the exchange cannot describe the same moment differently.
    expect(body.code).toBe(SCANNER_OFFLINE_CODE);
    expect(body.error).toBe(SCANNER_OFFLINE_MESSAGE);

    // Nothing was written. This is the assertion that matters: a refusal that
    // still left a row behind would be a message, not a refusal.
    expect(db.scan.create).not.toHaveBeenCalled();
  });

  it("checks the scanner before the quota, so a busy queue cannot answer for a dead worker", async () => {
    db.workerHeartbeat.findFirst.mockResolvedValue(null);

    const response = await POST(post({ url: "example.com", scope: "single_page" }));

    expect(response.status).toBe(503);
    // No quota query at all. Otherwise a reader whose scanner is down would be
    // told "every scanner is busy right now, try again in a few moments" — and
    // would come back, and be told it again, for as long as the worker is gone.
    expect(db.scan.count).not.toHaveBeenCalled();
  });

  it("refuses a stopped worker too, not only an absent one", async () => {
    db.workerHeartbeat.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: new Date(),
      stoppedAt: new Date(),
    });

    const response = await POST(post({ url: "example.com" }));

    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe(SCANNER_OFFLINE_CODE);
  });

  it("queues the audit when a scanner is beating", async () => {
    db.workerHeartbeat.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: new Date(),
      stoppedAt: null,
    });

    const response = await POST(post({ url: "example.com", scope: "single_page" }));

    // `202` with `{ id }`: the contract the scanner UI reads, and the field it
    // pushes to `/audit/:id`. Answering `201` with `{ scanId }` was a real bug
    // here, and it looked exactly like a working scan from this endpoint.
    expect(response.status).toBe(202);
    expect((await response.json()).id).toBe("cmv4queued");
    expect(db.scan.create).toHaveBeenCalledTimes(1);
  });

  it("refuses a whole-site scope from a worker that predates crawling", async () => {
    // The worker is a separate deploy: this web tier can offer the crawl while
    // the beating worker still runs code that scans one page. Accepting then
    // would quietly deliver a single page for a five-page request.
    db.workerHeartbeat.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: new Date(),
      stoppedAt: null,
      version: "2.1.0",
    });

    const response = await POST(post({ url: "example.com", scope: "homepage_plus_pages" }));

    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("scope_unavailable");
    expect(db.scan.create).not.toHaveBeenCalled();
  });

  it("accepts a whole-site scope from a current worker", async () => {
    db.workerHeartbeat.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: new Date(),
      stoppedAt: null,
      version: "3.0.0",
    });
    db.scan.create.mockResolvedValue({ id: "cmv4crawl" });
    // The route answers with the status DTO it re-reads after enqueueing, so
    // the row it re-reads has to be the crawl that was just written.
    db.scan.findUnique.mockResolvedValue({ ...queuedRow(), id: "cmv4crawl", scope: "homepage_plus_pages", pagesTotal: 5 });

    const response = await POST(post({ url: "example.com", scope: "homepage_plus_pages" }));

    expect(response.status).toBe(202);
    expect((await response.json()).id).toBe("cmv4crawl");
  });

  it("still answers a typo with a typo, not with the scanner's state", async () => {
    db.workerHeartbeat.findFirst.mockResolvedValue(null);

    // Deliberately before the scanner check: a load limit — or a dead worker —
    // must not decide whether a malformed URL is malformed.
    const response = await POST(post({ url: "   " }));

    expect(response.status).toBe(400);
    expect(db.workerHeartbeat.findFirst).not.toHaveBeenCalled();
    expect(db.scan.create).not.toHaveBeenCalled();
  });
});
