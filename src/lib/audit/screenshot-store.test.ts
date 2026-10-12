import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  deleteScreenshotsFor,
  isSafeId,
  readScreenshot,
  saveScreenshot,
  screenshotDir,
  screenshotFileName,
} from "./screenshot-store";

/** A real 1x1 PNG, so the bytes written are a valid image and not just noise. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const SCAN_A = "cmv4btsls0000sgvwh8fj79vm";
const SCAN_B = "cmv4btsls0000sgvwh8fj79vn";
const PAGE_1 = "cmv4btsut0001sgvwgnvyanmp";
const PAGE_2 = "cmv4btsut0001sgvwgnvyanmq";
const PAGE_3 = "cmv4btsut0001sgvwgnvyanmr";

let dir: string;

async function withScreenshotDir<T>(target: string, run: () => Promise<T>): Promise<T> {
  const previous = process.env.AUDIT_SCREENSHOT_DIR;
  process.env.AUDIT_SCREENSHOT_DIR = target;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.AUDIT_SCREENSHOT_DIR;
    else process.env.AUDIT_SCREENSHOT_DIR = previous;
  }
}

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "chromabrew-screenshots-"));
  process.env.AUDIT_SCREENSHOT_DIR = dir;
});

afterAll(async () => {
  delete process.env.AUDIT_SCREENSHOT_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe("screenshotDir", () => {
  it("uses the configured directory", () => {
    expect(screenshotDir()).toBe(dir);
  });

  it("falls back to a directory inside the project when unset", async () => {
    await withScreenshotDir("", async () => {
      expect(screenshotDir()).toBe(path.join(process.cwd(), ".audit-screenshots"));
    });
  });
});

describe("isSafeId", () => {
  it("accepts the ids Prisma generates", () => {
    expect(isSafeId(SCAN_A)).toBe(true);
    expect(isSafeId(PAGE_1)).toBe(true);
  });

  it("rejects anything that is not a cuid-like id", () => {
    for (const value of ["", "short", "has space", "has/slash", "../evil", "a".repeat(41), "abc.png"]) {
      expect(isSafeId(value), `${value} should be rejected`).toBe(false);
    }
  });
});

describe("screenshotFileName", () => {
  it("builds a bare filename from two ids", () => {
    const name = screenshotFileName(SCAN_A, PAGE_1);
    expect(name).toBe(`${SCAN_A}-${PAGE_1}.png`);
    expect(name).not.toContain("/");
    expect(name).not.toContain("..");
  });

  it("throws rather than sanitising an unsafe id", () => {
    expect(() => screenshotFileName("../evil", PAGE_1)).toThrow();
    expect(() => screenshotFileName(SCAN_A, "../../etc/passwd")).toThrow();
    expect(() => screenshotFileName("", PAGE_1)).toThrow();
  });
});

describe("saveScreenshot / readScreenshot", () => {
  it("round-trips a PNG byte for byte", async () => {
    const stored = await saveScreenshot(SCAN_A, PAGE_1, PNG);
    expect(stored).toBe(screenshotFileName(SCAN_A, PAGE_1));

    const bytes = await readScreenshot(stored);
    expect(bytes).not.toBeNull();
    expect(bytes?.equals(PNG)).toBe(true);
  });

  it("writes the file inside the storage directory", async () => {
    await saveScreenshot(SCAN_A, PAGE_2, PNG);
    const entries = await readdir(dir);
    expect(entries).toContain(screenshotFileName(SCAN_A, PAGE_2));
  });

  it("round-trips a short, truncated buffer without changing it", async () => {
    const truncated = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const stored = await saveScreenshot(SCAN_A, PAGE_3, truncated);
    expect((await readScreenshot(stored))?.equals(truncated)).toBe(true);
  });

  it("creates the storage directory on demand", async () => {
    const nested = path.join(dir, "nested", "deeper");
    await withScreenshotDir(nested, async () => {
      const stored = await saveScreenshot(SCAN_B, PAGE_1, PNG);
      const bytes = await readScreenshot(stored);
      expect(bytes?.equals(PNG)).toBe(true);
    });
  });

  it("returns null for a missing file", async () => {
    expect(await readScreenshot(screenshotFileName(SCAN_B, PAGE_2))).toBeNull();
  });

  it("refuses paths that could escape the directory", async () => {
    // A real file one level up: if any traversal check is missing, this is what
    // "../..." would reach.
    const sentinelName = `sentinel-${path.basename(dir)}.png`;
    const sentinelPath = path.join(dir, "..", sentinelName);
    await writeFile(sentinelPath, "do not read me");

    const hostile = [
      `../${sentinelName}`,
      sentinelPath,
      "a/b.png",
      "..\\x.png",
      "x\u0000.png",
      "..",
      "",
      "./x.png",
    ];
    for (const candidate of hostile) {
      expect(await readScreenshot(candidate), `${JSON.stringify(candidate)} must not be read`).toBeNull();
    }

    // The sentinel is untouched and still outside the storage directory.
    expect(await readFile(sentinelPath, "utf8")).toBe("do not read me");

    await rm(sentinelPath, { force: true });
  });
});

describe("deleteScreenshotsFor", () => {
  it("removes only the requested scan's files", async () => {
    const kept = await saveScreenshot(SCAN_B, PAGE_3, PNG);
    expect(await deleteScreenshotsFor(SCAN_A)).toBeGreaterThanOrEqual(3);

    const entries = await readdir(dir);
    expect(entries).toContain(kept);
    expect(entries.some((name) => name.startsWith(`${SCAN_A}-`))).toBe(false);

    // The surviving scan's screenshot is still readable.
    expect((await readScreenshot(kept))?.equals(PNG)).toBe(true);
  });

  it("returns zero when nothing matches", async () => {
    expect(await deleteScreenshotsFor("abcdefghijklmnopqrst")).toBe(0);
  });

  it("throws for an unsafe scan id instead of scanning the directory", async () => {
    await expect(deleteScreenshotsFor("../evil")).rejects.toThrow();
  });
});
