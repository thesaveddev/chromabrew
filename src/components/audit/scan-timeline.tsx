"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type {
  ScanHistoryEntryDto,
  ScanRegressionDto,
} from "@/lib/audit/queries";

/** Mirrors SCHEDULE_INTERVALS without importing the server module. */
const INTERVAL_OPTIONS = [
  { days: 1, label: "Daily" },
  { days: 7, label: "Weekly" },
] as const;

interface TimelineData {
  history: ScanHistoryEntryDto[];
  regression: ScanRegressionDto | null;
  schedules: ScheduleSummary[];
}

interface ScheduleSummary {
  id: string;
  intervalDays: number;
  active: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  lastScanId: string | null;
  failureCount: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The site's story around one scan: what changed, earlier runs, and the
 * watch that keeps it coming. Owner-only — the route 404s for anonymous
 * scans and other people's, and this section simply stays hidden then.
 * Anonymous readers never learn it exists.
 */
export function ScanTimeline({ scanId, siteUrl }: { scanId: string; siteUrl: string }) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [hidden, setHidden] = useState(false);
  const [intervalDays, setIntervalDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/audit/scan/${scanId}/timeline`, {
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 404) {
      setHidden(true);
      return;
    }
    if (!res.ok) return;
    setData((await res.json()) as TimelineData);
  }, [scanId]);

  useEffect(() => {
    void refresh();
    void fetch("/api/billing/plan", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (body?.plan === "pro") setPlan("pro");
      })
      .catch(() => {});
  }, [refresh]);

  if (hidden || !data) return null;

  const { history, regression, schedules } = data;
  const isPro = plan === "pro";

  const mutate = async (fn: () => Promise<Response>, message: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fn();
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? message);
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const watch = () =>
    mutate(
      () =>
        fetch("/api/audit/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: siteUrl,
            scope: "homepage_plus_pages",
            intervalDays,
          }),
        }),
      "The watch could not be created.",
    );

  const toggleSchedule = (id: string, active: boolean) =>
    mutate(
      () =>
        fetch(`/api/audit/schedules/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        }),
      "The watch could not be updated.",
    );

  const deleteSchedule = (id: string) =>
    mutate(() => fetch(`/api/audit/schedules/${id}`, { method: "DELETE" }), "The watch could not be deleted.");

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Site timeline
      </h2>

      {/* Regression: what changed since the previous finished run. */}
      {regression ? (
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Compared with the run on {formatDate(regression.previousCreatedAt)}:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {regression.diff.addedTotal} new
            </span>
            {" · "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {regression.diff.fixedTotal} fixed
            </span>
            {" · "}
            {regression.diff.persistingTotal} still present.
          </p>
          {regression.diff.added.length > 0 && (
            <ul className="mt-2 space-y-1">
              {regression.diff.added.map((entry) => (
                <li key={`new-${entry.ruleId}-${entry.pageUrl}`} className="text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-red-700 dark:text-red-400">New:</span>{" "}
                  {entry.title}
                  {entry.pageUrl && <span className="font-mono"> — {entry.pageUrl}</span>}
                </li>
              ))}
            </ul>
          )}
          {regression.diff.fixed.length > 0 && (
            <ul className="mt-2 space-y-1">
              {regression.diff.fixed.map((entry) => (
                <li key={`fixed-${entry.ruleId}-${entry.pageUrl}`} className="text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-green-700 dark:text-green-400">Fixed:</span>{" "}
                  {entry.title}
                  {entry.pageUrl && <span className="font-mono"> — {entry.pageUrl}</span>}
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/audit/${regression.previousScanId}`}
            className="mt-2 inline-block text-xs font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            Open the previous report
          </Link>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          First finished scan of this site — the next run will compare against it here.
        </p>
      )}

      {/* History: earlier finished runs, newest first. */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Earlier scans
          </h3>
          <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
            {history
              .filter((entry) => entry.id !== scanId)
              .slice(0, 5)
              .map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-xs">
                  <Link
                    href={`/audit/${entry.id}`}
                    className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                  >
                    {formatDate(entry.createdAt)}
                  </Link>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {entry.status === "partially_completed" ? "partial · " : ""}
                    {entry.findings} finding{entry.findings === 1 ? "" : "s"}
                    {entry.critical > 0 ? ` · ${entry.critical} critical` : ""}
                    {` · ${entry.pagesScanned} page${entry.pagesScanned === 1 ? "" : "s"}`}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Watches: scheduled re-scans of this site. */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Scheduled re-scans
        </h3>
        {schedules.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {schedule.intervalDays === 1 ? "Daily" : `Every ${schedule.intervalDays} days`}
                </span>
                <span>
                  {schedule.active
                    ? `next ${formatDate(schedule.nextRunAt)}`
                    : "paused"}
                  {schedule.lastScanId && (
                    <>
                      {" · last "}
                      <Link
                        href={`/audit/${schedule.lastScanId}`}
                        className="underline underline-offset-4"
                      >
                        report
                      </Link>
                    </>
                  )}
                </span>
                {schedule.failureCount > 0 && (
                  <span className="text-amber-700 dark:text-amber-400">
                    {schedule.failureCount} missed run{schedule.failureCount === 1 ? "" : "s"}
                  </span>
                )}
                <span className="ml-auto flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleSchedule(schedule.id, !schedule.active)}
                    className="font-medium underline underline-offset-4 disabled:opacity-50"
                  >
                    {schedule.active ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteSchedule(schedule.id)}
                    className="font-medium underline underline-offset-4 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
            No watches on this site yet. A watch re-scans the whole site on a
            schedule and the comparison above tracks what changed.
          </p>
        )}
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="watch-interval" className="sr-only">
            Re-scan interval
          </label>
          <select
            id="watch-interval"
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            disabled={busy}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {INTERVAL_OPTIONS.filter((option) => isPro || option.days === 7).map((option) => (
              <option key={option.days} value={option.days}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => void watch()}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {busy ? "Working…" : "Watch this site"}
          </button>
          {!isPro && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Weekly on Free — <Link href="/pricing" className="underline underline-offset-4">Pro unlocks daily</Link>.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
