#!/usr/bin/env node
/**
 * ChromaBrew audit worker — the process that renders untrusted pages.
 *
 * It runs outside Next.js on purpose. It is the only process in the deployment
 * that executes a stranger's JavaScript, it needs a real browser and a
 * persistent filesystem for screenshots, and it must outlive a single request.
 * See `docs/AUDIT_WORKER_HOST.md` for why it cannot run inside the Vercel app.
 *
 *   node --import tsx scripts/audit-worker.mjs
 *
 * Environment: `DATABASE_URL` (required), `AUDIT_SCREENSHOT_DIR` (optional),
 * `AUDIT_WORKER_ID` (optional, for hosts running more than one worker),
 * `NODE_ENV`. Values are read from the process environment first, then from
 * `.env.local` / `.env` in the repository root.
 *
 * The scan lifecycle itself (claiming, terminal statuses, stale-run recovery,
 * SSRF policing, the fetch fallback) lives in `src/lib/audit/`; this file is
 * only the loop, the startup checks, the heartbeat and the shutdown.
 *
 * It also announces itself (see `src/lib/audit/heartbeat.ts`). The web tier
 * reads that beat before it accepts an audit, so the beat is written only after
 * every startup check has passed: a worker that cannot render, cannot claim or
 * cannot write screenshots must not tell the form it is available.
 *
 * TypeScript entrypoints: the analysis modules are TypeScript and use the `@/`
 * path alias from tsconfig.json, which Node cannot resolve on its own, so the
 * `tsx` loader is named on the command line. It must be installed
 * (`npm ci --include=dev`) *and* imported, because tsx 4.7+ refuses
 * `module.register("tsx/esm")` with "tsx must be loaded with --import instead
 * of --loader". Nothing is registered in-process on purpose: a half-working
 * registration would surface much later as a confusing module error instead of
 * as one clear line at startup.
 */

import { access, mkdir, readFile } from "node:fs/promises";
import { constants as FS } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Idle polling: start quick, back off to a ceiling, reset after real work. */
const IDLE_MIN_MS = 1_000;
const IDLE_MAX_MS = 15_000;
const IDLE_FACTOR = 1.5;
/**
 * How often an idle worker says so in the log, so a quiet one is never a mystery.
 *
 * Distinct from the heartbeat row the web tier reads: this is a line for a
 * person reading a service log, and it is deliberately the slower of the two.
 */
const IDLE_NOTICE_MS = 60_000;
/** Minimum Node for `node --import`, which loads the TypeScript resolver. */
const MIN_NODE = [20, 6];

let stopping = false;
let wake = () => {};
const signalled = new Promise((resolve) => {
  wake = resolve;
});

const startedAt = Date.now();

function stamp() {
  return new Date().toISOString();
}

function log(message) {
  process.stdout.write(`${stamp()} audit-worker ${message}\n`);
}

function fail(message) {
  process.stderr.write(`${stamp()} audit-worker ERROR ${message}\n`);
}

/** One short line, never a stack trace: this output goes to a service log. */
function short(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").trim().slice(0, 200) || "unknown error";
}

function formatMs(ms) {
  return ms < 1_000 ? `${ms}ms` : `${(ms / 1_000).toFixed(1)}s`;
}

async function sleep(ms) {
  await Promise.race([new Promise((resolve) => setTimeout(resolve, ms)), signalled]);
}

/** Fill missing variables from the repo's env files. Never overwrite the process env. */
async function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    let text;
    try {
      text = await readFile(path.join(ROOT, file), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      // The trailing `\r` of a CRLF file has to go first: `.` does not match it,
      // so `$` cannot sit before it and *every* line of an `.env` written on
      // Windows is skipped in silence — the worker then exits claiming
      // DATABASE_URL is missing while the file plainly contains it.
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line.replace(/\r$/, ""));
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key] !== undefined) continue;
      let value = raw.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (value.length > 0) process.env[key] = value;
    }
  }
}

/**
 * Load the analysis modules.
 *
 * They are imported through the `tsx` loader rather than being compiled ahead
 * of time, because the repository has no bundler entrypoint for a standalone
 * Node process and the modules import through the `@/` alias.
 *
 * Every failure here is reported as one clear line: a loader that is missing,
 * or a module that will not load, stops the worker before it claims anything.
 */
async function loadModules() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < MIN_NODE[0] || (major === MIN_NODE[0] && minor < MIN_NODE[1])) {
    fail(
      `Node ${process.versions.node} is too old: this worker needs ${MIN_NODE.join(".")}+ to load TypeScript modules.`,
    );
    return null;
  }

  // Not named `module`: that shadows the CommonJS binding the rule set warns
  // about, and a bare `module(...)` call reads like the Node built-in.
  const loadModule = (relative) => import(pathToFileURL(path.join(ROOT, relative)).href);

  try {
    const runner = await loadModule("src/lib/audit/runner.ts");
    const browser = await loadModule("src/lib/audit/browser.ts");
    const queries = await loadModule("src/lib/audit/queries.ts");
    const screenshots = await loadModule("src/lib/audit/screenshot-store.ts");
    const heartbeat = await loadModule("src/lib/audit/heartbeat.ts");
    const types = await loadModule("src/lib/audit/types.ts");
    return {
      claimNextScan: runner.claimNextScan,
      runClaimedScan: runner.runClaimedScan,
      backfillScreenshotBytes: runner.backfillScreenshotBytes,
      isBrowserRendererAvailable: browser.isBrowserRendererAvailable,
      getScanStatusDto: queries.getScanStatusDto,
      screenshotDir: screenshots.screenshotDir,
      recordWorkerHeartbeat: heartbeat.recordWorkerHeartbeat,
      retireWorkerHeartbeat: heartbeat.retireWorkerHeartbeat,
      // Taken from the module the worker and the web tier share, so the interval
      // the worker beats at and the window the web tier grades it against are
      // read from one place and cannot drift apart.
      heartbeatMs: types.WORKER_HEARTBEAT_MS,
      scannerVersion: types.AUDIT_SCANNER_VERSION,
    };
  } catch (error) {
    fail(
      "the analysis modules could not be loaded; the usual cause is the TypeScript loader not being loaded. " +
        "Start the worker as `node --import tsx scripts/audit-worker.mjs`, with tsx installed via " +
        `npm ci --include=dev — ${short(error)}`,
    );
    return null;
  }
}

/**
 * Refuse to start in a state that would quietly produce worse reports.
 *
 * A worker without a browser still completes scans — through the fetch
 * pipeline — so every report it writes would be missing contrast, links, the
 * screenshot and axe-core. That is a configuration bug, not a degraded mode
 * worth running in.
 *
 * Nothing may announce this worker as available before these checks pass: the
 * heartbeat is a claim that audits can be run here, and a worker that cannot
 * render or cannot write a screenshot must not make it.
 */
async function checkEnvironment(modules) {
  if (!process.env.DATABASE_URL?.trim()) {
    fail("DATABASE_URL is not set. The worker cannot claim scans without it.");
    return false;
  }

  if (!(await modules.isBrowserRendererAvailable())) {
    fail(
      "no browser renderer is available, so every scan would silently fall back to the " +
        "fetch pipeline. Install Chromium on this host with: npx playwright install --with-deps chromium",
    );
    return false;
  }

  const directory = path.resolve(modules.screenshotDir());
  try {
    await mkdir(directory, { recursive: true });
    await access(directory, FS.W_OK);
  } catch (error) {
    fail(`the screenshot directory ${directory} is not writable: ${short(error)}`);
    return false;
  }

  log(
    `ready · node ${process.versions.node} · screenshots ${directory} · poll ${IDLE_MIN_MS}-${IDLE_MAX_MS}ms`,
  );
  return true;
}

/**
 * This worker's identity in the heartbeat table.
 *
 * The hostname by default, so that a restart rewrites its own row instead of
 * adding one per run: the table is a map of who is alive, not a log of who ever
 * was. A crash leaves the row behind and the restarted worker reclaims it. A
 * host running more than one worker gives each a distinct `AUDIT_WORKER_ID` —
 * without one they share a row, which still answers "a scanner is up" but hides
 * that only one of them is.
 */
function workerId() {
  return process.env.AUDIT_WORKER_ID?.trim() || os.hostname();
}

/**
 * Announce this worker while it runs, and return the way to take the
 * announcement back.
 *
 * On a timer of its own rather than as a step in the poll loop. The loop can
 * spend tens of seconds inside `runClaimedScan` rendering a stranger's page, and
 * a beat written only between polls would report exactly the workers that are
 * busy as gone — the ones a queued audit is waiting for.
 *
 * A failed write is logged and nothing else. The window the web tier grades
 * against is four beats wide, so one blip cannot change the answer, and a
 * database that has stopped accepting beats is one no scan can be claimed from
 * either — the loop's own errors report that at more useful speed.
 */
function installHeartbeat(modules) {
  const id = workerId();

  const beat = async () => {
    try {
      await modules.recordWorkerHeartbeat({
        workerId: id,
        startedAt: new Date(startedAt),
        version: modules.scannerVersion,
        host: os.hostname(),
      });
    } catch (error) {
      fail(`could not write the heartbeat: ${short(error)}`);
    }
  };

  // Announced before the first poll rather than after it: the point of the beat
  // is that a freshly started worker is usable immediately.
  void beat();
  const timer = setInterval(() => void beat(), modules.heartbeatMs);
  // A timer must never be a reason for the process to stay up. The poll loop
  // decides when this worker ends.
  timer.unref?.();

  return async () => {
    clearInterval(timer);
    try {
      await modules.retireWorkerHeartbeat(id);
    } catch (error) {
      // Not fatal, and not silent: an uncleared beat goes stale on its own
      // within the window, so the cost is a few minutes of a stale "online".
      fail(`could not clear the heartbeat: ${short(error)}`);
    }
  };
}

function installSignalHandlers() {
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      if (stopping) {
        // A second signal means "stop now"; the in-flight render is abandoned
        // and `recoverStaleScans` closes the scan on the next worker start.
        log(`${signal} again · exiting without waiting for the in-flight scan`);
        process.exit(0);
      }
      stopping = true;
      log(`${signal} received · finishing the in-flight scan, then exiting`);
      wake();
    });
  }

  // One broken scan must not take down the process that serves every other
  // scan; the runner has already written a terminal status for it by this point.
  process.on("unhandledRejection", (reason) => {
    fail(`unhandled rejection: ${short(reason)}`);
  });
}

async function main() {
  installSignalHandlers();
  await loadEnvFiles();

  const modules = await loadModules();
  if (!modules) {
    process.exit(1);
  }
  if (!(await checkEnvironment(modules))) {
    process.exit(1);
  }

  // Only now, and deliberately not earlier: everything above this line is what
  // makes a beat true. From here on the web tier will offer the form.
  const stopHeartbeat = installHeartbeat(modules);

  // Repair screenshots from older runs whose bytes never reached the database
  // (the web tier serves DB bytes, not this disk — see backfillScreenshotBytes).
  // Once per start, before the queue: bounded, and one missing file is skipped.
  try {
    const repaired = await modules.backfillScreenshotBytes();
    if (repaired > 0) {
      log(`backfilled screenshot bytes for ${repaired} earlier scan page(s)`);
    }
  } catch (error) {
    fail(`screenshot backfill failed (continuing): ${short(error)}`);
  }

  let idleMs = IDLE_MIN_MS;
  let lastIdleNotice = Date.now();

  while (!stopping) {
    let scanId = null;
    try {
      scanId = await modules.claimNextScan();
    } catch (error) {
      // A database blip must back off, not spin: claim failures are the one
      // error here that can repeat at full speed.
      fail(`could not read the queue: ${short(error)}`);
    }

    if (scanId) {
      idleMs = IDLE_MIN_MS;
      lastIdleNotice = Date.now();
      const scanStarted = Date.now();
      try {
        await modules.runClaimedScan(scanId);
        const status = await modules.getScanStatusDto(scanId).catch(() => null);
        log(
          `scan ${scanId} ${status?.status ?? "unknown"}${
            status?.renderMode ? ` (${status.renderMode})` : ""
          } in ${formatMs(Date.now() - scanStarted)}`,
        );
      } catch (error) {
        // The runner writes a terminal status on every failure path, so an
        // error escaping it means the record itself could not be updated.
        fail(`scan ${scanId} could not be processed: ${short(error)}`);
      }
      continue;
    }

    if (stopping) break;

    if (Date.now() - lastIdleNotice >= IDLE_NOTICE_MS) {
      log(`idle · queue empty · uptime ${formatMs(Date.now() - startedAt)}`);
      lastIdleNotice = Date.now();
    }

    await sleep(idleMs);
    idleMs = Math.min(IDLE_MAX_MS, Math.round(idleMs * IDLE_FACTOR));
  }

  // Before the final line, so a clean stop takes the announcement back at once
  // instead of leaving the form offering a scanner that has already gone.
  await stopHeartbeat();

  log("stopped");
  process.exit(0);
}

main().catch((error) => {
  fail(`the worker could not start: ${short(error)}`);
  process.exit(1);
});
