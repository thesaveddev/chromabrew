import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free Color Tools — Palette Generator, Contrast Checker & More",
  description:
    "15+ free color tools for developers and designers: color palette generator, image color extractor, WCAG contrast checker, color blindness simulator, CSS gradient generator, Tailwind color generator, and more. No sign-up required.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 dark:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Tools</span>
      </nav>
      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Free color &amp; design token tools
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Focused single-purpose color tools powered by the same engines behind the{" "}
          <Link
            href="/design-system"
            className="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4"
          >
            color palette generator
          </Link>
          . Generate color palettes, extract colors from images, check WCAG contrast ratios,
          simulate color blindness, create CSS gradients, and build Tailwind CSS themes — all free, no sign-up.
        </p>
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
            >
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline group-hover:underline-offset-4">
                {tool.title}
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                {tool.blurb}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
