"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

/**
 * The hero's quiet second door. The form's submit button owns the
 * primary generate action, so the audit path is a text link — no
 * competing buttons, but the funnel event still fires.
 */
export function HeroAuditLink() {
  return (
    <Link
      href="/audit"
      onClick={() => track("hero_audit_clicked", { location: "hero" })}
      className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
    >
      or audit a website
    </Link>
  );
}
