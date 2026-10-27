"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  SCAN_STAGES,
  formatQueueWait,
  isReportReady,
  isTerminalStatus,
  scanQueueState,
  type ScanStageId,
  type ScanStatusId,
} from "@/lib/audit/types";
import { track } from "@/lib/analytics";
import { useQueueClock } from "./use-queue-clock";

export interface ScanProgressStatus {
  id: string;
  status: string;
  stage?: string;
  /** The URL being audited, shown in the bay while the scan runs. */
  normalizedUrl?: string;
  pagesScanned: number;
  pagesTotal: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

function stageIndex(stage: string | undefined): number {
  const index = SCAN_STAGES.findIndex((candidate) => candidate.id === stage);
  // Before any stage is recorded, the scan is at the first one — that is what
  // "queued then claimed" looks like from outside, and pretending otherwise
  // would be the fake progress this panel exists to avoid.
  return index === -1 ? 0 : index;
}

/** Host for headings: the real hostname, or an honest placeholder. */
function bayHost(status: ScanProgressStatus): string {
  const raw = status.normalizedUrl;
  if (!raw) return "your-website.example";
  try {
    return new URL(raw).host;
  } catch {
    return raw;
  }
}

/**
 * The bay's address bar: host plus path, the way a real browser shows it, so
 * a multi-page crawl's current page is visible where a URL belongs. Falls back
 * to the bare host when the path is only "/".
 */
function bayAddress(status: ScanProgressStatus): string {
  const raw = status.normalizedUrl;
  if (!raw) return "your-website.example";
  try {
    const url = new URL(raw);
    return url.pathname === "/" ? url.host : `${url.host}${url.pathname}`;
  } catch {
    return raw;
  }
}

/**
 * The scanner bay: a stylised browser window the real stages light up inside.
 *
 * All of its state is real — the address bar carries the URL the scan is
 * actually auditing, the checklist highlights the stage the worker actually
 * reported, and the page counter counts real pages. The sweep animation says
 * "work is happening" without claiming a percentage the system does not have,
 * which is the one thing this panel must never do.
 *
 * Pure markup so the view stays assertable without a DOM; the motion lives in
 * CSS and switches off with `prefers-reduced-motion`, like the ribbon on the
 * home page.
 */
export function ScannerBay({
  status,
  active,
}: {
  status: ScanProgressStatus;
  /** Queued scans show the bay at rest: nothing is being fetched yet. */
  active: boolean;
}) {
  const current = stageIndex(status.stage);
  const multiPage = status.pagesTotal > 1;

  return (
    <div className="overflow-hidden rounded-t-xl border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Window chrome — decoration; the address below carries the same URL
          as real text for readers and copy-paste. */}
      <div
        aria-hidden
        className="flex items-center gap-2 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <span className="ml-2 truncate rounded-md bg-white px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          {bayAddress(status)}
        </span>
      </div>

      {/* The page under the scanner — skeleton and sweep are decoration; the
          stage rail below them is the real pipeline and stays readable. */}
      <div className="scanner-stage relative space-y-2.5 px-5 py-4">
        <div aria-hidden>
          <div className="h-2.5 w-1/3 rounded bg-zinc-300/70 dark:bg-zinc-700/70" />
          <div className="h-2 w-2/3 rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
          <div className="flex gap-2.5 pt-1">
            <div className="h-12 w-1/3 rounded-md bg-zinc-300/60 dark:bg-zinc-700/60" />
            <div className="flex-1 space-y-2">
              <div className="h-2 w-full rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
              <div className="h-2 w-5/6 rounded bg-zinc-300/40 dark:bg-zinc-700/40" />
              <div className="h-2 w-2/3 rounded bg-zinc-300/40 dark:bg-zinc-700/40" />
            </div>
          </div>
          {/* Three swatches: the colour work this scanner actually does */}
          <div className="flex gap-1.5 pt-1">
            <span className="h-4 w-4 rounded-sm bg-zinc-400/70 dark:bg-zinc-600/70" />
            <span className="h-4 w-4 rounded-sm bg-zinc-400/50 dark:bg-zinc-600/50" />
            <span className="h-4 w-4 rounded-sm bg-zinc-400/40 dark:bg-zinc-600/40" />
          </div>
          {/* The sweep: a fetch line crossing the page while a stage is live */}
          {active ? <div className="scanner-sweep" /> : null}
        </div>

        {/* Stage rail — the real pipeline, straight from the worker's own
            stage field. Visible text for the state, so the progress a sighted
            reader watches is progress a screen reader announces. */}
        <ol className="relative z-10 mt-3 space-y-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          {SCAN_STAGES.map((stage, index) => {
            const complete = active && index < current;
            const inProgress = active && index === current;
            return (
              <li
                key={stage.id}
                className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider transition-colors duration-300 ${
                  inProgress
                    ? "text-zinc-900 dark:text-zinc-100"
                    : complete
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                <span className="w-4 text-right">
                  {complete ? "✓" : inProgress ? "▸" : index + 1}
                </span>
                {stage.label}
                {inProgress ? (
                  <span className="flex items-center gap-1.5">
                    <span className="scanner-stage-dot h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    <span className="normal-case tracking-normal text-zinc-500 dark:text-zinc-400">
                      in progress
                    </span>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* Real page progress once more than one page is in flight */}
        {multiPage ? (
          <p className="relative z-10 pt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Page {Math.min(status.pagesScanned + (active ? 1 : 0), status.pagesTotal)} of{" "}
            {status.pagesTotal} · {status.pagesScanned} done
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * What the reader sees while a scan is not finished.
 *
 * Split from the polling below so its text can be asserted without a DOM: the
 * states it can be in are the point of it, and one of them — waiting for a
 * scanner — exists precisely because staying silent about it was misleading.
 * `now` is a parameter rather than a call to the clock for the same reason the
 * polling keeps the clock out of render.
 *
 * A queued scan is not always picked up the moment it is created. Past the
 * notice window this says the audit has not started, so a reader can decide to
 * wait or come back; a checklist sitting on "Validating URL" cannot tell the
 * difference between slow and never.
 */
export function ScanProgressView({
  status,
  now,
}: {
  status: ScanProgressStatus;
  now: number;
}) {
  const statusId = status.status as ScanStatusId;
  // "Not pending" rather than "awaiting_scanner": `scanQueueState` is pending for
  // every status except a queued scan past the notice window, so this covers the
  // abandoned window too. The server closes a scan that far gone on the next
  // poll, but until that answer arrives the honest thing to show is the wait —
  // not a checklist implying progress nobody is making.
  const awaitingScanner = scanQueueState(statusId, status.createdAt, now) !== "pending";
  const failed = statusId === "failed";
  const running = statusId === "running";
  // Only read while the panel that shows it is up: `awaiting_scanner` is
  // unreachable until `now` is a real time, so the parse cannot be NaN here.
  const waitedMs = awaitingScanner ? Math.max(0, now - Date.parse(status.createdAt)) : 0;
  const elapsedMs =
    running && status.startedAt ? Math.max(0, now - Date.parse(status.startedAt)) : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <ScannerBay status={status} active={!awaitingScanner && !failed} />

      <div className="p-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {awaitingScanner
            ? "Waiting for a scanner"
            : failed
              ? "This audit could not run"
              : `Auditing ${bayHost(status)}`}
        </h1>

        {awaitingScanner ? (
          <>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Your audit is queued and starts as soon as a scanner is free. Only a couple of audits
              run at the same time, so a short wait is normal while others are in flight.
            </p>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Queued for {formatQueueWait(waitedMs)}. This page keeps checking, so it will move on its
              own — you can leave it open.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Pages scanned: {status.pagesScanned} / {status.pagesTotal || "?"}
              {running && elapsedMs > 0 ? ` · running for ${formatQueueWait(elapsedMs)}` : ""}
            </p>
            {status.errorMessage ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{status.errorMessage}</p>
            ) : null}
            {isTerminalStatus(statusId) ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {failed
                  ? "Nothing was scanned. You can run the audit again."
                  : "This scan has finished without a report to show."}
              </p>
            ) : (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                This page updates itself; the report appears here as soon as the scan finishes.
              </p>
            )}
            {failed ? (
              <Link
                href="/audit"
                className="mt-4 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                Start a new audit
              </Link>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Live progress for a scan that has not finished.
 *
 * `refreshOnFinish` asks the server to re-render once the scan is ready, so the
 * page becomes the report without the reader having to reload. It deliberately
 * waits for a *report-ready* status rather than any terminal one: a failed scan
 * is terminal too, and refreshing on it would loop forever between the progress
 * view and itself.
 */
export function ScanProgress({
  scanId,
  refreshOnFinish = false,
}: {
  scanId: string;
  refreshOnFinish?: boolean;
}) {
  const [status, setStatus] = useState<ScanProgressStatus | null>(null);
  const [error, setError] = useState("");
  const refreshed = useRef(false);
  // The funnel's "completed report" step: fired once, when the poll first
  // sees a report-ready terminal status. Kept separate from `refreshed` so
  // the event fires even where the page does not auto-refresh into the report.
  const completed = useRef(false);
  const router = useRouter();
  const now = useQueueClock();

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/audit/scan/${scanId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = (await res.json()) as ScanProgressStatus;
        if (cancelled) return;
        setStatus(data);
        setError("");

        const statusId = data.status as ScanStatusId;
        if (isTerminalStatus(statusId)) {
          // Nothing left to poll for: a terminal scan never changes again.
          window.clearInterval(interval);
          if (isReportReady(statusId) && !completed.current) {
            completed.current = true;
            track("audit_completed", { scanId });
          }
          if (refreshOnFinish && isReportReady(statusId) && !refreshed.current) {
            refreshed.current = true;
            router.refresh();
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      }
    };

    void fetchStatus();
    // `const`, and declared here rather than above: the first call above cannot
    // observe it until its fetch resolves, long after this line has run.
    const interval = window.setInterval(fetchStatus, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [scanId, refreshOnFinish, router]);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!status) {
    return (
      <div className="animate-pulse rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">Loading...</div>
    );
  }

  return <ScanProgressView status={status} now={now} />;
}

/** Re-exported so the form's own progress panel can share the stage ids. */
export type { ScanStageId };
