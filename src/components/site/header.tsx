import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { AuthNav } from "./auth-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/design-system"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
          >
            Generator
          </Link>
          <Link
            href="/tools"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100 sm:block"
          >
            Free tools
          </Link>
          <Link
            href="/pricing"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100 sm:block"
          >
            Pricing
          </Link>
          <AuthNav />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
