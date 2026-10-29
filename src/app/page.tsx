import type { Metadata } from "next";
import Link from "next/link";
import { AuditSection } from "@/components/home/audit-section";
import { HeroAuditLink } from "@/components/home/hero-audit-link";
import { HeroColourForm } from "@/components/home/hero-form";
import { HeroPlayground } from "@/components/home/hero-playground";
import { ScrollReveal } from "@/components/site/scroll-reveal";
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
      "Generate color palettes instantly or browse a million ready-made palettes. WCAG contrast checks, image color extraction, design tokens, and Tailwind or shadcn exports — free, no sign-up.",
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

const CAPABILITIES = [
  {
    title: "Perceptual color scales",
    body: "50–950 steps computed in OKLCH, so every stop is evenly spaced to the eye.",
  },
  {
    title: "Semantic tokens",
    body: "Background, surface, primary, border and status roles that map to real components.",
  },
  {
    title: "Accessibility built in",
    body: "Key pairs graded against WCAG AA/AAA from measured values — fixes offered, never assumed.",
  },
  {
    title: "Developer-ready exports",
    body: "CSS variables, DTCG-style JSON, Tailwind v4 themes and shadcn/ui variables to paste in.",
  },
] as const;

const TOOL_GROUPS = [
  {
    label: "Palette creation",
    tools: [
      { title: "Color palette generator", href: "/tools/color-palette-generator" },
      { title: "Shade generator", href: "/tools/shade-generator" },
      { title: "Image color extractor", href: "/tools/image-color-extractor" },
    ],
  },
  {
    label: "Accessibility and contrast",
    tools: [
      { title: "Contrast checker", href: "/tools/contrast-checker" },
      { title: "WCAG palette checker", href: "/tools/wcag-palette-checker" },
      { title: "Color blindness simulator", href: "/tools/color-blindness-simulator" },
    ],
  },
  {
    label: "Design tokens and themes",
    tools: [
      { title: "Design token generator", href: "/tools/design-token-generator" },
      { title: "Dark mode generator", href: "/tools/dark-mode-generator" },
      { title: "Tailwind color generator", href: "/tools/tailwind-color-generator" },
    ],
  },
  {
    label: "Developer utilities",
    tools: [
      { title: "Color converter", href: "/tools/color-converter" },
      { title: "CSS gradient generator", href: "/tools/css-gradient-generator" },
      { title: "AI palette ideas", href: "/tools/ai-palette-suggestion" },
    ],
  },
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

      {/* Hero — the product, working, above the fold. Text on the left
          says what ChromaBrew does; the playground on the right proves it.
          No Go Pro here on purpose; it owns the header. */}
      <section className="relative overflow-hidden">
        {/* Signature backdrop: a dot field (design-system graph paper) washed
            with brand hues and a slow-spinning hue-wheel glow. Static CSS only;
            the spin is motion-safe so reduced-motion users get a still frame. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_35%,black,transparent)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(rgba(24,24,27,0.09)_1px,transparent_1px)] bg-[size:22px_22px] dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)]" />
          <div className="absolute -left-48 top-1/4 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.22),transparent_65%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(124,58,237,0.28),transparent_65%)]" />
          <div className="absolute -right-40 bottom-0 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.18),transparent_65%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(14,165,233,0.25),transparent_65%)]" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[conic-gradient(from_90deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6,#ef4444)] opacity-[0.14] blur-2xl motion-safe:animate-[spin_60s_linear_infinite] dark:opacity-[0.22]" />
        </div>
        <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-6xl items-center px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="text-center lg:text-left">
            <p className="hero-enter text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Free color toolkit · No sign-up
            </p>
            <h1 className="hero-enter mt-4 text-4xl font-bold leading-[1.06] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl [--hero-delay:70ms]">
              Turn one color into a design system.
            </h1>
            <p className="hero-enter mx-auto mt-4 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400 lg:mx-0 [--hero-delay:140ms]">
              Palettes, WCAG contrast, tokens, and dark mode — ready to ship.
            </p>
            <div className="hero-enter mt-7 flex justify-center lg:justify-start [--hero-delay:210ms]">
              <HeroColourForm />
            </div>
            <p className="hero-enter mt-4 text-sm text-zinc-500 dark:text-zinc-400 [--hero-delay:280ms]">
              Free, no account — <HeroAuditLink />.
            </p>
          </div>
          <div className="hero-enter [--hero-delay:180ms]">
            <HeroPlayground />
          </div>
        </div>
        </div>
      </section>

      {/* Two workflows — pick your job, one click each. */}
      <ScrollReveal>
      <section
        aria-labelledby="workflows-heading"
        className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6"
      >
        <h2
          id="workflows-heading"
          className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
        >
          Two ways to use ChromaBrew
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-12 overflow-hidden rounded-lg" aria-hidden>
              {["#47003A", "#7C3AED", "#0EA5E9", "#10B981", "#EAB308"].map((hex) => (
                <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Create
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              From one colour to a system you can ship.
            </h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Start with a brand colour and get scales, accessible
              combinations, semantic tokens, light and dark themes, and code
              exports. Open any{" "}
              <Link
                href="/tools/color-palette-generator"
                className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
              >
                palette
              </Link>{" "}
              in the generator to continue.
            </p>
            <div className="mt-5">
              <LinkButton href="/design-system" variant="secondary">
                Explore the generator
              </LinkButton>
            </div>
          </article>
          <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-12 items-center gap-2 overflow-hidden rounded-lg bg-zinc-950 px-4" aria-hidden>
              <span className="rounded bg-white/10 px-2 py-1 font-mono text-[11px] text-zinc-300">
                #777 on #fff → 4.48:1
              </span>
              <span className="rounded bg-emerald-400/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                AA pass
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Audit
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              See what is failing on a page you already shipped.
            </h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Inspect a public website, discover measured design and
              accessibility issues, and get actionable recommendations. Free,
              no account needed to run it.
            </p>
            <div className="mt-5">
              <LinkButton href="/audit" variant="secondary">
                Explore website audit
              </LinkButton>
            </div>
          </article>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal>
        <AuditSection />
      </ScrollReveal>

      {/* Capabilities — what the generator guarantees, stated once. */}
      <ScrollReveal>
      <section
        aria-labelledby="capabilities-heading"
        className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6"
      >
        <h2
          id="capabilities-heading"
          className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Design-system capabilities, built in
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          What the{" "}
          <Link
            href="/design-system"
            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          >
            design system generator
          </Link>{" "}
          produces from your color — measured, themed and exportable.
        </p>
        <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {CAPABILITIES.map((feature) => (
            <div key={feature.title}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>
      </ScrollReveal>

      {/* Popular tools — grouped by intent, full directory on /tools. */}
      <ScrollReveal>
      <section
        aria-labelledby="tools-heading"
        className="border-t border-zinc-200 bg-zinc-50 py-14 dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <h2
            id="tools-heading"
            className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Popular free tools
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Focused tools for each step — or{" "}
            <Link
              href="/tools"
              className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
            >
              browse all free tools
            </Link>
            .
          </p>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {TOOL_GROUPS.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {group.label}
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {group.tools.map((tool) => (
                    <li key={tool.href}>
                      <Link
                        href={tool.href}
                        className="text-sm font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                      >
                        {tool.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* Pro — discoverable, not dominant. Free stays the primary path. */}
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
          saving, every export adapter, and AI — verified against the live
          plans below.
        </p>
        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <ScrollReveal className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {PLANS.free.name} · {PLANS.free.price}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {PLANS.free.description}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Full generator + WCAG checks</li>
              <li>CSS, JSON, Tailwind, shadcn exports</li>
              <li>Standalone color tools</li>
            </ul>
            <LinkButton href="/design-system" variant="secondary" className="mt-6 w-full">
              Get started
            </LinkButton>
          </ScrollReveal>
          <ScrollReveal delay={90} className="rounded-2xl border-2 border-zinc-900 bg-white p-6 dark:border-zinc-100 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {PLANS.pro.name} · {PLANS.pro.price}/{PLANS.pro.period}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {PLANS.pro.description}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Unlimited project saving + version history</li>
              <li>All export adapters + team sharing</li>
              <li>AI features, included as they ship</li>
            </ul>
            <LinkButton href="/pricing" variant="primary" className="mt-6 w-full">
              See Pro plans
            </LinkButton>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA — both journeys once more, matching the hero. */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        <ScrollReveal className="rounded-2xl bg-zinc-900 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Start with one color — or fix the site you already shipped.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-300">
            Generate a palette, tokens, light and dark themes, and
            production-ready CSS from a single HEX — or run a free audit on a
            live URL. Free, no account required.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            <LinkButton href="/design-system" variant="primary">
              Generate a design system
            </LinkButton>
            <LinkButton
              href="/audit"
              variant="secondary"
              className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 hover:text-white dark:border-zinc-700 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Audit a website
            </LinkButton>
          </div>
        </ScrollReveal>
      </section>

      {/* FAQ — kept for search, now including Pro. */}
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
