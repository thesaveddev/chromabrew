import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { AuthNav } from "./auth-nav";
import { ToolSearch } from "./tool-search";
import { PalettesDropdown } from "./palettes-dropdown";
import { MobileMenu } from "./mobile-menu";

const NAV_LINK =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100";

/**
 * Four principal destinations: Design System, Palettes (dropdown with the
 * four palette routes), Free Tools, Website Audit. Right side: Log in +
 * prominent Go Pro when logged out (AuthNav adapts when logged in).
 * Every destination is a genuine link, so crawlers and keyboards agree.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="relative flex h-14 w-full max-w-none items-center justify-between gap-2 px-4 sm:px-8 lg:px-12">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <Link href="/design-system" className={NAV_LINK}>
            Design System
          </Link>
          <PalettesDropdown />
          <Link href="/tools" className={NAV_LINK}>
            Free Tools
          </Link>
          <Link href="/audit" className={NAV_LINK}>
            Website Audit
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <span className="hidden lg:block">
            <ToolSearch />
          </span>
          <AuthNav />
          <ThemeToggle />
          <MobileMenu proHref="/pricing" />
        </div>
      </div>
    </header>
  );
}
