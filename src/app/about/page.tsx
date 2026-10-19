import type { Metadata } from "next";
import Link from "next/link";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "About",
  description:
    "What ChromaBrew is, who builds it, and how the free color tools, design system generator, and website audit are maintained.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About ChromaBrew",
    description:
      "A free, browser-based color toolkit: palette generation, WCAG contrast checks, design tokens, and a website audit — maintained as an independent project.",
    url: "/about",
    type: "website",
    images: [defaultOgImage],
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">About</span>
      </nav>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          About
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          An independent color toolkit, built in the open.
        </h1>
        <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          ChromaBrew is a free, browser-based toolkit for working with color on
          the web: palette generation, WCAG contrast checking, image color
          extraction, design tokens and production-ready exports — plus a free
          website audit that measures a live page&apos;s contrast,
          accessibility, and metadata. Everything interactive runs locally in
          your browser; there is nothing to install and no account required for
          the core tools.
        </p>
      </header>

      <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Why it exists
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <p>
            Most color tools stop at swatches: they hand you hex values and
            leave the hard decisions — tonal scales, semantic roles, dark mode,
            contrast compliance, handoff code — to you. ChromaBrew was built to
            close that gap. You start from one brand color and get a perceptual
            OKLCH scale, background-to-status semantic tokens, independently
            constructed light and dark themes, measured WCAG 2.x checks with
            one-click accessible fixes, live interface previews, and exports
            for CSS, Tailwind CSS v4, shadcn/ui, and DTCG-style JSON.
          </p>
          <p>
            The audit tool exists for the same reason applied to pages that are
            already live: instead of guessing whether a shipped page is
            accessible, you can scan any public URL and get contrast failures,
            accessibility findings with fix guidance, page coverage, and a
            captured screenshot for the report.
          </p>
        </div>
      </section>

      <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          How it is maintained
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <p>
            ChromaBrew is maintained as an independent project by its founder,
            Opeyemi Olorunfemi, alongside a library of practical guides on the{" "}
            <Link href="/blog" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              blog
            </Link>{" "}
            covering OKLCH, accessible palettes, design tokens, Tailwind v4
            themes, and dark mode. Every guide links back to the free tool it
            describes so the advice can be applied immediately.
          </p>
          <p>
            Corrections and tool improvements ship regularly. If you spot a
            contrast miscalculation, a broken export, or a guide that needs
            updating, the fastest route is the{" "}
            <Link href="/contact" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              contact page
            </Link>
            . Reports that include the page URL, the input color or values, and
            what you expected are fixed first.
          </p>
        </div>
      </section>

      <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          What is free, and how the site is funded
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          <p>
            The full design system generator, all color controls, WCAG checks,
            and core exports are free forever with no account required — see{" "}
            <Link href="/pricing" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              pricing
            </Link>
            . Accounts exist only for saving projects and sharing links. To keep
            that sustainable, the site shows a small number of clearly labeled
            display ads, disclosed in the{" "}
            <Link href="/privacy" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
              privacy policy
            </Link>
            . Ads never influence tool results, audit findings, or guide
            recommendations.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Start with the tools
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Generate a palette, check a contrast pair, or scan a live page — all
          free, all in your browser.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/tools"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Browse free tools
          </Link>
          <Link
            href="/audit"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Run a website audit
          </Link>
        </div>
      </section>
    </div>
  );
}

// Force static generation so the review crawler always gets full HTML.
export const dynamic = "force-static";
