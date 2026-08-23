import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Colorsmith</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-600">
              Turn one colour into an accessible, production-ready design
              system. Free tools for developers and designers.
            </p>
          </div>
          <nav aria-label="Free tools" className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                {tool.navLabel}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Colorsmith. All colour processing runs
            in your browser.
          </p>
          <p className="text-xs text-zinc-500">Phase 1 — free design system generator</p>
        </div>
      </div>
    </footer>
  );
}
