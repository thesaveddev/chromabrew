import type { Metadata } from "next";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free colour & design token tools",
  description:
    "Ten genuinely useful free tools for developers and designers: palette generation, perceptual shades, WCAG contrast checking, format converters and theme generators. No sign-up.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-800">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700">Tools</span>
      </nav>
      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Free colour &amp; design token tools
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Focused single-purpose tools powered by the same engines behind the{" "}
          <Link
            href="/design-system"
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            design system generator
          </Link>
          . Everything runs locally in your browser.
        </p>
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="group block h-full rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <h2 className="text-sm font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-4">
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
