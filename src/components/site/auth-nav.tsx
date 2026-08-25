"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserMenu } from "./user-menu";

/**
 * Client island for the signed-out/signed-in nav slot so the header
 * itself stays a static server component.
 */
export function AuthNav() {
  const { data: session, status } = useSession();

  // "loading" matches the statically-rendered fallback below, so there is
  // no hydration mismatch; the menu swaps in once the session resolves.
  if (session && status === "authenticated") {
    return <UserMenu user={session.user} />;
  }
  return (
    <Link
      href="/sign-in"
      className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      Sign in
    </Link>
  );
}
