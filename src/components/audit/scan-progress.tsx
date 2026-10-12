"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { isReportReady, isTerminalStatus, type ScanStatusId } from "@/lib/audit/types";

interface ScanStatus {
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
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [error, setError] = useState("");
  const refreshed = useRef(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/audit/scan/${scanId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch status");
        const data = (await res.json()) as ScanStatus;
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
    interval = window.setInterval(fetchStatus, 2000);

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

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Scan Status: {status.status}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Pages scanned: {status.pagesScanned} / {status.pagesTotal || "?"}
      </p>
      {status.errorMessage && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{status.errorMessage}</p>
      )}
      {isTerminalStatus(status.status as ScanStatusId) ? (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          This scan has finished without a report to show.
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          This page updates itself; the report appears here as soon as the scan finishes.
        </p>
      )}
    </div>
  );
}
