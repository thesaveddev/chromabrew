import type { Metadata } from "next";
import Link from "next/link";
import { AuditSection } from "@/components/home/audit-section";
import { LinkButton } from "@/components/ui/primitives";
import { PLANS } from "@/lib/entitlements";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Free Color Palette Generator, Design Tools & Website Audit",
  description:
    "Build better design systems and improve the websites you already have: free color palette generator, WCAG contrast checks, design tokens and dark mode — plus a free website audit. No sign-up.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Free Color Palette Generator & Design Tools · ChromaBrew",
    description:
      "Generate color palettes instantly or browse 1000 curated schemes. WCAG contrast checks, image color extraction, design tokens, and Tailwind or shadcn exports — free, no sign-up.",
    url: "/",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Color Palette Generator & Design Tools · ChromaBrew",
    description:
      "Generate or browse color palettes, check contrast, extract image colors and export tokens — free, no sign-up.",
    images: [defaultOgImage.url],
  },
};

const CALM_PALETTE = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"];

const WHAT_YOU_CAN_DO = [
  {
    title: "Generate palettes",
    body: "Press space for fresh five-color schemes. Lock what you love, copy any hex.",
    href: "/generate",
    link: "Open the generator",
  },
  {
    title: "Build a design system",
    body: "Turn one color into scales, tokens, light and dark themes — WCAG checked.",
    href: "/design-system",
    link: "Open the design system generator",
  },
  {
    title: "Audit a live website",
    body: "Paste a URL. Get contrast and accessibility findings with fixes you can ship.",
    href: "/audit",
    link: "Run a free audit",
  },
] as const;

const POPULAR_TOOLS = [
  { title: "Contrast checker", href: "/tools/contrast-checker" },
  { title: "Palette generator", href: "/tools/color-palette-generator" },
  { title: "Image color extractor", href: "/tools/image-color-extractor" },
  { title: "Tailwind generator", href: "/tools/tailwind-color-generator" },
  { title: "Dark mode generator", href: "/tools/dark-mode-generator" },
  { title: "Shade generator", href: "/tools/shade-generator" },
] as const;

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "ChromaBrew — Design System Generator",
          url: `${siteUrl}/design-system`,
          description:
            "Free design system generator: turn one color into accessible palettes, semantic tokens, light and dark themes, WCAG checks, and production-ready CSS, Tailwind v4 and shadcn/ui exports.",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any (web browser)",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />

      {/* Hero — one idea, two doors. Centered like Coolors: headline,
          one supporting line, two calm actions, one quiet palette. */}
      <section className="mx-auto w-full max-w-3xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Free color toolkit · No sign-up
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
          Colors that work. Sites that pass.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Generate accessible palettes and design tokens — or audit a live
          website for contrast and accessibility issues. Free in your browser.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/generate" variant="primary" className="px-6 py-3 text-base">
            Start generating — it&apos;s free
          </LinkButton>
          <LinkButton href="/audit" variant="secondary" className="px-6 py-3 text-base">
            Run a free audit
          </LinkButton>
        </div>

        {/* One calm palette strip. Static, no motion, links into the real generator. */}
        <Link
          href="/generate"
          aria-label="Open the palette generator"
          className="group mt-12 block overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
        >
          <span className="flex h-28 sm:h-36" aria-hidden>
            {CALM_PALETTE.map((hex) => (
              <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
            ))}
          </span>
          <span className="flex items-center justify-between bg-white px-4 py-3 dark:bg-zinc-900">
            <span className="font-mono text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
              #264653 · #2A9D8F · #E9C46A · #F4A261 · #E76F51
            </span>
            <span className="text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
              Open in generator →
            </span>
          </span>
        </Link>
      </section>

      {/* What you can do — three quiet cards, nothing more. */}
      <section
        aria-labelledby="do-heading"
        className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6"
      >
        <h2
          id="do-heading"
          className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
        >
          What you can do
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {WHAT_YOU_CAN_DO.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.body}
              </p>
              <Link
                href={item.href}
                className="mt-4 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                {item.link}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <AuditSection />

      {/* Pro — Free vs Pro, plainly. Full comparison lives on /pricing. */}
      <section
        aria-labelledby="pro-heading"
        className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Pro
        </p>
        <h2
          id="pro-heading"
          className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
        >
          Free forever. Pro when you need it.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Everything that generates, checks, and exports is free. Pro adds
          saving, every export adapter, and AI.
        </p>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {PLANS.free.name} · {PLANS.free.price}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {PLANS.free.description}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Full generator + WCAG checks</li>
              <li>CSS, JSON, Tailwind, shadcn exports</li>
              <li>10 standalone color tools</li>
            </ul>
            <LinkButton href="/design-system" variant="secondary" className="mt-6 w-full">
              Get started
            </LinkButton>
          </div>
          <div className="rounded-2xl border-2 border-zinc-900 bg-white p-6 dark:border-zinc-100 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {PLANS.pro.name} · {PLANS.pro.price}/{PLANS.pro.period}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {PLANS.pro.description}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Everything in Free</li>
              <li>Unlimited saving + version history</li>
              <li>All export adapters + AI features</li>
            </ul>
            <LinkButton href="/pricing" variant="primary" className="mt-6 w-full">
              See Pro plans
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Popular tools — one quiet line of links, full directory on /tools. */}
      <section
        aria-labelledby="tools-heading"
        className="mx-auto w-full max-w-5xl px-4 pb-16 text-center sm:px-6"
      >
        <h2
          id="tools-heading"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
        >
          Popular tools
        </h2>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {POPULAR_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              {tool.title}
            </Link>
          ))}
          <Link
            href="/tools"
            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            All tools →
          </Link>
        </p>
      </section>

      {/* FAQ — kept for search, trimmed to four. */}
      <section
        aria-labelledby="faq-heading"
        className="border-t border-zinc-200 py-14 dark:border-zinc-800"
      >
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Is ChromaBrew really free?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes — every generator, checker, and export runs in your browser with no account and no upload. An account is only needed to save projects.",
                },
              },
              {
                "@type": "Question",
                name: "What is Pro?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Pro adds unlimited project saving, version history, all export adapters and AI features. The generator, checks and core exports stay free forever.",
                },
              },
              {
                "@type": "Question",
                name: "Can I use these palettes in Tailwind or CSS?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Open any palette in the design system generator and export CSS variables, Tailwind v4 themes, shadcn/ui variables, or JSON tokens.",
                },
              },
              {
                "@type": "Question",
                name: "Can ChromaBrew audit a website I already shipped?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. The free website audit renders a live page in a real browser, measures text contrast from computed styles, runs axe-core and structural checks, and proposes re-measured fixes — nothing is changed on your site.",
                },
              },
            ],
          }}
        />
        <div className="mx-auto grid w-full max-w-5xl gap-x-10 gap-y-8 px-4 sm:grid-cols-2 sm:px-6">
          <h2
            id="faq-heading"
            className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:col-span-2"
          >
            Questions, answered.
          </h2>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Is ChromaBrew really free?
            </p>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Yes — generators, checkers, and core exports run free with no
              account. Saving projects is what asks for one.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              What is Pro?
            </p>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Unlimited saving, version history, every export adapter, and AI
              features.{" "}
              <Link
                href="/pricing"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                See pricing
              </Link>
              .
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Can I use these palettes in Tailwind or CSS?
            </p>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Yes — open any palette in the{" "}
              <Link
                href="/design-system"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                design system generator
              </Link>{" "}
              and export CSS, Tailwind v4, shadcn/ui, or JSON.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Can it audit a site I already shipped?
            </p>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Yes — the{" "}
              <Link
                href="/audit"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                free website audit
              </Link>{" "}
              renders the live page and proposes fixes. Nothing changes on
              your site.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
