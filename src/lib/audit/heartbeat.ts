/**
 * Worker liveness.
 *
 * The web tier and the worker are separate hosts that share nothing but the
 * database (`docs/AUDIT_WORKER_HOST.md`), so that is where liveness has to live:
 * a process on the worker's own machine cannot answer for it and is not
 * reachable from the app, and the worker cannot call into the app. One row per
 * worker, refreshed on a timer by the worker itself.
 *
 * The worker writes; the app reads; neither trusts the other's clock. A reader
 * grades the newest beat against its own clock, which is why nothing but
 * timestamps crosses the boundary.
 *
 * Why it exists: without it the form accepted a URL and wrote a `queued` row
 * whether or not anything was there to claim it, and the reader learned the
 * truth by watching a progress view for ten minutes until the queue gave up on
 * their scan. A refusal before the row is written is the difference between a
 * message and a wasted audit — and because the refusal is here rather than only
 * in the interface, a stale form, a cached page and a direct API call are all
 * covered by the same check.
 */

import { prisma } from "@/lib/db";
import {
  NO_SCANNER,
  SCANNER_OFFLINE_CODE,
  SCANNER_OFFLINE_MESSAGE,
  scannerAvailability,
  type ScannerAvailability,
} from "./types";

export interface HeartbeatInput {
  /** Stable per worker process: two workers must never share a row. */
  workerId: string;
  /** When this process started, so a restart is visible rather than implied. */
  startedAt: Date;
  version?: string | null;
  host?: string | null;
}

/**
 * Write a beat. Called once at startup and then on a repeating timer.
 *
 * An upsert keyed on the worker id, so a restart rewrites its own row instead of
 * accumulating one per run. Every column is rewritten rather than only the
 * timestamp: they all describe the process beating *now*, and a restarted worker
 * can be a different version on a different host under the same id.
 *
 * Deliberately generic: it does not check the heartbeat window and does not
 * build any availability out of what it wrote. A writer that judged its own
 * freshness would be reading a clock it just set, and a worker that has been
 * paused for minutes would cheerfully report itself healthy on waking.
 */
export async function recordWorkerHeartbeat(input: HeartbeatInput): Promise<void> {
  const data = {
    workerId: input.workerId,
    lastSeenAt: new Date(),
    startedAt: input.startedAt,
    // Cleared, not carried over: a beat says this worker is running now, and a
    // restarted worker reclaims a row its previous run marked as stopped.
    stoppedAt: null,
    version: input.version ?? null,
    host: input.host ?? null,
  };

  await prisma.workerHeartbeat.upsert({
    where: { workerId: input.workerId },
    create: data,
    update: data,
  });
}

/**
 * Mark this worker as stopped on a clean shutdown.
 *
 * Marked rather than deleted. Deleting would take `lastSeenAt` with it, and the
 * reader would then be told "no scanner has checked in yet" about a scanner that
 * stopped five seconds ago — while this is the one case where the difference
 * between *was stopped* and *was never run* is genuinely knowable, and the second
 * reading sends someone looking for a worker they forgot to start.
 *
 * Scoped by worker id, so it can only ever retire the departing worker's own
 * row, never a second instance's. `updateMany` rather than `update` because a
 * worker that never reached its first beat must not turn its own clean shutdown
 * into an exception: there is nobody left to report it to.
 *
 * Without this the form would go on offering an audit for the whole stale window
 * after a graceful stop, which is the one case where the answer is knowable
 * immediately.
 */
export async function retireWorkerHeartbeat(workerId: string): Promise<void> {
  await prisma.workerHeartbeat.updateMany({
    where: { workerId },
    data: { stoppedAt: new Date() },
  });
}

/**
 * The newest beat in the database, graded against this process's clock.
 *
 * `take 1` on a descending sort rather than anything per-worker: the question
 * the web tier asks is "can anyone run this audit", and one live worker is
 * enough for the answer to be yes. A worker that stopped beating stops being
 * the newest one the moment it matters.
 *
 * Errors are left to the caller. A missing table or an unreachable database is
 * not evidence that the scanner is offline, and reporting it as one would
 * disable the audit feature behind a message that names the wrong cause.
 */
export async function readScannerAvailability(now = Date.now()): Promise<ScannerAvailability> {
  const newest = await prisma.workerHeartbeat.findFirst({
    orderBy: { lastSeenAt: "desc" },
    select: { workerId: true, lastSeenAt: true, stoppedAt: true },
  });

  if (!newest) return NO_SCANNER;

  const graded = scannerAvailability(newest.lastSeenAt, newest.workerId, now);

  // A worker that stopped cleanly is offline from that moment regardless of what
  // its last beat said — but the beat is still what gets reported, so the form
  // says how long it has been quiet rather than that nothing was ever there.
  return newest.stoppedAt ? { ...graded, online: false } : graded;
}

/**
 * The refusal itself.
 *
 * A typed error rather than a boolean so the API can answer with the right
 * status and code without re-deriving why: `503` with `scanner_offline`, which
 * the form recognises as the one failure it can render as a state rather than as
 * an error message.
 */
export class ScannerOfflineError extends Error {
  readonly code = SCANNER_OFFLINE_CODE;

  constructor() {
    super(SCANNER_OFFLINE_MESSAGE);
    this.name = "ScannerOfflineError";
  }
}

/**
 * Availability, or a `ScannerOfflineError`.
 *
 * The single place that decides whether a scan may be written, so the answer
 * cannot differ between the interface that offers the form and the route that
 * accepts it.
 */
export async function requireScanner(now = Date.now()): Promise<ScannerAvailability> {
  const availability = await readScannerAvailability(now);
  if (!availability.online) throw new ScannerOfflineError();
  return availability;
}
