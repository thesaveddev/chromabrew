"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { track } from "@/lib/analytics";
import {
  ANONYMOUS_SCANS_PER_IP_PER_DAY,
  ANONYMOUS_SCANS_PER_IP_PER_HOUR,
  SCANNER_OFFLINE_CODE,
  SCANNER_OFFLINE_MESSAGE,
  WORKER_HEARTBEAT_MS,
  formatQueueWait,
  type ScannerAvailability,
} from "@/lib/audit/types";
import { useQueueClock } from "./use-queue-clock";

/**
 * The audit form.
 *
 * Split into a view and a container for the same reason the progress panel is
 * (`scan-progress.tsx`): the states it can be in are the point of it, and the
 * one that matters most — there being no scanner to run an audit — has to be
 * assertable without a DOM.
 *
 * That state exists because of what the form used to do. With the worker down it
 * accepted a URL, wrote a `queued` row and reported a queued audit, and the
 * reader found out ten minutes later when the queue gave up on a scan nothing
 * had ever been coming for. The worker announces itself now
 * (`src/lib/audit/heartbeat.ts`), so the form can say so before a URL is typed.
 */
export interface UrlFormViewProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
  error: string;
  /** No scanner: the submit is withheld rather than answered with a message. */
  offline: boolean;
  /** When the newest beat was written; null when none has ever arrived. */
  lastSeenAt: string | null;
  /** The live clock. 0 means it has not ticked yet (see `useQueueClock`). */
  now: number;
}

export function UrlFormView({
  url,
  onUrlChange,
  onSubmit,
  loading,
  error,
  offline,
  lastSeenAt,
  now,
}: UrlFormViewProps) {
  const seenAt = lastSeenAt === null ? NaN : Date.parse(lastSeenAt);

  /**
   * How long the scanner has been quiet, in the two cases that read differently.
   *
   * No beat at all is not "offline for a long time" — it is a deployment whose
   * worker has never run, and saying that is more useful than a duration. And
   * an age measured against a clock that has not ticked yet is nonsense, so the
   * line waits for the first tick rather than guessing at one.
   */
  const silence =
    lastSeenAt === null
      ? "No scanner has checked in yet."
      : Number.isFinite(seenAt) && now > 0
        ? `Silent for ${formatQueueWait(now - seenAt)}.`
        : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      <div>
        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="example.com or https://example.com"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          required
        />
      </div>

      {/* Above the button, not below it: a disabled control is not in the tab
          order, so the reason it is one has to be met on the way to it. `status`
          announces the change when the form flips to this state or back. */}
      {offline ? (
        <div
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <p className="font-medium">Scanner offline</p>
          <p className="mt-1">{SCANNER_OFFLINE_MESSAGE}</p>
          {silence ? <p className="mt-1 text-xs">{silence}</p> : null}
          <p className="mt-1 text-xs">
            This form checks again every {Math.round(WORKER_HEARTBEAT_MS / 1_000)} seconds, so it
            will come back on its own.
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || offline}
        className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Starting scan..." : offline ? "Scanner offline" : "Analyze Website"}
      </button>

      {/* The limits are stated before they are hit rather than only inside a
          refusal, so a queued scan reads as normal and a 429 arrives as an
          expectation the reader already had. */}
      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">
        The scanner fetches the page server-side at a desktop viewport and identifies itself in the
        request. Submitting a URL confirms you are allowed to analyse it. Free audits are limited to{" "}
        {ANONYMOUS_SCANS_PER_IP_PER_HOUR} per hour and {ANONYMOUS_SCANS_PER_IP_PER_DAY} per day; no
        account is needed and nothing is stored beyond a hashed IP address used for that limit.
      </p>
    </form>
  );
}

/**
 * Start an audit, once there is something to run it.
 *
 * Availability is fetched rather than passed in from the page, because the audit
 * page is prerendered: a build-time answer would be baked into the HTML and
 * would go on offering a scanner that stopped weeks ago.
 *
 * The check is a courtesy, not the guard — `POST /api/audit/scan` asks the same
 * question and refuses there. So the two ways this check can be unhelpful are
 * both recoverable: before it answers, the form behaves exactly as it did
 * before this existed and lets the submit decide; if it cannot be made at all,
 * the form stays usable rather than disabling itself over a failed HTTP request.
 */
export function UrlForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<ScannerAvailability | null>(null);
  // Set only by a refusal from the route. The route's answer is current; the
  // check above can be up to one interval old.
  const [refused, setRefused] = useState(false);
  const router = useRouter();
  // A second is fine for a "silent for 1m 05s" line, and this is the same clock
  // the progress panel measures its queue wait with.
  const now = useQueueClock();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/audit/scanner", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ScannerAvailability;
        if (cancelled) return;
        setAvailability(data);
        // A scanner that is back takes the refusal with it, so the reader does
        // not have to reload a page that has already told them the truth.
        if (data.online) setRefused(false);
      } catch {
        // Swallowed on purpose: an unreachable check is not evidence that the
        // scanner is down, and disabling the form on it would take the audit
        // feature down with the diagnostics that were supposed to help.
      }
    };

    void check();
    const interval = window.setInterval(check, WORKER_HEARTBEAT_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const offline = refused || (availability !== null && !availability.online);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let inputUrl = url.trim();
      if (!/^https?:\/\//i.test(inputUrl)) {
        inputUrl = `https://${inputUrl}`;
      }

      const res = await fetch("/api/audit/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl, scope: "single_page" }),
      });

      if (!res.ok) {
        const data = await res.json();

        // The one refusal that is a state rather than a message: the route
        // answered "there is no scanner", which is what the notice above says
        // and what the reader needs to know rather than an error to act on.
        // Nothing was written, so there is nothing to explain away.
        if (data.code === SCANNER_OFFLINE_CODE) {
          setRefused(true);
          return;
        }

        throw new Error(data.error || "Failed to start scan");
      }

      // `id` is what POST /api/audit/scan returns (202) — the same field the
      // scanner UI reads. This used to read `scanId`, which the route stopped
      // sending, so the push went to /audit/undefined.
      const data = await res.json();
      track("audit_started");
      router.push(`/audit/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UrlFormView
      url={url}
      onUrlChange={setUrl}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      offline={offline}
      lastSeenAt={availability?.lastSeenAt ?? null}
      now={now}
    />
  );
}
