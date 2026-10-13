import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  NO_SCANNER,
  SCANNER_OFFLINE_CODE,
  SCANNER_OFFLINE_MESSAGE,
  WORKER_HEARTBEAT_STALE_MS,
} from "./types";

const db = vi.hoisted(() => ({
  upsert: vi.fn(),
  updateMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { workerHeartbeat: db } }));

import {
  ScannerOfflineError,
  readScannerAvailability,
  recordWorkerHeartbeat,
  requireScanner,
  retireWorkerHeartbeat,
} from "./heartbeat";

/**
 * The worker's liveness record.
 *
 * The web tier and the worker share no filesystem and no network path, so this
 * row is the only thing standing between a reader and a form that accepts an
 * audit nothing will claim. Each assertion here is one half of that: the write
 * has to be current and per-worker, and the read has to refuse to be optimistic
 * about anything it cannot see.
 *
 * The database is mocked, as `runner.test.ts` mocks it, so what is being tested
 * is the query the module issues — the guard is a `where` clause and an
 * ordering, and neither is visible from the outside of a real connection.
 */
describe("recordWorkerHeartbeat", () => {
  beforeEach(() => db.upsert.mockReset());

  const startedAt = new Date(2026, 9, 13, 11, 0, 0);

  it("upserts on the worker id, so a restart reclaims its own row", async () => {
    db.upsert.mockResolvedValue({});

    await recordWorkerHeartbeat({
      workerId: "vps-1",
      startedAt,
      version: "1.0.0",
      host: "vps-1.internal",
    });

    const call = db.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ workerId: "vps-1" });
    // Both branches written, so a row that exists and one that does not end up
    // in the same state. A create-only payload would leave a restarted worker's
    // row claiming the old version and start time.
    for (const payload of [call.create, call.update]) {
      expect(payload.workerId).toBe("vps-1");
      expect(payload.lastSeenAt).toBeInstanceOf(Date);
      expect(payload.startedAt).toEqual(startedAt);
      expect(payload.version).toBe("1.0.0");
      expect(payload.host).toBe("vps-1.internal");
      // A beat says this worker is running *now*: it clears the clean-shutdown
      // mark its previous run left behind.
      expect(payload.stoppedAt).toBeNull();
    }
  });

  it("stores null rather than undefined for what the worker does not know", async () => {
    db.upsert.mockResolvedValue({});

    await recordWorkerHeartbeat({ workerId: "vps-1", startedAt });

    const call = db.upsert.mock.calls[0][0];
    expect(call.create.version).toBeNull();
    expect(call.create.host).toBeNull();
  });
});

describe("retireWorkerHeartbeat", () => {
  beforeEach(() => db.updateMany.mockReset());

  it("marks the departing worker's row instead of deleting it", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });

    await retireWorkerHeartbeat("vps-1");

    const call = db.updateMany.mock.calls[0][0];
    // Scoped to this worker: retiring must never take down another instance's
    // row on a host that runs more than one.
    expect(call.where).toEqual({ workerId: "vps-1" });
    expect(call.data.stoppedAt).toBeInstanceOf(Date);
    // `updateMany`, not `update`, so a worker that never reached its first beat
    // does not throw on the way out.
    expect(db.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe("readScannerAvailability", () => {
  beforeEach(() => db.findFirst.mockReset());

  const now = new Date(2026, 9, 13, 12, 0, 0).getTime();
  const ago = (ms: number) => new Date(now - ms);

  it("asks for the newest beat only", async () => {
    db.findFirst.mockResolvedValue(null);

    await readScannerAvailability(now);

    // One live worker is enough for the answer to be yes, so the question is not
    // per-worker: it is whether anything at all is beating.
    expect(db.findFirst.mock.calls[0][0].orderBy).toEqual({ lastSeenAt: "desc" });
    expect(db.findFirst.mock.calls[0][0].select).toMatchObject({ stoppedAt: true });
  });

  it("reports no scanner when nothing has ever checked in", async () => {
    db.findFirst.mockResolvedValue(null);

    await expect(readScannerAvailability(now)).resolves.toEqual(NO_SCANNER);
  });

  it("is online for a beat inside the window", async () => {
    db.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: ago(5_000),
      stoppedAt: null,
    });

    const availability = await readScannerAvailability(now);
    expect(availability.online).toBe(true);
    expect(availability.workerId).toBe("vps-1");
    expect(availability.ageMs).toBe(5_000);
  });

  it("is offline for a beat past the window, keeping the beat", async () => {
    db.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: ago(WORKER_HEARTBEAT_STALE_MS + 1),
      stoppedAt: null,
    });

    const availability = await readScannerAvailability(now);
    expect(availability.online).toBe(false);
    // The age survives the verdict, so the form can say how long the scanner has
    // been quiet rather than only that it is gone.
    expect(availability.lastSeenAt).toBe(ago(WORKER_HEARTBEAT_STALE_MS + 1).toISOString());
  });

  it("is offline the moment a worker stops cleanly, however fresh its last beat", async () => {
    db.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: ago(1_000),
      stoppedAt: new Date(now - 900),
    });

    const availability = await readScannerAvailability(now);
    expect(availability.online).toBe(false);
    // And the beat is still reported. This is the case that distinguishes "was
    // stopped" from "was never run" — deleting the row on shutdown would throw
    // that difference away and send someone looking for a worker they did forget
    // to start.
    expect(availability.lastSeenAt).toBe(ago(1_000).toISOString());
    expect(availability.workerId).toBe("vps-1");
  });
});

describe("requireScanner", () => {
  beforeEach(() => db.findFirst.mockReset());

  const now = new Date(2026, 9, 13, 12, 0, 0).getTime();

  it("refuses with the shared message and code when nothing is beating", async () => {
    db.findFirst.mockResolvedValue(null);

    const refusal = await requireScanner(now).catch((error: unknown) => error);

    expect(refusal).toBeInstanceOf(ScannerOfflineError);
    // The same strings the form renders, so the API's refusal and the interface's
    // state can never describe the same moment differently.
    expect((refusal as ScannerOfflineError).message).toBe(SCANNER_OFFLINE_MESSAGE);
    expect((refusal as ScannerOfflineError).code).toBe(SCANNER_OFFLINE_CODE);
  });

  it("refuses for a stopped worker as well as an absent one", async () => {
    db.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: new Date(now - 1_000),
      stoppedAt: new Date(now - 900),
    });

    await expect(requireScanner(now)).rejects.toBeInstanceOf(ScannerOfflineError);
  });

  it("lets a live worker through and returns what it found", async () => {
    db.findFirst.mockResolvedValue({
      workerId: "vps-1",
      lastSeenAt: new Date(now - 2_000),
      stoppedAt: null,
    });

    await expect(requireScanner(now)).resolves.toMatchObject({ online: true, workerId: "vps-1" });
  });
});
