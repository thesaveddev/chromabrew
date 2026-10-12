import type { Metadata } from "next";
import Link from "next/link";
import { HeroColourForm } from "@/components/home/hero-form";
import { buildDesignSystem } from "@/lib/design-system";
import { DEFAULT_CONFIG } from "@/lib/design-system/share";
import { PreviewFrame } from "@/components/generator/previews/preview-frame";
import { SaasPreview } from "@/components/generator/previews/saas-preview";
import { LinkButton } from "@/components/ui/primitives";
import { TOOLS } from "@/lib/tools";
import { siteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/site/json-ld";
import { defaultOgImage } from "@/lib/og";
import { ProductHuntBadge } from "@/components/site/product-hunt-badge";

/**
 * The home page positions the whole toolkit, not just the one-color pipeline.
 *
 * Chromabrew is a color toolkit — palette generation, contrast checking, image
 * color extraction, design tokens and CSS exports. Describing it only as a
 * single-color-to-design-system generator hid every tool that does not sit on
 * that one path, so the title, description and h1 now name the breadth and the
 * pipeline reads as the example rather than the whole product.
 */
export const metadata: Metadata = {
  title: "ChromaBrew — Free Color Tools & Design System Generator",
  description:
    "Free browser-based color toolkit: palette generator, WCAG contrast checker, image color extraction, design tokens and Tailwind or shadcn theme exports.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ChromaBrew — Free Color Tools & Design System Generator",
    description:
      "Free color tools plus a design system generator: palettes, WCAG contrast checks, image color extraction, design tokens, and Tailwind or shadcn exports.",
    url: "/",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChromaBrew — Free Color Tools & Design System Generator",
    description:
      "Free color tools and a design system generator for palettes, contrast checks, image extraction and token exports. No account required.",
    images: [defaultOgImage.url],
  },
};

const PIPELINE = [
  ["One color", "HEX, RGB, HSL or a picked swatch"],
  ["Color scale", "Perceptual 50–950 in OKLCH"],
  ["Semantic tokens", "background → primary → status roles"],
  ["Light + dark", "Independent accessible themes"],
  ["WCAG checks", "AA / AAA measured, never assumed"],
  ["Production code", "CSS, Tailwind v4, shadcn/ui, JSON"],
] as const;

const FEATURES = [
  {
    title: "Perceptual color engine",
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
    body: "Judge colors where they matter: a SaaS dashboard, marketing page, storefront and mobile app all render with your tokens instantly.",
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

      {/* Hero */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Free browser-based color toolkit
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              Free color tools and a design system generator.
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Generate accessible palettes, semantic tokens, light and dark
              themes, and production-ready code in seconds.
            </p>
          </div>
          <div className="mt-8">
            <HeroColourForm />
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No account. No upload. Everything runs in your browser —{" "}
            <Link href="/tools" className="font-medium text-zinc-700 dark:text-zinc-300 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
              or explore the individual tools
            </Link>
            .
          </p>
          <div className="mt-6">
            <ProductHuntBadge />
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section aria-label="How it works" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <ol className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-6">
          {PIPELINE.map(([title, body], i) => (
            <li key={title} className="relative">
              {/* zinc-400 on white measures 2.62:1 at 11px — below AA for body text. */}
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
                This dashboard is rendered live from the default example color
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

      {/* Use cases — keyword-rich copy for search engines */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          What you can do with ChromaBrew
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Generate a color palette from one color</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Start with any HEX, RGB or HSL value and get complementary, analogous, triadic, split-complementary, monochromatic or tetradic palettes — all computed in OKLCH for perceptual consistency.
            </p>
            <Link href="/tools/color-palette-generator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the color palette generator
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Extract colors from an image</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Upload any photo and instantly get its dominant colors as a clean palette. Perfect for matching designs to photography or building brand palettes from reference images.
            </p>
            <Link href="/tools/image-color-extractor" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the image color extractor
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Check color contrast for accessibility</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Verify any text/background pair against WCAG 2.x AA and AAA thresholds. When a combination fails, get a one-click fix that adjusts the color to meet the required ratio.
            </p>
            <Link href="/tools/contrast-checker" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the contrast checker
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Build Tailwind CSS color themes</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Generate Tailwind CSS v4 @theme color variables from a single brand color. Get a full 50–950 perceptual scale ready to paste into your project.
            </p>
            <Link href="/tools/tailwind-color-generator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the Tailwind color generator
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create accessible dark themes</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Turn any brand color into a proper dark mode with semantic tokens — never a mechanical inversion. Includes verified foreground/background pairs and WCAG contrast checks.
            </p>
            <Link href="/tools/dark-mode-generator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the dark mode generator
            </Link>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Simulate color blindness</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              See how your colors appear to people with protanopia, deuteranopia, tritanopia and achromatopsia. Build designs that work for the 8% of men with color vision deficiency.
            </p>
            <Link href="/tools/color-blindness-simulator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the color blindness simulator
            </Link>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Free color &amp; design token tools
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            The same engines behind the color palette generator, available as focused single-purpose tools.
            Generate color palettes, extract colors from images, check WCAG contrast ratios, convert color formats, and build CSS gradients — all free, no sign-up required.
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
                  <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
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
            Start with one color. Walk away with a design system.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-300">
            Generate a complete color palette, semantic tokens, light and dark themes, and production-ready CSS — from a single HEX value. Free, no account required.
          </p>
          <div className="mt-6 flex justify-center">
            {/* The card is bg-zinc-900 in both themes, so the form needs its
                dark-surface text colours here rather than the hero's. */}
            <HeroColourForm idPrefix="cta" tone="dark" />
          </div>
        </div>
      </section>
    </>
  );
}
