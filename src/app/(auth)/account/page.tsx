"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Account · ChromaBrew",
};

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/sign-in");

  return (
    <div className="flex flex-1 flex-col px-4 py-16">
      <div className="mx-auto w-full max-w-lg space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Account
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Manage your ChromaBrew account.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {session.user.name ?? "Unnamed"}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/projects"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            My projects
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
