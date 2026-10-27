"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/lib/tools";
import { ProductHuntBadge } from "./product-hunt-badge";

export function SiteFooter() {
  // The fast generator is an app-like route that owns the full viewport
  // below the header; a footer here would push it below the fold and
  // reintroduce document scrolling, so the footer steps aside on that route.
  const pathname = usePathname();
  if (pathname === "/generate") return null;

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="w-full max-w-none px-4 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ChromaBrew</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Free color palette generator, design system tool, and {TOOLS.length} developer utilities.
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
        <div className="mt-10 flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} ChromaBrew. All color processing runs
            in your browser.
          </p>
          <nav aria-label="Site" className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              ["/design-system", "Design system generator"],
              ["/tools", "Free tools"],
              ["/color-tools", "Color tools"],
              ["/blog", "Blog & guides"],
              // The audit tool lives outside the TOOLS registry, so without this
              // its only inbound link was from a noindex share page — leaving an
              // indexable page that no crawler could reach.
              ["/audit", "Website audit"],
              ["/palettes", "Palette gallery"],
              ["/colors", "Color reference"],
              ["/brands", "Brand colors"],
              ["/pricing", "Pricing"],
              ["/about", "About"],
              ["/contact", "Contact"],
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex justify-center">
            <ProductHuntBadge />
          </div>
        </div>
      </div>
    </footer>
  );
}
