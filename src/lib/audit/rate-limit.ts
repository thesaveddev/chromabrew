/**
 * Scan quota and abuse controls.
 *
 * Counters are derived from the `Scan` table itself rather than a separate
 * table, so the limit that a user hits is always the limit that the database
 * can actually see — no in-memory counter to drift or lose on redeploy.
 *
 * The IP is never stored in the clear: only a salted hash, which is enough to
 * rate limit one client without keeping a list of who visited.
 */

import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ANONYMOUS_SCANS_PER_IP_PER_DAY,
  ANONYMOUS_SCANS_PER_IP_PER_HOUR,
  MAX_CONCURRENT_SCANS,
} from "./types";

/** Authenticated users get more headroom; still bounded so one account cannot flood the queue. */
export const ACCOUNT_SCANS_PER_HOUR = 10;
export const ACCOUNT_SCANS_PER_DAY = 50;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface QuotaDecision {
  allowed: boolean;
  /** User-facing explanation. Never leaks internal detail. */
  reason?: string;
  retryAfterSeconds?: number;
}

/** Salted, truncated SHA-256 of the client IP. Null stays null. */
export function hashIp(ip: string | null | undefined): string | null {
  const trimmed = ip?.trim();
  if (!trimmed) return null;
  const salt = process.env.AUTH_SECRET ?? "chromabrew-audit";
  return createHash("sha256").update(`${salt}:${trimmed}`).digest("hex").slice(0, 32);
}

/** Best-effort client IP from proxy headers. */
export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() ?? null;
}

const ACTIVE_STATUSES = ["queued", "running"] as const;

/**
 * Decide whether a new scan may start. Checks, in order:
 *   1. global concurrency (protects the worker and the host)
 *   2. the caller's own hourly and daily allowance
 */
export async function checkScanQuota(input: {
  userId: string | null;
  ipHash: string | null;
}): Promise<QuotaDecision> {
  const active = await prisma.scan.count({
    where: { status: { in: [...ACTIVE_STATUSES] } },
  });
  if (active >= MAX_CONCURRENT_SCANS) {
    return {
      allowed: false,
      reason: "The scanner is busy with other audits. Try again in a moment.",
      retryAfterSeconds: 20,
    };
  }

  const now = Date.now();
  const identity = input.userId
    ? { userId: input.userId }
    : input.ipHash
      ? { ipHash: input.ipHash }
      : null;

  if (!identity) {
    // No user and no usable IP: allow a single scan rather than blocking
    // someone behind a stripped-proxy setup, but do not let it be cheap to loop.
    return { allowed: true };
  }

  const hourLimit = input.userId ? ACCOUNT_SCANS_PER_HOUR : ANONYMOUS_SCANS_PER_IP_PER_HOUR;
  const dayLimit = input.userId ? ACCOUNT_SCANS_PER_DAY : ANONYMOUS_SCANS_PER_IP_PER_DAY;

  const [lastHour, lastDay, oldestInWindow] = await Promise.all([
    prisma.scan.count({
      where: { ...identity, createdAt: { gte: new Date(now - HOUR_MS) } },
    }),
    prisma.scan.count({
      where: { ...identity, createdAt: { gte: new Date(now - DAY_MS) } },
    }),
    prisma.scan.findFirst({
      where: { ...identity, createdAt: { gte: new Date(now - HOUR_MS) } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  if (lastHour >= hourLimit) {
    const retryAfterSeconds = oldestInWindow
      ? Math.max(1, Math.ceil((oldestInWindow.createdAt.getTime() + HOUR_MS - now) / 1000))
      : 60;
    return {
      allowed: false,
      reason: input.userId
        ? `You have reached ${hourLimit} audits this hour. Try again shortly.`
        : `Free audits are limited to ${hourLimit} per hour. Sign in for a higher limit, or try again later.`,
      retryAfterSeconds,
    };
  }

  if (lastDay >= dayLimit) {
    return {
      allowed: false,
      reason: input.userId
        ? `You have reached ${dayLimit} audits today.`
        : `Free audits are limited to ${dayLimit} per day. Sign in for a higher limit.`,
      retryAfterSeconds: 3600,
    };
  }

  return { allowed: true };
}
