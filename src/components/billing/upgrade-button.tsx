"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Interval = "month" | "year";

interface UpgradeButtonProps {
  interval: Interval;
  children: React.ReactNode;
  className?: string;
}

/**
 * Starts a Polar checkout for the given interval and hands the browser the
 * hosted checkout URL. The product id is decided server-side; the button
 * only says which cadence the buyer picked. Signed-out visitors go to
 * sign-in, and an unconfigured billing setup reports inline instead of
 * failing silently.
 */
export function UpgradeButton({ interval, children, className }: UpgradeButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok || !data?.url) {
        setError(
          data?.error ?? "Checkout is not available right now. Try again later.",
        );
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={className ? `${className} disabled:opacity-50` : undefined}
      >
        {busy ? "Opening…" : children}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
