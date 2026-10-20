/**
 * Abuse friction for the suggestion endpoint.
 *
 * The endpoint is cheap heuristic compute (no per-call cost), so a
 * database-backed quota table would be heavier than the thing it protects.
 * This is a single-instance, in-memory sliding window keyed by client IP:
 * approximate behind multiple instances, but always safe in the direction
 * that matters — it can only under-count across instances, never lock
 * anyone out, and entries expire so a full bucket always drains.
 */

export const AI_SUGGESTIONS_PER_MINUTE = 30;

/**
 * Wider bucket for callers holding the `ai` entitlement (Pro). Same window
 * logic, different cap: the paid plan buys headroom, not a different code
 * path — see src/lib/entitlements-server.ts `hasEntitlement`.
 */
export const AI_SUGGESTIONS_PER_MINUTE_PRO = 120;
const WINDOW_MS = 60 * 1000;

const hits = new Map<string, number[]>();

/** Pure core: given the timestamps in the window, may one more request pass? */
export function bucketAllows(
  timestamps: number[],
  now: number,
  limit: number = AI_SUGGESTIONS_PER_MINUTE,
): { allowed: boolean; retryAfterSeconds: number } {
  const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
  if (fresh.length < limit) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const oldest = Math.min(...fresh);
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)),
  };
}

export function checkAiRateLimit(
  key: string,
  now: number = Date.now(),
  limit: number = AI_SUGGESTIONS_PER_MINUTE,
): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const timestamps = hits.get(key) ?? [];
  const decision = bucketAllows(timestamps, now, limit);
  if (decision.allowed) {
    hits.set(key, [...timestamps.filter((t) => now - t < WINDOW_MS), now]);
  } else if (timestamps.length > AI_SUGGESTIONS_PER_MINUTE * 2) {
    // Bound memory when someone hammers: keep only the recent window.
    hits.set(
      key,
      timestamps.filter((t) => now - t < WINDOW_MS),
    );
  }
  return decision;
}

/** For tests: forget all recorded traffic. */
export function resetAiRateLimits(): void {
  hits.clear();
}
