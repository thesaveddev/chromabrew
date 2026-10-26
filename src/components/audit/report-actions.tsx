"use client";

import { useState } from "react";

/**
 * Take the report offline: the pro-gated ZIP bundle and the free
 * print-to-PDF path. The bundle fetch saves a blob so a gating failure
 * reads as a message with an upgrade link, never as a downloaded error
 * page; print is plain `window.print()` against the print stylesheet.
 */
export function BundleDownloadButton({ scanId }: { scanId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    setUpgradeUrl(null);
    try {
      const response = await fetch(`/api/audit/scan/${scanId}/bundle`);
      if (response.status === 401) {
        setError("Sign in to download the report bundle.");
        return;
      }
      if (response.status === 403) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
          upgradeUrl?: string;
        } | null;
        setError(body?.error ?? "The report bundle is a Pro feature.");
        setUpgradeUrl(body?.upgradeUrl ?? "/pricing");
        return;
      }
      if (!response.ok) throw new Error("The bundle could not be built.");
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ?? `audit-${scanId.slice(0, 8)}.zip`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("The bundle could not be downloaded. Try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {busy ? "Building…" : "Download report (.zip)"}
      </button>
      {error && (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {error}{" "}
          {upgradeUrl && (
            <a href={upgradeUrl} className="font-medium underline underline-offset-4">
              Upgrade to Pro
            </a>
          )}
        </p>
      )}
    </div>
  );
}

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      Print / save PDF
    </button>
  );
}
