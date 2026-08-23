import type { Metadata } from "next";
import Link from "next/link";
import { HeroColourForm } from "@/components/home/hero-form";
import { buildDesignSystem } from "@/lib/design-system";
import { DEFAULT_CONFIG } from "@/lib/design-system/share";
import { PreviewFrame } from "@/components/generator/previews/preview-frame";
import { SaasPreview } from "@/components/generator/previews/saas-preview";
import { LinkButton } from "@/components/ui/primitives";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Colorsmith — Turn one colour into an entire design system",
  description:
    "Generate accessible palettes, semantic tokens, light and dark themes, and production-ready code from a single colour. Free, no account required.",
  alternates: { canonical: "/" },
};

const PIPELINE = [
  ["One colour", "HEX, RGB, HSL or a picked swatch"],
  ["Colour scale", "Perceptual 50–950 in OKLCH"],
  ["Semantic tokens", "background → primary → status roles"],
  ["Light + dark", "Independent accessible themes"],
  ["WCAG checks", "AA / AAA measured, never assumed"],
  ["Production code", "CSS, Tailwind v4, shadcn/ui, JSON"],
] as const;

const FEATURES = [
  {
    title: "Perceptual colour engine",
    body: "Scales are generated in OKLCH so every step is evenly spaced to the eye — not arbitrary white/black mixes. Your brand hue survives end to end.",
  },
  {
    title: "Semantic design tokens",
    body: "Stop shipping raw hex values. Get background, surface, primary, border and status roles that map directly onto real component decisions.",
  },
  {
    title: "Accessibility built in",
    body: "Every key pairing is measured against WCAG 2.x thresholds for normal and large text. Failing pairs offer a nearest-accessible fix in one click.",
  },
  {
    title: "Thoughtful dark mode",
    body: "Dark themes are constructed independently — lighter primaries, tinted neutrals, verified foregrounds — never a mechanical inversion.",
  },
  {
    title: "Live interface previews",
    body: "Judge colours where they matter: a SaaS dashboard, marketing page, storefront and mobile app all render with your tokens instantly.",
  },
  {
    title: "Exports developers can ship",
    body: "Copy CSS variables, DTCG-style JSON, Tailwind CSS v4 theme output or current-convention shadcn/ui variables straight into your codebase.",
  },
];

export default function HomePage() {
  const demoSystem = buildDesignSystem(DEFAULT_CONFIG);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Free design system generator
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              Turn one colour into an entire design system.
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Generate accessible palettes, semantic tokens, light and dark
              themes, and production-ready code in seconds.
            </p>
          </div>
          <div className="mt-8">
            <HeroColourForm />
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            No account. No upload. Everything runs in your browser —{" "}
            <Link href="/tools" className="font-medium text-zinc-700 dark:text-zinc-300 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
              or explore the individual tools
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Pipeline */}
      <section aria-label="How it works" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <ol className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-6">
          {PIPELINE.map(([title, body], i) => (
            <li key={title} className="relative">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Step {i + 1}
              </span>
              <h2 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Live demo */}
      <section aria-labelledby="demo-heading" className="bg-zinc-50 dark:bg-zinc-900/60 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="demo-heading" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Real interfaces, not swatches
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                This dashboard is rendered live from the default example colour
                #47003A. Open the generator to change it and watch every
                surface, badge and button follow.
              </p>
            </div>
            <LinkButton href="/design-system?primary=47003A" variant="secondary">
              Open in generator
            </LinkButton>
          </div>
          <PreviewFrame system={demoSystem} mode="light" className="shadow-md">
            <SaasPreview system={demoSystem} />
          </PreviewFrame>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Built like part of your team&apos;s toolchain
        </h2>
        <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Free colour &amp; token tools
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            The same engines behind the generator, available as focused
            single-purpose tools.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="group block h-full rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
                >
                  <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline group-hover:underline-offset-4">
                    {tool.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    {tool.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-zinc-900 px-6 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            One creative decision. Something you can ship.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-300">
            Pick a starting colour and walk away with scales, tokens, themes,
            accessibility results and framework-ready code.
          </p>
          <div className="mt-6 flex justify-center">
            <HeroColourForm idPrefix="cta" />
          </div>
        </div>
      </section>
    </>
  );
}
