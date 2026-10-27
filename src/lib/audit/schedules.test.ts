import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  auditSchedule: {
    count: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  scan: { create: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ prisma: db }));

import {
  ScheduleError,
  createSchedule,
  deleteSchedule,
  enqueueDueRescans,
  parseReportRecipients,
  setScheduleActive,
  setScheduleRecipients,
} from "./schedules";

const NOW = new Date("2026-10-26T12:00:00Z").getTime();

function scheduleRow(overrides = {}) {
  return {
    id: "sched-1",
    url: "https://example.com",
    normalizedUrl: "https://example.com/",
    scope: "homepage_plus_pages",
    viewportId: "desktop",
    intervalDays: 7,
    active: true,
    nextRunAt: new Date(NOW - 1_000),
    lastRunAt: null,
    lastScanId: null,
    failureCount: 0,
    createdAt: new Date(NOW - 8 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

describe("createSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses a daily interval on the free plan", async () => {
    await expect(
      createSchedule({ userId: "u1", url: "https://example.com", intervalDays: 1, isPro: false, now: NOW }),
    ).rejects.toMatchObject({ code: "interval_not_allowed" });
    expect(db.auditSchedule.create).not.toHaveBeenCalled();
  });

  it("refuses a second watch on the free plan", async () => {
    db.auditSchedule.count.mockResolvedValue(1);

    await expect(
      createSchedule({ userId: "u1", url: "https://example.com", intervalDays: 7, isPro: false, now: NOW }),
    ).rejects.toMatchObject({ code: "schedule_limit" });
  });

  it("refuses to watch the same site twice", async () => {
    db.auditSchedule.count.mockResolvedValue(0);
    db.auditSchedule.findFirst.mockResolvedValue({ id: "sched-1" });

    await expect(
      createSchedule({ userId: "u1", url: "https://example.com", intervalDays: 7, isPro: false, now: NOW }),
    ).rejects.toMatchObject({ code: "already_watching" });
  });

  it("schedules the first run one interval out", async () => {
    db.auditSchedule.count.mockResolvedValue(0);
    db.auditSchedule.findFirst.mockResolvedValue(null);
    db.auditSchedule.create.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      ...scheduleRow(),
      ...args.data,
    }));

    const schedule = await createSchedule({
      userId: "u1",
      url: "https://example.com",
      intervalDays: 7,
      isPro: false,
      now: NOW,
    });

    expect(schedule.normalizedUrl).toBe("https://example.com/");
    expect(schedule.nextRunAt).toBe(new Date(NOW + 7 * 24 * 60 * 60 * 1000).toISOString());
  });

  it("rejects a URL no scan would accept", async () => {
    await expect(
      createSchedule({ userId: "u1", url: "not a url at all", intervalDays: 7, isPro: false, now: NOW }),
    ).rejects.toThrow();
    expect(db.auditSchedule.create).not.toHaveBeenCalled();
  });
});

describe("setScheduleActive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("404s an unknown schedule", async () => {
    db.auditSchedule.findFirst.mockResolvedValue(null);

    await expect(setScheduleActive("u1", "missing", false, NOW)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("restarts the interval when a watch resumes", async () => {
    db.auditSchedule.findFirst.mockResolvedValue(scheduleRow({ active: false }));
    db.auditSchedule.update.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      ...scheduleRow(),
      ...args.data,
    }));

    const schedule = await setScheduleActive("u1", "sched-1", true, NOW);

    expect(schedule.active).toBe(true);
    expect(schedule.nextRunAt).toBe(new Date(NOW + 7 * 24 * 60 * 60 * 1000).toISOString());
  });
});

describe("parseReportRecipients", () => {
  it("accepts up to three addresses and normalises them", () => {
    expect(parseReportRecipients(["Me@X.test ", "me@x.test", "b@x.test"])).toEqual([
      "me@x.test",
      "b@x.test",
    ]);
  });

  it("refuses a fourth address, a bad address and a non-array", async () => {
    expect(() => parseReportRecipients(["a@x.test", "b@x.test", "c@x.test", "d@x.test"])).toThrow(
      expect.objectContaining({ code: "recipients_invalid" }),
    );
    expect(() => parseReportRecipients(["not-an-email"])).toThrow(
      expect.objectContaining({ code: "recipients_invalid" }),
    );
    expect(() => parseReportRecipients("a@x.test")).toThrow(
      expect.objectContaining({ code: "recipients_invalid" }),
    );
  });
});

describe("setScheduleRecipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the list as JSON and returns it parsed", async () => {
    db.auditSchedule.findFirst.mockResolvedValue({ id: "sched-1" });
    db.auditSchedule.update.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
      ...scheduleRow(),
      ...args.data,
    }));

    const schedule = await setScheduleRecipients({
      userId: "u1",
      id: "sched-1",
      emailRecipients: ["a@x.test"],
      isPro: true,
    });

    expect(db.auditSchedule.update).toHaveBeenCalledWith({
      where: { id: "sched-1" },
      data: { emailRecipients: '["a@x.test"]' },
      select: expect.anything(),
    });
    expect(schedule.emailRecipients).toEqual(["a@x.test"]);
  });

  it("refuses recipients on the free plan and unknown watches", async () => {
    await expect(
      setScheduleRecipients({ userId: "u1", id: "s-1", emailRecipients: ["a@x.test"], isPro: false }),
    ).rejects.toMatchObject({ code: "recipients_pro_only" });

    db.auditSchedule.findFirst.mockResolvedValue(null);
    await expect(
      setScheduleRecipients({ userId: "u1", id: "missing", emailRecipients: [], isPro: true }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("deleteSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only deletes its owner's row", async () => {
    db.auditSchedule.deleteMany.mockResolvedValue({ count: 1 });

    await deleteSchedule("u1", "sched-1");

    expect(db.auditSchedule.deleteMany).toHaveBeenCalledWith({
      where: { id: "sched-1", userId: "u1" },
    });
  });

  it("404s when nothing was deleted", async () => {
    db.auditSchedule.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteSchedule("u1", "missing")).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

describe("enqueueDueRescans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueues due watches and advances them by their interval", async () => {
    db.auditSchedule.findMany.mockResolvedValue([scheduleRow()]);
    db.scan.create.mockResolvedValue({ id: "scan-new" });
    db.auditSchedule.update.mockResolvedValue({});

    const result = await enqueueDueRescans(NOW);

    expect(result).toEqual({ enqueued: 1, skipped: 0 });
    expect(db.scan.create).toHaveBeenCalledTimes(1);
    expect(db.scan.create.mock.calls[0][0].data.normalizedUrl).toBe("https://example.com/");
    const update = db.auditSchedule.update.mock.calls[0][0];
    expect(update.data.lastScanId).toBe("scan-new");
    expect(update.data.nextRunAt).toEqual(new Date(NOW + 7 * 24 * 60 * 60 * 1000));
    expect(update.data.failureCount).toBe(0);
  });

  it("backs a failing watch off instead of spinning on it", async () => {
    db.auditSchedule.findMany.mockResolvedValue([scheduleRow()]);
    db.scan.create.mockRejectedValue(new Error("queue full"));

    const result = await enqueueDueRescans(NOW);

    expect(result).toEqual({ enqueued: 0, skipped: 1 });
    const update = db.auditSchedule.update.mock.calls[0][0];
    expect(update.data.failureCount).toBe(1);
    expect(update.data.nextRunAt).toEqual(new Date(NOW + 60 * 60 * 1000));
  });

  it("does nothing when nothing is due", async () => {
    db.auditSchedule.findMany.mockResolvedValue([]);

    await expect(enqueueDueRescans(NOW)).resolves.toEqual({ enqueued: 0, skipped: 0 });
    expect(db.scan.create).not.toHaveBeenCalled();
  });
});
