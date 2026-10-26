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
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ANONYMOUS_CRAWL_SCANS_PER_DAY,
  ANONYMOUS_SCANS_PER_IP_PER_DAY,
  ANONYMOUS_SCANS_PER_IP_PER_HOUR,
  FREE_CRAWL_SCANS_PER_DAY,
  MAX_CONCURRENT_SCANS,
  PRO_CRAWL_SCANS_PER_DAY,
  SCAN_QUEUE_ABANDON_MS,
  type ScanScopeId,
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
  /**
   * Which limit refused, so the caller can explain it rather than guess.
   * `queue_full` is a busy moment; `quota` is the caller's own allowance. They
   * read very differently — one says come back shortly, the other says you have
   * used today's audits — and the interface used to append a per-day limit to
   * both, which was simply untrue of a full queue.
   */
  code?: "queue_full" | "quota";
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

/**
 * The scans that really occupy a scanner: running now, or queued and recent
 * enough that a worker may still be about to claim them.
 *
 * Age is part of the condition, not just status, and that is the fix for the
 * dead end the status-only version walked into. A `queued` row that nothing
 * ever claims still counted, so the moment the worker stopped, two abandoned
 * rows refused every submission — for everyone — with "the scanner is busy with
 * other audits", and the process that would have cleared them was the one that
 * was gone. Nothing in the web tier ever closed a queued row, so the gate shut
 * permanently and stayed shut until a person edited the database. A queued row
 * older than `SCAN_QUEUE_ABANDON_MS` is no longer outstanding work: the worker
 * closes it on its next poll, and the status route closes a reader's own.
 */
function outstandingScanWhere(now: number): Prisma.ScanWhereInput {
  return {
    OR: [
      { status: "running" },
      { status: "queued", createdAt: { gte: new Date(now - SCAN_QUEUE_ABANDON_MS) } },
    ],
  };
}

/**
 * Decide whether a new scan may start. Checks, in order:
 *   1. global concurrency (protects the worker and the host)
 *   2. the caller's own hourly and daily allowance
 */
export async function checkScanQuota(input: {
  userId: string | null;
  ipHash: string | null;
  /** Whole-site crawls draw from a separate, tighter daily allowance. */
  scope?: ScanScopeId;
  /** Pro buys a higher crawl allowance; everyone else shares the free one. */
  isPro?: boolean;
}): Promise<QuotaDecision> {
  const now = Date.now();

  const active = await prisma.scan.count({ where: outstandingScanWhere(now) });
  if (active >= MAX_CONCURRENT_SCANS) {
    // True when it appears, and only while it appears: the scans holding these
    // slots are running or were queued moments ago, so they either finish or
    // age out of the count. Nothing here can hold the gate shut indefinitely.
    return {
      allowed: false,
      code: "queue_full",
      reason: "Every scanner is busy with other audits right now. Try again in a few moments.",
      retryAfterSeconds: 30,
    };
  }

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
      code: "quota",
      reason: input.userId
        ? `You have reached ${hourLimit} audits this hour. Try again shortly.`
        : `Free audits are limited to ${hourLimit} per hour. Sign in for a higher limit, or try again later.`,
      retryAfterSeconds,
    };
  }

  if (lastDay >= dayLimit) {
    return {
      allowed: false,
      code: "quota",
      reason: input.userId
        ? `You have reached ${dayLimit} audits today.`
        : `Free audits are limited to ${dayLimit} per day. Sign in for a higher limit.`,
      retryAfterSeconds: 3600,
    };
  }

  // Crawls render every page in a real browser, so each one counts extra.
  // The general hourly/daily limits above still apply; this is the crawl's
  // own daily budget on top of them, and the reason names it so a refused
  // whole-site scan does not read as a refused scan of any kind.
  if (input.scope === "homepage_plus_pages") {
    const crawlLimit = !input.userId
      ? ANONYMOUS_CRAWL_SCANS_PER_DAY
      : input.isPro
        ? PRO_CRAWL_SCANS_PER_DAY
        : FREE_CRAWL_SCANS_PER_DAY;
    const crawlsToday = await prisma.scan.count({
      where: {
        ...identity,
        scope: "homepage_plus_pages",
        createdAt: { gte: new Date(now - DAY_MS) },
      },
    });
    if (crawlsToday >= crawlLimit) {
      return {
        allowed: false,
        code: "quota",
        reason: !input.userId
          ? `Free whole-site audits are limited to ${crawlLimit} per day. Sign in for a higher limit.`
          : input.isPro
            ? `You have reached ${crawlLimit} whole-site audits today.`
            : `Free whole-site audits are limited to ${crawlLimit} per day. Upgrade to Pro for ${PRO_CRAWL_SCANS_PER_DAY} a day.`,
        retryAfterSeconds: 3600,
      };
    }
  }

  return { allowed: true };
}
