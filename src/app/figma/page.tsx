import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/site/json-ld";
import { LinkButton } from "@/components/ui/primitives";
import { siteUrl } from "@/lib/site-url";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Figma Color Palette Generator & Design System Plugin",
  description:
    "Free Figma color palette generator and design system plugin: turn one color into native Figma variables with Light & Dark modes, paste Tokens Studio JSON in seconds, and copy Dev Mode-ready CSS and Tailwind code. Free, no sign-up.",
  keywords: [
    "figma color palette generator",
    "figma design system generator",
    "figma variables",
    "figma design tokens",
    "figma tokens studio",
    "figma plugin",
    "figma dark mode variables",
    "export to figma",
    "figma to code",
    "figma css export",
    "figma tailwind",
  ],
  alternates: { canonical: "/figma" },
  openGraph: {
    title: "Figma Variables From One Color · ChromaBrew",
    description:
      "Free Figma plugin creates native variables with Light & Dark modes. Tokens Studio export pastes in seconds. Dev Mode-ready CSS, Tailwind and shadcn code. Free, no sign-up.",
    url: "/figma",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Figma Variables From One Color · ChromaBrew",
    description:
      "Native Figma variables, Tokens Studio export, and Dev Mode-ready code from one color. Free, no sign-up.",
    images: [defaultOgImage.url],
  },
};

const FAQS = [
  {
    q: "How do I export from ChromaBrew to Figma?",
    a: "Two ways. Fastest: use the free ChromaBrew Figma plugin — enter a hex (or select a shape and let the plugin read its fill) and press Generate to create native Figma variables with Light and Dark modes. Alternative: open the generator's Export panel, pick Figma Tokens, copy the JSON, and paste it into the Tokens Studio plugin in Figma.",
  },
  {
    q: "How do I install the ChromaBrew plugin into Figma?",
    a: "In Figma desktop, go to Plugins → Development → Import plugin from manifest and select the figma-plugin/manifest.json file from the ChromaBrew repository. A Figma Community listing is on the way; until then the development import gives you the full v1 plugin with one local variable collection per color.",
  },
  {
    q: "What Figma variables does it create?",
    a: "One collection named after your color (for example “ChromaBrew #47003A”) with 49 variables: scale/50–950 (the 11-step perceptual ramp), palette/* (harmony swatches by role), and semantic/* (background, surface, foreground, primary, success, warning, danger and every other token) with different Light and Dark mode values. Re-running with the same color updates in place — no duplicates.",
  },
  {
    q: "Does it work with Tokens Studio and Figma Dev Mode?",
    a: "Yes. The Figma Tokens export is Tokens Studio JSON — paste it straight into the Tokens Studio plugin. For Dev Mode handoff, copy the same system as CSS variables, Tailwind CSS v4 @theme, or shadcn/ui tokens from the Export panel, so engineers get inspect-ready code that matches the Figma variables.",
  },
  {
    q: "Is the Figma export free?",
    a: "Yes — the Figma Tokens export and the Figma plugin are both free with no account required. The generator runs in your browser; the plugin runs offline inside Figma and transmits nothing.",
  },
  {
    q: "Can I go from Figma back to code?",
    a: "Yes — that is the Figma-to-code loop this page exists for. Design in Figma with the variables, then open the same seed color in the ChromaBrew generator and copy production CSS, Tailwind, or shadcn/ui code. Variables and code derive from the same engine, so they stay in sync instead of drifting.",
  },
] as const;

const INSTALL_STEPS = [
  "Open Figma desktop and choose Plugins → Development → Import plugin from manifest.",
  "Select figma-plugin/manifest.json from your ChromaBrew checkout.",
  "Open the ChromaBrew plugin, enter a hex — or select a shape first and the input prefills from its solid fill.",
  "Press Generate: one “ChromaBrew #…” collection appears with Light and Dark modes and 49 variables.",
] as const;

const TOKEN_STEPS = [
  "In the generator, open the Export panel and pick Figma Tokens.",
  "Copy the JSON (or download figma-tokens.json).",
  "In Figma, open Tokens Studio → import from JSON → paste. Your scale, palette and semantic tokens land as Tokens Studio sets.",
] as const;

export default function FigmaPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "ChromaBrew for Figma — Color Palette Generator & Design System Plugin",
          url: `${siteUrl}/figma`,
          description: metadata.description,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any (web browser, Figma)",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
            { "@type": "ListItem", position: 2, name: "Figma", item: `${siteUrl}/figma` },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Install the ChromaBrew Figma plugin",
          step: INSTALL_STEPS.map((text) => ({ "@type": "HowToStep", text })),
        }}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="hover:text-zinc-800 dark:text-zinc-200 dark:hover:text-zinc-200">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-zinc-700 dark:text-zinc-300">Figma</span>
      </nav>

      <header className="mt-4 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Figma plugin · Figma Tokens · Figma to code
        </p>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          From one color to Figma variables.
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          ChromaBrew is a Figma color palette generator and design system generator: turn any brand
          color into an accessible 50–950 scale, harmony palette, and semantic design tokens — then
          bring them into Figma as native variables, Tokens Studio sets, or Dev Mode-ready code.
          Free, no sign-up, runs offline inside Figma.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <LinkButton href="/design-system">Open the generator</LinkButton>
          <LinkButton href="#install" variant="secondary">
            Install into Figma
          </LinkButton>
          <Link
            href="#export"
            className="arrow-nudge text-sm font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Export to Figma <span aria-hidden>→</span>
          </Link>
        </div>
      </header>

      {/* Three ways in — pick your Figma workflow. */}
      <section aria-labelledby="figma-ways" className="mt-12">
        <h2
          id="figma-ways"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
        >
          Three ways into Figma
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Figma plugin → native variables",
              body: "Install into Figma once. Enter a hex or select a shape — Generate creates scale, palette and semantic variables with Light & Dark modes. Offline, free, updates in place.",
              href: "#install",
              cta: "Install into Figma",
            },
            {
              title: "Tokens Studio → paste JSON",
              body: "Prefer Tokens Studio? The Export panel's Figma Tokens JSON pastes straight in: scale, palette and semantic tokens as importable sets.",
              href: "#export",
              cta: "Export to Figma",
            },
            {
              title: "Dev Mode → copy code",
              body: "Figma to code without drift: copy the same system as CSS variables, Tailwind v4 @theme, or shadcn/ui tokens for inspect-ready handoff.",
              href: "#code",
              cta: "Export code",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {card.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {card.body}
              </p>
              <Link
                href={card.href}
                className="arrow-nudge mt-4 text-sm font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                {card.cta} <span aria-hidden>→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Install into Figma. */}
      <section aria-labelledby="install" className="mt-14 scroll-mt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Install into Figma
        </p>
        <h2
          id="install"
          className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
        >
          The free Figma plugin: a hex in, variables out.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          The plugin runs ChromaBrew&apos;s real design-system engine locally inside Figma — no
          network access, your colors never leave the file. One collection per color, 49 variables,
          Light and Dark modes, idempotent re-runs.
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {INSTALL_STEPS.map((step, i) => (
            <li
              key={step}
              className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span
                aria-hidden
                className="font-mono text-sm font-semibold tabular-nums text-zinc-400 dark:text-zinc-500"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Developer import today; a one-click Figma Community listing is in progress. The plugin
          manifest lives at <code className="font-mono">figma-plugin/manifest.json</code> in the
          repository — import it via Plugins → Development → Import plugin from manifest.
        </p>
      </section>

      {/* Export to Figma (Tokens Studio). */}
      <section aria-labelledby="export" className="mt-14 scroll-mt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Export to Figma
        </p>
        <h2
          id="export"
          className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
        >
          Paste Tokens Studio JSON in seconds.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Already living in Tokens Studio? Skip the plugin: the generator&apos;s free Figma Tokens
          export is purpose-built JSON for its import-from-JSON flow.
        </p>
        <ol className="mt-6 space-y-3">
          {TOKEN_STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden
                className="font-mono text-sm font-semibold tabular-nums text-zinc-400 dark:text-zinc-500"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <LinkButton href="/design-system">Try it in the generator</LinkButton>
        </div>
      </section>

      {/* Export code for Dev Mode. */}
      <section aria-labelledby="code" className="mt-14 scroll-mt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          Figma to code
        </p>
        <h2
          id="code"
          className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
        >
          Variables in Figma, matching code in Dev Mode.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Tokens and code derive from the same engine, so handoff never drifts. Copy CSS variables
          for any stack, a Tailwind CSS v4 <code className="font-mono">@theme</code> block, shadcn/ui
          theme tokens, or W3C DTCG JSON — free, from the same Export panel as the Figma JSON.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/design-system" variant="secondary">
            Export CSS &amp; Tailwind
          </LinkButton>
          <Link
            href="/tools"
            className="arrow-nudge text-sm font-semibold text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            Browse all free color tools <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* FAQ — the long-tail Figma queries. */}
      <section aria-labelledby="figma-faq" className="mt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          FAQ
        </p>
        <h2
          id="figma-faq"
          className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
        >
          Figma questions, answered
        </h2>
        <dl className="mt-8">
          {FAQS.map((faq, i) => (
            <div
              key={faq.q}
              className={`grid grid-cols-[auto_1fr] gap-5 py-6 sm:gap-7 ${
                i > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
              } ${i === 0 ? "pt-0" : ""}`}
            >
              <span
                aria-hidden
                className="font-mono text-sm font-semibold tabular-nums text-zinc-400 dark:text-zinc-500"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <dt className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {faq.q}
                </dt>
                <dd className="mt-2 max-w-[68ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {faq.a}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
