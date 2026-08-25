"use client";

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
  return null;
}
