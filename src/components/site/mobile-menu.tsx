"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { track } from "@/lib/analytics";

const PALETTE_LINKS = [
  { href: "/generate", title: "Generate a palette" },
  { href: "/palettes", title: "Browse palettes" },
  { href: "/gallery", title: "Community gallery" },
  { href: "/tools/ai-palette-suggestion", title: "Palette ideas" },
] as const;

/**
 * Compact mobile menu: logo and Go Pro stay visible in the bar itself;
 * this panel holds the four destinations with nested palette links plus
 * the Log in entry. Genuine links, no hover dependence.
 */
export function MobileMenu({ proHref }: { proHref: string }) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md px-2 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <span aria-hidden className="block h-4 w-5">
          {open ? "✕" : "☰"}
        </span>
      </button>
      {open ? (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full z-50 border-b border-zinc-200 bg-white px-4 pb-6 pt-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            <Link
              href="/design-system"
              onClick={close}
              className="rounded-lg px-3 py-3 text-base font-medium text-zinc-900 dark:text-zinc-100"
            >
              Design System
            </Link>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Palettes
            </p>
            {PALETTE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="rounded-lg px-6 py-2.5 text-sm text-zinc-700 dark:text-zinc-300"
              >
                {link.title}
              </Link>
            ))}
            <Link
              href="/tools"
              onClick={close}
              className="rounded-lg px-3 py-3 text-base font-medium text-zinc-900 dark:text-zinc-100"
            >
              Free Tools
            </Link>
            <Link
              href="/audit"
              onClick={close}
              className="rounded-lg px-3 py-3 text-base font-medium text-zinc-900 dark:text-zinc-100"
            >
              Website Audit
            </Link>
            <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              {session ? (
                <Link
                  href="/projects"
                  onClick={close}
                  className="rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                >
                  My Projects
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => {
                      track("login_clicked");
                      close();
                    }}
                    className="rounded-lg border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    Log in
                  </Link>
                  <Link
                    href={proHref}
                    onClick={() => {
                      track("go_pro_clicked", { location: "mobile-menu" });
                      close();
                    }}
                    className="rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Go Pro
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
