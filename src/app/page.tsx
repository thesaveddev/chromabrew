import type { Metadata } from "next";
import Link from "next/link";
import { AuditSection } from "@/components/home/audit-section";
import { HeroColourForm } from "@/components/home/hero-form";
import { HeroPalettes } from "@/components/home/hero-palettes";
import { PaletteRibbon } from "@/components/home/palette-ribbon";
import { ThemeMosaic } from "@/components/home/theme-mosaic";
import { GALLERY_PALETTES, PALETTE_THEMES } from "@/lib/palettes";
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
import { ScrollReveal } from "@/components/site/scroll-reveal";

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
  title: "Free Color Palette Generator & Design Tools",
  // The head keyword is the palette generator (H1 matches); the description
  // carries the toolkit breadth plus the audit for its search intent.
  description:
    "Generate color palettes instantly, browse 1000 curated palettes, check WCAG contrast, extract colors from images and ship design tokens — free, no sign-up. Plus a free website audit.",
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

      {/* Hero — the thesis is color itself: real curated palettes beside the
          pitch, every strip a door into the catalog. */}
      <section className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Free browser-based color toolkit
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              The free color palette generator.
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Create perfect palettes in seconds — then turn them into an
              accessible design system with WCAG checks, dark mode, and
              production-ready code.
            </p>
            <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {GALLERY_PALETTES.length} palettes · {PALETTE_THEMES.length} themes · {TOOLS.length} free tools — no sign-up.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <LinkButton href="/generate" variant="primary">
                Start the generator
              </LinkButton>
              <LinkButton href="/palettes" variant="secondary">
                Explore {GALLERY_PALETTES.length} palettes
              </LinkButton>
            </div>
            <div className="mt-8">
              <HeroColourForm />
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No account. No upload. Everything runs in your browser —{" "}
            <Link href="/tools" className="font-medium text-zinc-700 dark:text-zinc-300 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
              or explore the individual tools
            </Link>
            . Already have a site?{" "}
            <Link href="/audit" className="font-medium text-zinc-700 dark:text-zinc-300 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
              audit it for accessibility problems
            </Link>
            .
          </p>
          <div className="mt-6">
            <ProductHuntBadge />
          </div>
          </div>
          <HeroPalettes palettes={GALLERY_PALETTES} />
        </div>
      </section>

      <PaletteRibbon />

      {/* Tools — every color job, one click away. */}
      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Free color tools for every step
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            The same engines behind the palette generator, available as focused single-purpose tools.
            Generate color palettes, extract colors from images, check WCAG contrast ratios, convert color formats, and build CSS gradients — all free, no sign-up required.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {TOOLS.map((tool, i) => (
              <ScrollReveal key={tool.href} as="li" delay={(i % 5) * 60}>
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
              </ScrollReveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Theme mosaic — browsing starts by feeling, not by reading. */}
      <section aria-labelledby="themes-heading" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Palette gallery
            </p>              <h2 id="themes-heading" className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
                Browse {GALLERY_PALETTES.length} color palettes by mood.
              </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Every palette is hand-picked — five stops that work together —
              and every one opens directly in the design system generator.
              Pick the feeling; the hex codes follow.
            </p>
          </div>
          <LinkButton href="/palettes" variant="secondary">
            Search all palettes
          </LinkButton>
        </div>
        <ThemeMosaic />
      </section>

      {/* Instant generator band — the fastest door into making. */}
      <section aria-labelledby="generate-heading" className="bg-zinc-950 py-20 sm:py-24 dark:bg-black">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,1.15fr)] lg:gap-14 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Instant palettes
            </p>
            <h2 id="generate-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Press space. Keep the good ones.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
              Every press of the spacebar deals a fresh set of colors. Lock the
              keepers, nudge brightness and vibrance, then copy any hex or
              share the whole palette as a link — nothing to sign up for.
            </p>
            <LinkButton href="/generate" variant="primary" className="mt-7">
              Start shuffling
            </LinkButton>
          </div>

          {/* Static mock of the generator's own surface — the real one lives at /generate. */}
          <div
            aria-hidden
            className="overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl ring-1 ring-black/20"
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Instant palettes
              </span>
              <span className="ml-auto rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900">
                Shuffle 
                <kbd className="rounded bg-zinc-900/10 px-1.5 py-0.5 font-sans">space</kbd>
              </span>
              <span className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300">
                Copy link
              </span>
            </div>
            <div className="flex h-44 sm:h-56">
              {["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"].map(
                (hex, i) => (
                  <div
                    key={hex}
                    className="relative flex-1"
                    style={{ backgroundColor: hex }}
                  >
                    {i === 1 ? (
                      <span className="absolute left-2 top-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white">
                        Locked
                      </span>
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 bg-black/25 px-1 py-1.5 text-center font-mono text-[10px] text-white sm:text-[11px]">
                      {hex}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-zinc-800 px-4 py-3 text-[11px] text-zinc-400">
              <span className="tabular-nums">5 colors</span>
              <span>Brightness 0%</span>
              <span>Vibrance 100%</span>
              <span className="ml-auto flex items-center gap-1.5 text-zinc-500">
                <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 font-sans">space</kbd>
                to shuffle
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section aria-label="How it works" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <ol className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-6">
          {PIPELINE.map(([title, body], i) => (
            <ScrollReveal key={title} as="li" delay={(i % 6) * 70} className="relative">
              {/* zinc-400 on white measures 2.62:1 at 11px — below AA for body text. */}
              <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Step {i + 1}
              </span>
              <h2 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">{body}</p>
            </ScrollReveal>
          ))}
        </ol>
      </section>

      {/* Live demo */}
      <section aria-labelledby="demo-heading" className="bg-zinc-50 dark:bg-zinc-900/60 py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="demo-heading" className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Real interfaces, not swatches
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                This dashboard is rendered live from the example color
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
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Built like part of your team&apos;s toolchain
        </h2>
        <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} as="article" delay={(i % 3) * 80}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{feature.body}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* The website audit is the one capability that looks at work already
          shipped. Its section lives in its own component so its claims and
          links are asserted in a test. */}
      <AuditSection />

      {/* Use cases — keyword-rich copy for search engines */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          What you can do with ChromaBrew
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ScrollReveal delay={0} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Generate a color palette from one color</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Start with any HEX, RGB or HSL value and get complementary, analogous, triadic, split-complementary, monochromatic or tetradic palettes — all computed in OKLCH for perceptual consistency.
            </p>
            <Link href="/tools/color-palette-generator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the color palette generator
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={80} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Extract colors from an image</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Upload any photo and instantly get its dominant colors as a clean palette. Perfect for matching designs to photography or building brand palettes from reference images.
            </p>
            <Link href="/tools/image-color-extractor" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the image color extractor
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={160} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Check color contrast for accessibility</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Verify any text/background pair against WCAG 2.x AA and AAA thresholds. When a combination fails, get a one-click fix that adjusts the color to meet the required ratio.
            </p>
            <Link href="/tools/contrast-checker" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the contrast checker
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={0} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Build Tailwind CSS color themes</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Generate Tailwind CSS v4 @theme color variables from a single brand color. Get a full 50–950 perceptual scale ready to paste into your project.
            </p>
            <Link href="/tools/tailwind-color-generator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the Tailwind color generator
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={80} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Create accessible dark themes</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Turn any brand color into a proper dark mode with semantic tokens — never a mechanical inversion. Includes verified foreground/background pairs and WCAG contrast checks.
            </p>
            <Link href="/tools/dark-mode-generator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the dark mode generator
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={160} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Simulate color blindness</h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              See how your colors appear to people with protanopia, deuteranopia, tritanopia and achromatopsia. Build designs that work for the 8% of men with color vision deficiency.
            </p>
            <Link href="/tools/color-blindness-simulator" className="mt-3 inline-block text-xs font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
              Try the color blindness simulator
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ — the landing page answers head-term questions for search. */}
      <section aria-labelledby="faq-heading" className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 py-16">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is a color palette generator?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A tool that builds harmonious color combinations in one click. ChromaBrew deals a fresh five-color scheme on every spacebar press; lock the keepers and copy any hex.",
                },
              },
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
                name: "Can I use these palettes in Tailwind or CSS?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Open any palette in the design system generator and export CSS variables, Tailwind v4 themes, shadcn/ui variables, or JSON tokens.",
                },
              },
              {
                "@type": "Question",
                name: "How do I know my palette is accessible?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Run it through the contrast checker for WCAG AA/AAA grades, and the color blindness simulator to confirm every color stays distinguishable for all viewers.",
                },
              },
            ],
          }}
        />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            FAQ
          </p>
          <h2 id="faq-heading" className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Color palette questions, answered.
          </h2>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">What is a color palette generator?</dt>
              <dd className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                A tool that builds harmonious color combinations in one click. Hit space in the{" "}
                <Link href="/generate" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">palette generator</Link>{" "}
                to deal a fresh five-color scheme, lock the keepers, and copy any hex.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Is ChromaBrew really free?</dt>
              <dd className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Yes — every generator, checker, and export runs in your browser with no account and no upload. An account is only needed to save projects and revisit them later.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Can I use these palettes in Tailwind or CSS?</dt>
              <dd className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Yes. Open any palette in the{" "}
                <Link href="/design-system" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">design system generator</Link>{" "}
                and export CSS variables, Tailwind v4 themes, shadcn/ui variables, or JSON tokens.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">How do I know my palette is accessible?</dt>
              <dd className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Run it through the{" "}
                <Link href="/tools/contrast-checker" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">contrast checker</Link>{" "}
                for WCAG AA/AAA grades, and the{" "}
                <Link href="/tools/color-blindness-simulator" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">color blindness simulator</Link>{" "}
                to confirm every color stays distinguishable for all viewers.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
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
