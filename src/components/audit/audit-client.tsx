"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { ScanReport } from "@/components/audit/scan-report";
import { useQueueClock } from "@/components/audit/use-queue-clock";
import {
  ANONYMOUS_SCANS_PER_IP_PER_DAY,
  ANONYMOUS_SCANS_PER_IP_PER_HOUR,
  DEFAULT_VIEWPORT_ID,
  SCAN_SCOPES,
  SCAN_STAGES,
  VIEWPORTS,
  formatQueueWait,
  isScopeImplemented,
  isTerminalStatus,
  scanQueueState,
  type ScanResultsDto,
  type ScanScopeId,
  type ScanStageId,
  type ScanStatusDto,
} from "@/lib/audit/types";

const POLL_INTERVAL_MS = 1200;

/** Consecutive status-request failures tolerated before the poll gives up. */
const MAX_TRANSIENT_FAILURES = 5;

const fieldStyles =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus-visible:outline-zinc-100";

function stageIndex(stage: ScanStageId): number {
  const index = SCAN_STAGES.findIndex((candidate) => candidate.id === stage);
  return index === -1 ? 0 : index;
}

function StageChecklist({ status }: { status: ScanStatusDto }) {
  const current = stageIndex(status.stage);
  return (
    <ol className="mt-4 space-y-2">
      {SCAN_STAGES.map((stage, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li key={stage.id} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                complete
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : active
                    ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                    : "border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
              }`}
            >
              {complete ? "✓" : index + 1}
            </span>
            <span
              className={
                active
                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                  : complete
                    ? "text-zinc-600 dark:text-zinc-400"
                    : "text-zinc-400 dark:text-zinc-600"
              }
            >
              {stage.label}
              {active ? <span className="ml-1.5 text-xs text-zinc-500">in progress</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AuditClient() {
  const [url, setUrl] = useState("");
  const [scope, setScope] = useState<ScanScopeId>("single_page");
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT_ID);

  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [scanId, setScanId] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatusDto | null>(null);
  const [results, setResults] = useState<ScanResultsDto | null>(null);
  const now = useQueueClock();

  // Derived, never stored: we are polling exactly while we hold a scan id that
  // has not reached a terminal status. Deriving it keeps the button state and
  // the polling loop from being able to disagree.
  const polling = scanId !== null && (status === null || !isTerminalStatus(status.status));

  const reset = useCallback(() => {
    setScanId(null);
    setStatus(null);
    setResults(null);
    setRequestError(null);
    setFieldError(null);
  }, []);

  /* Poll the real job until it reaches a terminal state. */
  useEffect(() => {
    if (!scanId) return;

    let cancelled = false;
    // Transient failures keep the scan alive; only a run of them gives up, so a
    // single blip cannot strand an audit that is still running server-side.
    let failures = 0;

    const giveUp = (message: string) => {
      // Clearing the id tears down this effect (and its interval) on the next
      // render, so the loop cannot keep polling a scan it has abandoned.
      setScanId(null);
      setRequestError(message);
    };

    const tick = async () => {
      try {
        const response = await fetch(`/api/audit/scan/${scanId}`, { cache: "no-store" });
        if (cancelled) return;

        if (response.status === 404) {
          giveUp("This audit could not be found. Start a new one.");
          return;
        }
        if (!response.ok) {
          failures += 1;
          if (failures >= MAX_TRANSIENT_FAILURES) {
            giveUp("The scanner is temporarily unavailable. Try again in a moment.");
          }
          return;
        }
        failures = 0;

        const dto = (await response.json()) as ScanStatusDto;
        if (cancelled) return;
        setStatus(dto);

        if (!isTerminalStatus(dto.status)) return;

        window.clearInterval(timer);
        const resultsResponse = await fetch(`/api/audit/scan/${scanId}/results`, {
          cache: "no-store",
        });
        if (cancelled) return;
        if (resultsResponse.ok) {
          setResults((await resultsResponse.json()) as ScanResultsDto);
        } else {
          setRequestError("The audit finished but its findings could not be loaded. Try again.");
        }
      } catch {
        if (cancelled) return;
        failures += 1;
        if (failures >= MAX_TRANSIENT_FAILURES) {
          giveUp("The connection to the scanner was lost. Try again.");
        }
      }
    };

    const timer = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [scanId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // reset() also clears scanId. That matters: leaving the previous scan's id in
    // place while clearing its status would leave the derived `polling` stuck at
    // true, disabling the button forever after a rejected resubmission.
    reset();
    setSubmitting(true);

    try {
      const response = await fetch("/api/audit/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, scope, viewport }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
        code?: string;
      };

      if (response.status === 202 && payload.id) {
        setScanId(payload.id);
        return;
      }
      if (response.status === 400) {
        setFieldError(payload.error ?? "That URL cannot be scanned.");
        return;
      }
      if (response.status === 429) {
        // Two different refusals wear the same status code. A full queue is a
        // busy moment and nothing the caller did; their own allowance is theirs
        // and worth naming. Appending the per-day limits to a busy queue told
        // people they had used up audits they never ran.
        setRequestError(
          payload.code === "queue_full"
            ? (payload.error ?? "Every scanner is busy with other audits right now.")
            : `${
                payload.error ?? "You have reached the audit limit."
              } Free audits are limited to ${ANONYMOUS_SCANS_PER_IP_PER_HOUR} per hour and ${ANONYMOUS_SCANS_PER_IP_PER_DAY} per day.`,
        );
        return;
      }
      setRequestError(payload.error ?? "The audit could not be started. Try again.");
    } catch {
      setRequestError("The audit could not be started — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeScan = results?.scan ?? status;
  const showProgress = scanId !== null && !results && activeScan?.status !== "failed";
  const failed = activeScan?.status === "failed";
  // Queued but not yet claimed is not the same as in progress, and the checklist
  // below would sit on "Validating URL" either way. Past the notice window this
  // says what is really happening.
  // Anything but "pending" means a queued scan past the notice window — the
  // abandoned window included, until the server closes it on the next poll.
  const awaitingScanner =
    activeScan !== null && scanQueueState(activeScan.status, activeScan.createdAt, now) !== "pending";
  // Only read while the panel that shows it is up, and only after the clock has
  // ticked: `awaiting_scanner` is unreachable until `now` is a real time.
  const waitedMs =
    activeScan && awaitingScanner ? Math.max(0, now - Date.parse(activeScan.createdAt)) : 0;

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="grid gap-5 sm:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <label
              htmlFor="audit-url"
              className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Website URL
            </label>
            <input
              id="audit-url"
              name="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="chromabrew.app"
              aria-invalid={fieldError !== null}
              aria-describedby={fieldError ? "audit-url-error" : undefined}
              className={`mt-1.5 ${fieldStyles}`}
            />
          </div>

          <div>
            <label
              htmlFor="audit-scope"
              className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Scope
            </label>
            <select
              id="audit-scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as ScanScopeId)}
              className={`mt-1.5 ${fieldStyles}`}
            >
              {SCAN_SCOPES.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={!isScopeImplemented(option.id)}
                >
                  {option.label}
                  {isScopeImplemented(option.id) ? "" : " — coming soon"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="audit-viewport"
              className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Viewport
            </label>
            <select
              id="audit-viewport"
              value={viewport}
              onChange={(event) => setViewport(event.target.value)}
              className={`mt-1.5 ${fieldStyles}`}
            >
              {VIEWPORTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {fieldError ? (
          <p
            id="audit-url-error"
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {fieldError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting || polling}>
            {submitting ? "Starting…" : polling ? "Auditing…" : "Analyse website"}
          </Button>
          {scanId ? (
            <Button type="button" variant="secondary" onClick={reset}>
              Start a new audit
            </Button>
          ) : null}
        </div>

        <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
          Public pages only, and only pages you are allowed to scan. The scanner fetches the page
          server-side and identifies itself in the request. Submitting a URL confirms you have the
          right to analyse it. Nothing is stored about you beyond a hashed IP address used for rate
          limiting — free audits are limited to {ANONYMOUS_SCANS_PER_IP_PER_HOUR} per hour and{" "}
          {ANONYMOUS_SCANS_PER_IP_PER_DAY} per day.
        </p>
      </form>

      {requestError ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {requestError}
        </p>
      ) : null}

      {showProgress && activeScan ? (
        <section
          aria-live="polite"
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {awaitingScanner ? "Waiting for a scanner" : `Auditing ${activeScan.normalizedUrl}`}
          </h2>
          {awaitingScanner ? (
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Every scanner is busy with other audits, so yours is queued — waiting{" "}
              {formatQueueWait(waitedMs)}. Only a couple of audits run at the same time, so a short
              wait is normal. This page keeps checking and the report appears on its own.
            </p>
          ) : (
            <>
              <StageChecklist status={activeScan} />
              <p className="mt-4 text-xs text-zinc-500">
                {activeScan.ruleCount} rules will run against the served HTML. You can leave this
                page open — the audit continues.
              </p>
            </>
          )}
        </section>
      ) : null}

      {failed && activeScan ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
          <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
            This audit did not complete
          </h2>
          <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-300">
            {activeScan.errorMessage ?? "The site could not be analysed."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={reset}>
              Try another URL
            </Button>
          </div>
        </section>
      ) : null}

      {results ? <ScanReport results={results} /> : null}
    </div>
  );
}
