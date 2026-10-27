/**
 * Scheduled whole-site re-scans.
 *
 * A schedule is one watched site per user: the worker enqueues a fresh scan
 * whenever `nextRunAt` passes, then advances it by `intervalDays`. Schedules
 * need a signed-in owner (anonymous scans have nobody to bill, nobody to
 * attribute, and no quota identity), and the interval plus the active count
 * are capped by plan — free stays a weekly reminder, Pro pays the compute.
 *
 * Nothing here renders a page or spends worker time: creation only validates
 * and writes a row. The expensive part stays in the worker loop, which calls
 * `enqueueDueRescans` between polls (see `scripts/audit-worker.mjs`).
 */

import { prisma } from "@/lib/db";
import { AUDIT_SCANNER_VERSION, scannerCanCrawl, type ScanScopeId } from "./types";
import { enqueueScan, validateScanRequest } from "./runner";

export interface ScheduleIntervalOption {
  days: number;
  label: string;
}

export const SCHEDULE_INTERVALS: readonly ScheduleIntervalOption[] = [
  { days: 1, label: "Daily" },
  { days: 7, label: "Weekly" },
];

/** Free stays a reminder; Pro may watch a small portfolio. */
export const FREE_MAX_SCHEDULES = 1;
export const PRO_MAX_SCHEDULES = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
/** A failed rescan retries in an hour rather than waiting out the interval. */
const RESCAN_RETRY_MS = 60 * 60 * 1000;
/** Bound one worker tick's scheduling work; the rest wait for the next tick. */
const DUE_RESCAN_BATCH = 10;

export class ScheduleError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ScheduleError";
    this.code = code;
  }
}

export interface ScheduleDto {
  id: string;
  url: string;
  normalizedUrl: string;
  scope: ScanScopeId;
  viewportId: string;
  intervalDays: number;
  active: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  lastScanId: string | null;
  failureCount: number;
  /** Emailed-report recipients (Pro). Empty means re-scan silently. */
  emailRecipients: string[];
  createdAt: string;
}

type ScheduleRow = {
  id: string;
  url: string;
  normalizedUrl: string;
  scope: string;
  viewportId: string;
  intervalDays: number;
  active: boolean;
  nextRunAt: Date;
  lastRunAt: Date | null;
  lastScanId: string | null;
  failureCount: number;
  emailRecipients: string;
  createdAt: Date;
};

function toDto(schedule: ScheduleRow): ScheduleDto {
  return {
    id: schedule.id,
    url: schedule.url,
    normalizedUrl: schedule.normalizedUrl,
    scope: schedule.scope as ScanScopeId,
    viewportId: schedule.viewportId,
    intervalDays: schedule.intervalDays,
    active: schedule.active,
    nextRunAt: schedule.nextRunAt.toISOString(),
    lastRunAt: schedule.lastRunAt?.toISOString() ?? null,
  lastScanId: schedule.lastScanId,
  failureCount: schedule.failureCount,
  emailRecipients: readRecipients(schedule.emailRecipients),
  createdAt: schedule.createdAt.toISOString(),
};
}

const scheduleSelect = {
  id: true,
  url: true,
  normalizedUrl: true,
  scope: true,
  viewportId: true,
  intervalDays: true,
  active: true,
  nextRunAt: true,
  lastRunAt: true,
  lastScanId: true,
  failureCount: true,
  emailRecipients: true,
  createdAt: true,
} as const;

export function allowedIntervals(isPro: boolean): number[] {
  return isPro ? SCHEDULE_INTERVALS.map((option) => option.days) : [7];
}

export function maxSchedules(isPro: boolean): number {
  return isPro ? PRO_MAX_SCHEDULES : FREE_MAX_SCHEDULES;
}

/** Emailed scheduled reports go to at most three addresses per watch. */
export const MAX_REPORT_RECIPIENTS = 3;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Stored recipients are a JSON text array; a corrupt value reads as none. */
function readRecipients(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

/**
 * Parse and validate recipient emails. Throws ScheduleError with a
 * displayable message when the list is not an array of up to three valid
 * addresses. Normalises case and drops blanks and duplicates, so
 * "Me@X.test" and "me@x.test " count as one recipient.
 */
export function parseReportRecipients(input: unknown): string[] {
  if (!Array.isArray(input)) {
    throw new ScheduleError(
      "recipients_invalid",
      "Send up to three recipient email addresses.",
    );
  }
  const unique = [
    ...new Set(
      input
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0),
    ),
  ];
  if (unique.length > MAX_REPORT_RECIPIENTS) {
    throw new ScheduleError(
      "recipients_invalid",
      `Emailed reports go to at most ${MAX_REPORT_RECIPIENTS} addresses per watch.`,
    );
  }
  for (const email of unique) {
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      throw new ScheduleError("recipients_invalid", `"${email}" is not a valid email address.`);
    }
  }
  return unique;
}

/**
 * Watch a site. Throws ScheduleError with a displayable message when the
 * caller asks for more than their plan allows; URL/scope problems surface as
 * the runner's ScanRequestError, whose messages are already written to show.
 */
export async function createSchedule(input: {
  userId: string;
  url: string;
  scope?: ScanScopeId;
  viewportId?: string;
  intervalDays: number;
  isPro: boolean;
  emailRecipients?: unknown;
  now?: number;
}): Promise<ScheduleDto> {
  const now = input.now ?? Date.now();
  const scope = input.scope ?? "homepage_plus_pages";

  if (!allowedIntervals(input.isPro).includes(input.intervalDays)) {
    throw new ScheduleError(
      "interval_not_allowed",
      input.isPro
        ? "Choose a daily or weekly re-scan."
        : "Scheduled re-scans are weekly on the free plan — upgrade to Pro for daily.",
    );
  }

  const emailRecipients =
    input.emailRecipients === undefined ? [] : parseReportRecipients(input.emailRecipients);
  if (emailRecipients.length > 0 && !input.isPro) {
    throw new ScheduleError(
      "recipients_pro_only",
      "Emailed reports are a Pro feature — upgrade to have every re-scan land in the inbox.",
    );
  }

  // Validates the URL, the scope and the viewport with the same messages the
  // scan form shows, so a schedule can never be created for something a scan
  // would refuse.
  const { normalizedUrl } = validateScanRequest({
    url: input.url,
    scope,
    viewportId: input.viewportId ?? "desktop",
  });

  const activeCount = await prisma.auditSchedule.count({
    where: { userId: input.userId, active: true },
  });
  const limit = maxSchedules(input.isPro);
  if (activeCount >= limit) {
    throw new ScheduleError(
      "schedule_limit",
      input.isPro
        ? `Pro watches up to ${limit} sites — delete one to add another.`
        : "The free plan watches one site — upgrade to Pro to watch more.",
    );
  }

  // One active watch per URL: re-watching the same site would double-bill the
  // worker for the same pages. Re-saving refreshes the interval instead.
  const existing = await prisma.auditSchedule.findFirst({
    where: { userId: input.userId, normalizedUrl, active: true },
    select: { id: true },
  });
  if (existing) {
    throw new ScheduleError(
      "already_watching",
      "This site is already watched — delete the existing schedule to change it.",
    );
  }

  const created = await prisma.auditSchedule.create({
    data: {
      userId: input.userId,
      url: input.url.trim(),
      normalizedUrl,
      scope,
      viewportId: input.viewportId ?? "desktop",
      intervalDays: input.intervalDays,
      nextRunAt: new Date(now + input.intervalDays * DAY_MS),
      emailRecipients: JSON.stringify(emailRecipients),
    },
    select: scheduleSelect,
  });
  return toDto(created);
}

export async function listSchedules(userId: string): Promise<ScheduleDto[]> {
  const rows = await prisma.auditSchedule.findMany({
    where: { userId },
    orderBy: { nextRunAt: "asc" },
    take: 20,
    select: scheduleSelect,
  });
  return rows.map(toDto);
}

export async function listSchedulesForUrl(
  userId: string,
  normalizedUrl: string,
): Promise<ScheduleDto[]> {
  const rows = await prisma.auditSchedule.findMany({
    where: { userId, normalizedUrl },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: scheduleSelect,
  });
  return rows.map(toDto);
}

export async function setScheduleActive(
  userId: string,
  id: string,
  active: boolean,
  now: number = Date.now(),
): Promise<ScheduleDto> {
  const schedule = await prisma.auditSchedule.findFirst({
    where: { id, userId },
    select: { ...scheduleSelect },
  });
  if (!schedule) {
    throw new ScheduleError("not_found", "That schedule does not exist.");
  }
  // Reactivating restarts the interval from now rather than firing the
  // backlog of missed runs at the worker all at once.
  const updated = await prisma.auditSchedule.update({
    where: { id },
    data: active
      ? { active: true, nextRunAt: new Date(now + schedule.intervalDays * DAY_MS), failureCount: 0 }
      : { active: false },
    select: scheduleSelect,
  });
  return toDto(updated);
}

/**
 * Set a watch's emailed-report recipients. An empty list disables the email
 * while the watch keeps re-scanning; a non-empty list is Pro-only, like the
 * bundle the email points at. Throws ScheduleError with a displayable
 * message for unknown watches, bad addresses and free-plan callers.
 */
export async function setScheduleRecipients(input: {
  userId: string;
  id: string;
  emailRecipients: unknown;
  isPro: boolean;
}): Promise<ScheduleDto> {
  const recipients = parseReportRecipients(input.emailRecipients);
  if (recipients.length > 0 && !input.isPro) {
    throw new ScheduleError(
      "recipients_pro_only",
      "Emailed reports are a Pro feature — upgrade to have every re-scan land in the inbox.",
    );
  }
  const schedule = await prisma.auditSchedule.findFirst({
    where: { id: input.id, userId: input.userId },
    select: { id: true },
  });
  if (!schedule) {
    throw new ScheduleError("not_found", "That schedule does not exist.");
  }
  const updated = await prisma.auditSchedule.update({
    where: { id: input.id },
    data: { emailRecipients: JSON.stringify(recipients) },
    select: scheduleSelect,
  });
  return toDto(updated);
}

export async function deleteSchedule(userId: string, id: string): Promise<void> {
  const deleted = await prisma.auditSchedule.deleteMany({
    where: { id, userId },
  });
  if (deleted.count === 0) {
    throw new ScheduleError("not_found", "That schedule does not exist.");
  }
}

/**
 * Enqueue every due watch. Called by the worker loop between polls — the
 * worker is the only process guaranteed to be running, so no new
 * infrastructure is needed to trigger re-scans.
 *
 * A due watch that cannot be enqueued (bad URL, unimplemented scope) backs
 * off for an hour rather than failing loudly every tick; the failure count
 * is visible on the schedule so the owner can see it is stale. Skips are not
 * failures: a crawl scope waits for a crawl-capable worker instead of
 * degrading into a single-page scan the reader did not ask for.
 */
export async function enqueueDueRescans(
  now: number = Date.now(),
): Promise<{ enqueued: number; skipped: number }> {
  const due = await prisma.auditSchedule.findMany({
    where: { active: true, nextRunAt: { lte: new Date(now) } },
    orderBy: { nextRunAt: "asc" },
    take: DUE_RESCAN_BATCH,
  });

  let enqueued = 0;
  let skipped = 0;

  for (const schedule of due) {
    if (
      schedule.scope === "homepage_plus_pages" &&
      !scannerCanCrawl(AUDIT_SCANNER_VERSION)
    ) {
      skipped += 1;
      continue;
    }
    try {
      const { id } = await enqueueScan({
        url: schedule.url,
        scope: schedule.scope as ScanScopeId,
        viewportId: schedule.viewportId,
        userId: schedule.userId,
        ipHash: null,
      });
      await prisma.auditSchedule.update({
        where: { id: schedule.id },
        data: {
          lastScanId: id,
          lastRunAt: new Date(now),
          nextRunAt: new Date(now + schedule.intervalDays * DAY_MS),
          failureCount: 0,
        },
      });
      enqueued += 1;
    } catch (error) {
      // A watch that can never run must not spin the loop forever: back off,
      // count it, and leave the row for its owner to fix or delete.
      await prisma.auditSchedule.update({
        where: { id: schedule.id },
        data: {
          failureCount: schedule.failureCount + 1,
          nextRunAt: new Date(now + RESCAN_RETRY_MS),
        },
      });
      skipped += 1;
      void error;
    }
  }

  return { enqueued, skipped };
}
