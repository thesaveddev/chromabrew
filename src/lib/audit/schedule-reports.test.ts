import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  auditSchedule: { findMany: vi.fn() },
}));

const entitlements = vi.hoisted(() => ({ hasEntitlement: vi.fn() }));
const queries = vi.hoisted(() => ({
  getScanResultsDto: vi.fn(),
  getScanRegression: vi.fn(),
}));
const mail = vi.hoisted(() => ({ sendScheduleReportEmail: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/entitlements-server", () => entitlements);
vi.mock("./queries", () => queries);
vi.mock("@/lib/mail", () => mail);

import { sendScheduleReportsForScan } from "./schedule-reports";

function schedule(overrides = {}) {
  return {
    id: "sched-1",
    userId: "u1",
    emailRecipients: JSON.stringify(["a@x.test", "b@x.test"]),
    ...overrides,
  };
}

function results(overrides = {}) {
  return {
    scan: {
      status: "completed",
      url: "https://example.com",
      pagesScanned: 3,
      completedAt: "2026-10-26T12:00:00.000Z",
    },
    counts: { total: 2, critical: 0, high: 1, medium: 1, low: 0, informational: 0 },
    findings: [{ severity: "high", title: "Missing document language" }],
    ...overrides,
  };
}

describe("sendScheduleReportsForScan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.auditSchedule.findMany.mockResolvedValue([]);
    entitlements.hasEntitlement.mockResolvedValue(true);
    queries.getScanResultsDto.mockResolvedValue(results());
    queries.getScanRegression.mockResolvedValue(null);
    mail.sendScheduleReportEmail.mockResolvedValue(true);
  });

  it("sends nothing when no watch points at the scan", async () => {
    await expect(sendScheduleReportsForScan("scan-1")).resolves.toEqual({ sent: 0 });
    expect(mail.sendScheduleReportEmail).not.toHaveBeenCalled();
  });

  it("emails the recipients of a Pro watch and reports the count", async () => {
    db.auditSchedule.findMany.mockResolvedValue([schedule()]);

    await expect(sendScheduleReportsForScan("scan-1")).resolves.toEqual({ sent: 1 });
    expect(mail.sendScheduleReportEmail).toHaveBeenCalledTimes(1);
    const call = mail.sendScheduleReportEmail.mock.calls[0][0];
    expect(call.to).toEqual(["a@x.test", "b@x.test"]);
    expect(call.summary.reportUrl).toContain("/audit/scan-1");
    expect(call.summary.newSinceLast).toBeNull();
  });

  it("carries the regression when a previous run exists", async () => {
    db.auditSchedule.findMany.mockResolvedValue([schedule()]);
    queries.getScanRegression.mockResolvedValue({
      diff: { addedTotal: 2, fixedTotal: 3 },
    });

    await sendScheduleReportsForScan("scan-1");
    const call = mail.sendScheduleReportEmail.mock.calls[0][0];
    expect(call.summary.newSinceLast).toBe(2);
    expect(call.summary.fixedSinceLast).toBe(3);
  });

  it("skips silent watches and lapsed owners", async () => {
    db.auditSchedule.findMany.mockResolvedValue([
      schedule({ id: "silent", emailRecipients: JSON.stringify([]) }),
      schedule({ id: "lapsed" }),
    ]);
    // The lapsed owner keeps the watch but loses the email.
    entitlements.hasEntitlement.mockResolvedValue(false);

    await expect(sendScheduleReportsForScan("scan-1")).resolves.toEqual({ sent: 0 });
    expect(mail.sendScheduleReportEmail).not.toHaveBeenCalled();
  });

  it("skips scans with no readable report", async () => {
    db.auditSchedule.findMany.mockResolvedValue([schedule()]);
    queries.getScanResultsDto.mockResolvedValue(null);

    await expect(sendScheduleReportsForScan("scan-1")).resolves.toEqual({ sent: 0 });
    expect(mail.sendScheduleReportEmail).not.toHaveBeenCalled();
  });

  it("never throws — a mail failure reads as unsent, not as a failed scan", async () => {
    db.auditSchedule.findMany.mockResolvedValue([schedule()]);
    mail.sendScheduleReportEmail.mockRejectedValue(new Error("resend down"));

    await expect(sendScheduleReportsForScan("scan-1")).resolves.toEqual({ sent: 0 });
  });

  it("survives a database failure the same way", async () => {
    db.auditSchedule.findMany.mockRejectedValue(new Error("db down"));

    await expect(sendScheduleReportsForScan("scan-1")).resolves.toEqual({ sent: 0 });
  });
});
