import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/design-system/colour/contrast";
import {
  MIN_CRAWLER_VERSION,
  NO_SCANNER,
  PROPOSED_FIX_KEY,
  SAMPLE_TEXT_MAX_LENGTH,
  SCANNER_OFFLINE_MESSAGE,
  SCAN_QUEUE_ABANDON_MS,
  SCAN_QUEUE_NOTICE_MS,
  WORKER_HEARTBEAT_MS,
  WORKER_HEARTBEAT_STALE_MS,
  formatQueueWait,
  parseProposedFix,
  scanQueueState,
  scannerAvailability,
  scannerCanCrawl,
  type ProposedFixData,
} from "./types";

/**
 * A colour fix as it was written to the database, with the fields the badge
 * depends on left open so a test can dictate them.
 */
function storedFix(overrides: Partial<ProposedFixData> = {}): ProposedFixData {
  return {
    kind: "contrast",
    summary: "Keep the background: the text colour becomes #595960.",
    changes: [{ property: "color", before: "#9f9fa9", after: "#595960" }],
    css: "p { color: #595960; }",
    tokens: [{ name: "--text-on-light", value: "#595960" }],
    validation: {
      rule: "WCAG 2.2 SC 1.4.3 Contrast (Minimum), Level AA — 4.5:1 for body text (16px, weight 400)",
      before: "2.62:1",
      after: "4.62:1",
      passed: true,
    },
    contrast: {
      foregroundBefore: "#9f9fa9",
      foregroundAfter: "#595960",
      background: "#ffffff",
      required: 4.5,
      ratioAfter: 4.62,
      fontSizePx: 16,
      fontWeight: 400,
      sampleText: "Buy now",
    },
    ...overrides,
  };
}

/** The one thing the report may call "Verified". */
function measuresAsVerified(fix: ProposedFixData): boolean {
  const pair = fix.contrast!;
  return contrastRatio(pair.foregroundAfter, pair.background) >= pair.required;
}

describe("parseProposedFix", () => {
  it("re-measures a stored pass and keeps it when the colours still clear the bar", () => {
    const fix = parseProposedFix(storedFix());
    expect(fix).not.toBeNull();
    expect(fix!.validation.passed).toBe(true);
    expect(measuresAsVerified(fix!)).toBe(true);
    // What the reader sees is the re-measurement, not the stored figure.
    const raw = contrastRatio("#595960", "#ffffff");
    expect(fix!.validation.after).toBe(`${Math.round(raw * 100) / 100}:1`);
    expect(fix!.contrast!.ratioAfter).toBe(Math.round(raw * 100) / 100);
  });

  it("refuses a stored pass whose colours do not clear the bar", () => {
    // A row written by an older engine, or edited: the swatches above the badge
    // would visibly fail while the badge claimed "Verified".
    const fix = parseProposedFix(
      storedFix({
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "#9f9fa9",
          background: "#ffffff",
          required: 4.5,
          ratioAfter: 4.62,
          fontSizePx: 16,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(fix!.validation.passed).toBe(false);
    expect(fix!.validation.after).toBe("2.62:1");
  });

  it("decides on the raw measurement, not the figure it displays", () => {
    // 2.99839679:1 against a 3:1 bar — a real failure that rounds to 3.00.
    const raw = contrastRatio("#16a34a", "#f4f4f5");
    expect(raw).toBeLessThan(3);
    expect(Math.round(raw * 100) / 100).toBe(3);

    const fix = parseProposedFix(
      storedFix({
        validation: { rule: "SC 1.4.3", before: "1.9:1", after: "3:1", passed: true },
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "#16a34a",
          background: "#f4f4f5",
          required: 3,
          ratioAfter: 3,
          fontSizePx: 26,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(fix!.validation.after).toBe("3:1");
    expect(fix!.validation.passed).toBe(false);
  });

  it("never calls a colour fix verified when its pair cannot be measured", () => {
    const unmeasurable = parseProposedFix(
      storedFix({
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "currentColor",
          background: "#ffffff",
          required: 4.5,
          ratioAfter: 4.62,
          fontSizePx: 16,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(unmeasurable!.validation.passed).toBe(false);

    const missingPair = parseProposedFix(storedFix({ contrast: null }));
    expect(missingPair!.validation.passed).toBe(false);

    const missingBar = parseProposedFix(
      storedFix({
        contrast: {
          foregroundBefore: "#9f9fa9",
          foregroundAfter: "#595960",
          background: "#ffffff",
          required: Number.NaN,
          ratioAfter: 4.62,
          fontSizePx: 16,
          fontWeight: 400,
          sampleText: null,
        },
      }),
    );
    expect(missingBar!.validation.passed).toBe(false);
  });

  it("leaves a text-length fix alone, since it makes no colour claim", () => {
    const fix = parseProposedFix(
      storedFix({
        kind: "text_length",
        contrast: null,
        changes: [{ property: "description", before: "long", after: "short" }],
        validation: { rule: "120-155 characters", before: "210", after: "150", passed: true },
      }),
    );
    expect(fix!.validation.passed).toBe(true);
    expect(fix!.validation.after).toBe("150");
  });

  it("still rejects JSON that is not a fix at all", () => {
    expect(parseProposedFix(null)).toBeNull();
    expect(parseProposedFix(undefined)).toBeNull();
    expect(parseProposedFix("fix")).toBeNull();
    expect(parseProposedFix([])).toBeNull();
    expect(parseProposedFix({})).toBeNull();
    expect(parseProposedFix(storedFix({ kind: "other" as never }))).toBeNull();
    expect(parseProposedFix(storedFix({ changes: [] }))).toBeNull();
    expect(parseProposedFix(storedFix({ validation: undefined as never }))).toBeNull();
  });

  it("satisfies the label's contract over the whole stored-value space", () => {
    const forwards = ["#9f9fa9", "#595960", "#16a34a", "#16a34a", "#777777", "#000000"];
    const backgrounds = ["#ffffff", "#f4f4f5", "#18181b", "#000000"];
    const bars = [3, 4.5, 7];

    for (const foregroundAfter of forwards) {
      for (const background of backgrounds) {
        for (const required of bars) {
          // Whatever the stored flag said — including a flat lie — the parsed
          // fix must be labelled verified only when it measures as verified.
          for (const storedPassed of [true, false]) {
            const fix = parseProposedFix(
              storedFix({
                validation: { rule: "SC 1.4.3", before: "1:1", after: "9:1", passed: storedPassed },
                contrast: {
                  foregroundBefore: "#9f9fa9",
                  foregroundAfter,
                  background,
                  required,
                  ratioAfter: 9,
                  fontSizePx: 16,
                  fontWeight: 400,
                  sampleText: null,
                },
              }),
            );
            expect(fix).not.toBeNull();
            expect(fix!.validation.passed, `${foregroundAfter} on ${background} vs ${required}:1`).toBe(
              measuresAsVerified(fix!),
            );
          }
        }
      }
    }
  });

  it("keeps the element's own text across the boundary, cleaned and capped", () => {
    // The report draws the fix on these words, so they must survive storage —
    // and a snippet of a scanned page must not arrive unbounded or as a number.
    expect(parseProposedFix(storedFix())?.contrast?.sampleText).toBe("Buy now");

    const withPair = (sampleText: unknown) =>
      parseProposedFix(
        storedFix({ contrast: { ...storedFix().contrast!, sampleText: sampleText as string } }),
      )?.contrast?.sampleText;

    expect(withPair("  Save\n\t20%  ")).toBe("Save 20%");
    expect(withPair("   ")).toBeNull();
    expect(withPair(undefined)).toBeNull();
    expect(withPair(42)).toBeNull();
    expect(withPair("x".repeat(400))).toHaveLength(SAMPLE_TEXT_MAX_LENGTH);
  });

  it("reads a fix out of the key the writer stores it under", () => {
    expect(PROPOSED_FIX_KEY).toBe("fix");
  });
});

/**
 * The queue clock.
 *
 * This one function decides three things at once: whether a progress view may
 * say "in progress", whether it must say "waiting for a scanner", and — through
 * `runner.ts` — whether a row is old enough to close. A boundary that drifts
 * here shows up as either a spinner that lies or a scan killed while a worker
 * was still about to claim it.
 */
describe("scanQueueState", () => {
  const createdAt = new Date(2026, 9, 13, 12, 0, 0);
  const at = (offsetMs: number) => createdAt.getTime() + offsetMs;

  it("is pending for a scan that is not queued at all", () => {
    for (const status of ["running", "completed", "partially_completed", "failed", "cancelled"] as const) {
      expect(scanQueueState(status, createdAt, at(SCAN_QUEUE_ABANDON_MS * 2))).toBe("pending");
    }
  });

  it("is pending while a queued scan is still inside the notice window", () => {
    expect(scanQueueState("queued", createdAt, at(0))).toBe("pending");
    expect(scanQueueState("queued", createdAt, at(SCAN_QUEUE_NOTICE_MS - 1))).toBe("pending");
  });

  it("says it is waiting once a queued scan passes the notice window", () => {
    expect(scanQueueState("queued", createdAt, at(SCAN_QUEUE_NOTICE_MS))).toBe("awaiting_scanner");
    expect(scanQueueState("queued", createdAt, at(SCAN_QUEUE_ABANDON_MS - 1))).toBe(
      "awaiting_scanner",
    );
  });

  it("is abandoned at the window the runner closes rows in", () => {
    expect(scanQueueState("queued", createdAt, at(SCAN_QUEUE_ABANDON_MS))).toBe("abandoned");
    // A clock far ahead of the row's: still abandoned, never a negative wait.
    expect(scanQueueState("queued", createdAt, at(SCAN_QUEUE_ABANDON_MS * 10))).toBe("abandoned");
  });

  it("accepts the wire form of the timestamp as well as a Date", () => {
    expect(scanQueueState("queued", createdAt.toISOString(), at(SCAN_QUEUE_NOTICE_MS))).toBe(
      "awaiting_scanner",
    );
  });

  it("treats an unreadable timestamp as pending", () => {
    // An unreadable clock is not evidence that a scan was abandoned, and the
    // alternative — guessing — would either kill live scans or reveal nothing.
    expect(scanQueueState("queued", "not a date", at(SCAN_QUEUE_ABANDON_MS * 10))).toBe("pending");
    expect(scanQueueState("queued", "", at(SCAN_QUEUE_ABANDON_MS * 10))).toBe("pending");
  });

  it("notices the queue before it gives up on it", () => {
    // The interface is supposed to have something honest to say for a while
    // before the row is closed underneath the reader.
    expect(SCAN_QUEUE_NOTICE_MS).toBeLessThan(SCAN_QUEUE_ABANDON_MS);
  });
});

describe("formatQueueWait", () => {
  it("reads as seconds under a minute and minutes above it", () => {
    expect(formatQueueWait(0)).toBe("0s");
    expect(formatQueueWait(8_400)).toBe("8s");
    expect(formatQueueWait(59_600)).toBe("1m 00s");
    expect(formatQueueWait(65_000)).toBe("1m 05s");
    expect(formatQueueWait(600_000)).toBe("10m 00s");
  });

  it("never renders a negative wait from a clock that ran backwards", () => {
    expect(formatQueueWait(-5_000)).toBe("0s");
  });
});

/**
 * The scanner's liveness clock.
 *
 * This decides whether the audit form offers itself at all, so both ways of
 * being wrong are expensive: believing a stale beat puts a reader back in front
 * of a queued audit nothing will claim, and disbelieving a live one turns away a
 * working scanner. It is also the only place a missing beat is distinguished
 * from an old one, which is what lets the form say "has never checked in"
 * instead of inventing a duration.
 */
describe("scannerAvailability", () => {
  const beat = new Date(2026, 9, 13, 12, 0, 0);
  const at = (offsetMs: number) => beat.getTime() + offsetMs;

  it("is online while the newest beat is inside the stale window", () => {
    expect(scannerAvailability(beat, "vps-1", at(0)).online).toBe(true);
    expect(scannerAvailability(beat, "vps-1", at(WORKER_HEARTBEAT_STALE_MS - 1)).online).toBe(true);
  });

  it("is offline exactly at the stale window, so the boundary belongs to neither guess", () => {
    const graded = scannerAvailability(beat, "vps-1", at(WORKER_HEARTBEAT_STALE_MS));
    expect(graded.online).toBe(false);
    // The beat is still reported: the form says how long the scanner has been
    // quiet, which is the difference between a worker that died and one that was
    // never started.
    expect(graded.lastSeenAt).toBe(beat.toISOString());
    expect(graded.ageMs).toBe(WORKER_HEARTBEAT_STALE_MS);
    expect(graded.workerId).toBe("vps-1");
  });

  it("is offline for a beat far in the past", () => {
    expect(scannerAvailability(beat, "vps-1", at(WORKER_HEARTBEAT_STALE_MS * 100)).online).toBe(
      false,
    );
  });

  it("reports no scanner at all when there is no beat", () => {
    expect(scannerAvailability(null, null, at(0))).toEqual(NO_SCANNER);
    expect(scannerAvailability(undefined, null, at(0))).toEqual(NO_SCANNER);
    // "Never ran" is not a duration, and the form is told so rather than being
    // handed an age it would have to invent.
    expect(NO_SCANNER.lastSeenAt).toBeNull();
    expect(NO_SCANNER.ageMs).toBeNull();
  });

  it("accepts the wire form of the beat as well as a Date", () => {
    expect(scannerAvailability(beat.toISOString(), "vps-1", at(5_000)).online).toBe(true);
  });

  it("treats an unreadable beat as offline, the opposite of the queue's guess", () => {
    // Deliberately not the same choice `scanQueueState` makes. There, guessing
    // "abandoned" would close a scan that might be fine; here, guessing "online"
    // would accept one that cannot be run — and an unreadable clock is no
    // evidence that a scanner exists.
    expect(scannerAvailability("not a date", "vps-1", at(0)).online).toBe(false);
    expect(scannerAvailability("", "vps-1", at(0)).online).toBe(false);
  });

  it("notices a stopped scanner long before the queue gives up on a scan", () => {
    // The two windows are unrelated in code but not in consequence: the whole
    // point of the beat is to answer before a reader has waited out
    // SCAN_QUEUE_ABANDON_MS for an audit nobody was coming for.
    expect(WORKER_HEARTBEAT_STALE_MS).toBeLessThan(SCAN_QUEUE_ABANDON_MS);
    // Four beats of slack, so one lost write is not read as a dead host.
    expect(WORKER_HEARTBEAT_STALE_MS).toBeGreaterThan(WORKER_HEARTBEAT_MS * 2);
  });

  it("offers the reader a message that promises nothing was queued", () => {
    // The fear this answers is not "I cannot scan" but "did I just queue an
    // audit that will fail in ten minutes", so the message has to say.
    expect(SCANNER_OFFLINE_MESSAGE).toMatch(/offline/);
    expect(SCANNER_OFFLINE_MESSAGE).toMatch(/[Nn]othing was queued/);
  });

  it("carries the worker's own version, so capability is a fact not a guess", () => {
    // The crawl gate reads this: a worker is crawl-capable because it said so
    // in its beat, not because enough time has passed since the deploy.
    expect(scannerAvailability(beat, "vps-1", at(0), "3.0.0").version).toBe("3.0.0");
    expect(scannerAvailability(beat, "vps-1", at(0)).version).toBeNull();
    expect(NO_SCANNER.version).toBeNull();
  });
});

describe("scannerCanCrawl", () => {
  it("accepts the version that introduced crawling and anything newer", () => {
    expect(scannerCanCrawl(MIN_CRAWLER_VERSION)).toBe(true);
    expect(scannerCanCrawl("3.1.0")).toBe(true);
    expect(scannerCanCrawl("4.0.0")).toBe(true);
  });

  it("refuses workers that predate it or never said what they are", () => {
    // A worker running old code would accept a five-page scope and silently
    // scan one page; an unversioned worker's capabilities cannot be confirmed
    // at all. Both are refusals, and the form offers single-page instead.
    expect(scannerCanCrawl("2.1.0")).toBe(false);
    expect(scannerCanCrawl("2.99.0")).toBe(false);
    expect(scannerCanCrawl(null)).toBe(false);
    expect(scannerCanCrawl("")).toBe(false);
    expect(scannerCanCrawl("not-a-version")).toBe(false);
  });
});
