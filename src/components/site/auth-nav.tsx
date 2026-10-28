"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { UserMenu } from "./user-menu";

const LOGIN_CLASSES =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100";

const GOPRO_CLASSES =
  "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus-visible:outline-zinc-100";

/**
 * Signed-out: Log in (quiet) + Go Pro (prominent, always /pricing).
 * Signed-in free: My Projects + Go Pro + avatar menu (Account inside).
 * Signed-in Pro: My Projects + avatar menu — no misleading upgrade CTA.
 * Plan comes from the one billing endpoint; unknown defaults to hiding
 * Go Pro for signed-in users rather than guessing.
 */
export function AuthNav() {
  const { data: session, status } = useSession();
  const [plan, setPlan] = useState<"free" | "pro" | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/billing/plan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && (data?.plan === "pro" || data?.plan === "free")) {
          setPlan(data.plan);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "authenticated" && session) {
    return (
      <span className="flex items-center gap-1">
        <Link
          href="/projects"
          className="hidden rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100 sm:block"
        >
          My Projects
        </Link>
        {plan === "free" ? (
          <Link
            href="/pricing"
            onClick={() => track("go_pro_clicked", { location: "header" })}
            className={GOPRO_CLASSES}
          >
            Go Pro
          </Link>
        ) : null}
        <UserMenu user={session.user} />
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <Link
        href="/sign-in"
        onClick={() => track("login_clicked", { location: "header" })}
        className={`${LOGIN_CLASSES} hidden sm:block`}
      >
        Log in
      </Link>
      <Link
        href="/pricing"
        onClick={() => track("go_pro_clicked", { location: "header" })}
        className={GOPRO_CLASSES}
      >
        Go Pro
      </Link>
    </span>
  );
}
