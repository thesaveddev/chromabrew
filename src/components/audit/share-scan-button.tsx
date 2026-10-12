"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { copyToClipboard } from "@/components/ui/primitives";

interface ShareState {
  shared: boolean;
  url: string | null;
}

/**
 * The owner's share control.
 *
 * It reads the current state on mount rather than creating a link on view, so
 * opening your own report never publishes it. Only a deliberate press does, and
 * a second press copies the link that already exists instead of rotating it out
 * from under whoever is holding it.
 */
export function ShareScanButton({ scanId }: { scanId: string }) {
  const [state, setState] = useState<ShareState | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/audit/scan/${scanId}/share`, { cache: "no-store" });
        if (response.status === 401) {
          if (!cancelled) setNeedsSignIn(true);
          return;
        }
        if (!response.ok) throw new Error("Could not read the share state");
        const data = (await response.json()) as ShareState;
        if (!cancelled) setState(data);
      } catch {
        // A control that cannot read its own state stays hidden rather than
        // guessing at a state it might then act on.
        if (!cancelled) setError(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const change = useCallback(
    async (method: "POST" | "DELETE") => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch(`/api/audit/scan/${scanId}/share`, { method });
        const data = (await response.json()) as ShareState & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Sharing failed");
        setState(data);
        if (method === "POST" && data.url && (await copyToClipboard(data.url))) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Sharing failed");
      } finally {
        setBusy(false);
      }
    },
    [scanId],
  );

  if (needsSignIn) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/sign-in" className="underline underline-offset-2">
          Sign in
        </Link>{" "}
        to share this report with a link.
      </p>
    );
  }

  if (!state) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Share this report</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {state.shared
              ? "Anyone with the link can read this report. The link can be revoked."
              : "Create a link anyone can open — no account needed to read it."}
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {state.shared ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (state.url && (await copyToClipboard(state.url))) {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void change("DELETE")}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Stop sharing
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void change("POST")}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {busy ? "Creating…" : "Create share link"}
            </button>
          )}
        </div>
      </div>

      {state.shared && state.url ? (
        <p className="mt-3 break-all rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          {state.url}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
