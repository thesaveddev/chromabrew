"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EntitlementKey, PlanType } from "@/lib/entitlements";
import { UpgradeButton } from "@/components/billing/upgrade-button";

interface PlanResponse {
  plan: PlanType;
  entitlements: EntitlementKey[];
  subscription: {
    status: string;
    interval: string;
    amount: number;
    currency: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

const FREE_STATE: PlanResponse = {
  plan: "free",
  entitlements: [],
  subscription: null,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The account page's billing card, backed by Polar: current plan and
 * entitlements from /api/billing/plan, checkout via /api/polar/checkout
 * (shared UpgradeButton), management via /api/polar/portal — a redirect
 * either way, so no payment SDK ships to the client.
 */
export function BillingSection() {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);

  useEffect(() => {
    const checkoutSuccess =
      new URLSearchParams(window.location.search).get("checkout") === "success";
    let live = true;
    fetch("/api/billing/plan")
      .then((res) => (res.ok ? res.json() : FREE_STATE))
      .then((json: PlanResponse) => {
        if (!live) return;
        setData(json);
        setJustPaid(checkoutSuccess);
      })
      .catch(() => {
        if (live) setData(FREE_STATE);
      });
    return () => {
      live = false;
    };
  }, []);

  const openPortal = async () => {
    setBusy(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/polar/portal", { method: "POST" });
      const body = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok || !body?.url) {
        setPortalError(body?.error ?? "Could not open billing yet.");
        return;
      }
      window.location.href = body.url;
    } catch {
      setPortalError("Something went wrong. Try again later.");
    } finally {
      setBusy(false);
    }
  };

  const isPro = data?.plan === "pro";
  const sub = data?.subscription ?? null;
  const hasAi = data?.entitlements.includes("ai") ?? false;
  const amount = sub ? (sub.amount / 100).toLocaleString() : null;
  const cadence = sub?.interval === "year" ? "/yr" : "/mo";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Plan
        </h2>
        <div className="flex items-center gap-2">
          {hasAi && (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              AI
            </span>
          )}
          {data === null ? (
            <span className="text-xs text-zinc-400">Checking…</span>
          ) : isPro ? (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
              Pro
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Free
            </span>
          )}
        </div>
      </div>

      {justPaid && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs leading-5 text-green-700 dark:bg-green-950 dark:text-green-300">
          Thanks! Your payment went through — Pro activates as soon as the
          payment confirmation lands (usually within seconds).
        </p>
      )}

      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {isPro
          ? "Pro is active on this account — unlimited projects, history, every export adapter, and AI features as they ship."
          : "Free covers the full generator and core exports. Pro unlocks unlimited projects and history, every export adapter, and AI."}
      </p>

      {isPro && sub && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          ${amount}
          {cadence} ·{" "}
          {sub.cancelAtPeriodEnd && sub.currentPeriodEnd
            ? `cancels ${formatDate(sub.currentPeriodEnd)}`
            : sub.currentPeriodEnd
              ? `renews ${formatDate(sub.currentPeriodEnd)}`
              : `status ${sub.status}`}
        </p>
      )}

      {portalError && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {portalError}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {data !== null &&
          (isPro ? (
            <>
              <button
                type="button"
                onClick={openPortal}
                disabled={busy}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {busy ? "Opening…" : "Manage billing"}
              </button>
              <Link
                href="/pricing"
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Compare plans
              </Link>
            </>
          ) : (
            <>
              <UpgradeButton
                interval="month"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Upgrade to Pro — $9/mo
              </UpgradeButton>
              <Link
                href="/pricing"
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Compare plans
              </Link>
            </>
          ))}
      </div>
    </div>
  );
}
