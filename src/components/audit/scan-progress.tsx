"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  formatQueueWait,
  isReportReady,
  isTerminalStatus,
  scanQueueState,
  type ScanStatusId,
} from "@/lib/audit/types";
import { useQueueClock } from "./use-queue-clock";

export interface ScanProgressStatus {
  id: string;
  status: string;
  stage?: string;
  pagesScanned: number;
  pagesTotal: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
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
  // Only read while the panel that shows it is up: `awaiting_scanner` is
  // unreachable until `now` is a real time, so the parse cannot be NaN here.
  const waitedMs = awaitingScanner ? Math.max(0, now - Date.parse(status.createdAt)) : 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {awaitingScanner
          ? "Waiting for a scanner"
          : failed
            ? "This audit could not run"
            : `Scan Status: ${status.status}`}
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
