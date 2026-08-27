import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ChromaBrew</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Free color palette generator, design system tool, and 15+ developer utilities.
              Create accessible palettes, extract colors from images, check contrast ratios, and generate production-ready CSS — all in your browser.
            </p>
          </div>
          <nav aria-label="Free tools" className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
              >
                {tool.navLabel}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            © {new Date().getFullYear()} ChromaBrew. All color processing runs
            in your browser.
          </p>
          <Link
            href="/blog"
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
          >
            Blog &amp; guides
          </Link>
        </div>
      </div>
    </footer>
  );
}
