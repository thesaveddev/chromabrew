import Link from "next/link";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/site-url";

const FAQS = [
  {
    q: "Is the design system generator free?",
    a: "Yes — completely. The full generator, every color control, WCAG accessibility checks and all core exports are free with no account required. An account is optional and only used if you want to save and revisit your projects.",
  },
  {
    q: "What does ChromaBrew generate from a single color?",
    a: "One primary color produces an eleven-step tonal scale (50-950), a harmony palette, semantic tokens, and matched light and dark themes — plus radius, typography scale and dark-background controls you can tune live.",
  },
  {
    q: "How does the share link work?",
    a: "The Share link button encodes your entire configuration in the URL. Anyone who opens the link sees the exact same design system — no account, no upload, no server storage involved.",
  },
  {
    q: "Are the contrast checks accurate?",
    a: "Every foreground/background pair is graded against WCAG contrast requirements in both light and dark themes. Where a pair fails, the Fix contrast control applies a compliant adjustment instantly.",
  },
  {
    q: "Which export formats are supported?",
    a: "Export as plain CSS variables, JSON, Tailwind CSS, Bootstrap, shadcn/ui, MUI, Ant Design or Chakra themes; React Native, Flutter, iOS (Swift) and Android tokens; Figma variables, W3C design tokens, Penpot, or a ZIP with every format.",
  },
] as const;

const STEPS = [
  {
    title: "1. Seed your colors",
    body: "Start from one primary color and optionally add secondary and accent colors. Randomize, paste a HEX, or start from a real brand color.",
  },
  {
    title: "2. Refine the system",
    body: "Adjust the scale, palette strategy and size, radius, type ratio, and dark-theme background. Live previews update as you go, and the accessibility report grades every pair.",
  },
  {
    title: "3. Export and ship",
    body: "Copy tokens straight into your codebase in the format your stack expects, or share the URL so teammates open the same system.",
  },
] as const;

const RELATED_TOOLS = [
  { href: "/tools/color-palette-generator", label: "Color palette generator", blurb: "Six harmony strategies from one color." },
  { href: "/tools/tailwind-color-generator", label: "Tailwind color generator", blurb: "Turn a color into a Tailwind CSS theme." },
  { href: "/tools/shadcn-theme-generator", label: "shadcn/ui theme generator", blurb: "Generate shadcn/ui CSS variables from a color." },
  { href: "/tools/design-token-generator", label: "Design token generator", blurb: "W3C-compatible tokens from any color." },
  { href: "/tools/contrast-checker", label: "WCAG contrast checker", blurb: "Grade any two colors against WCAG." },
  { href: "/tools/dark-mode-generator", label: "Dark mode generator", blurb: "A dark theme with real contrast, not just inverted." },
] as const;

export function DesignSystemContent() {
  return (
    <section
      aria-labelledby="generator-about"
      className="mx-auto w-full max-w-7xl border-t border-zinc-200 px-4 pb-16 pt-12 sm:px-6 dark:border-zinc-800"
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "ChromaBrew — Design System Generator",
          url: `${siteUrl}/design-system`,
          description:
            "Free design system generator: turn one color into an accessible palette, semantic tokens, light and dark themes, WCAG checks and production-ready exports.",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any (web browser)",
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

      <h2 id="generator-about" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        From one color to a working design system
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        ChromaBrew builds every color decision your interface needs from a single
        seed color: a perceptual tonal scale, a harmony palette, semantic tokens,
        and matched light and dark themes. Everything runs in your browser —
        nothing is uploaded — and there is no account required.
      </p>

      <ol className="mt-8 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.title} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
            <p className="mt-1.5 text-xs leading-5 text-zinc-500">{step.body}</p>
          </li>
        ))}
      </ol>

      <h3 className="mt-10 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        What you get
      </h3>
      <ul className="mt-3 grid max-w-3xl gap-2 sm:grid-cols-2">
        {[
          "Eleven-step tonal scale (50-950) computed in OKLCH for perceptually even steps",
          "Harmony palette: complementary, analogous, triadic, split-complementary and more",
          "Semantic tokens mapped to real interface roles",
          "Light and dark themes generated together, never hand-inverted",
          "Live previews for SaaS, marketing, ecommerce and mobile layouts",
          "WCAG contrast report for every color pair, with one-click fixes",
          "AI palette suggestions you can apply or ignore",
          "Optional account only to save projects — the tool itself never asks you to sign up",
        ].map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
            {item}
          </li>
        ))}
      </ul>

      <h3 className="mt-10 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Export where you work
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        Copy CSS variables or JSON for any codebase; generate Tailwind CSS,
        Bootstrap, shadcn/ui, MUI, Ant Design or Chakra themes; take tokens to
        React Native, Flutter, iOS and Android; or push variables straight into
        Figma, Penpot and W3C-compatible token files. One ZIP contains every
        format for your team.
      </p>

      <h3 className="mt-10 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Related free tools
      </h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RELATED_TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="group block h-full rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <span className="block text-sm font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-4 dark:text-zinc-100">
                {tool.label}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">{tool.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Prefer a single-purpose tool? Browse the{" "}
        <Link href="/tools" className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100">
          full list of free color tools
        </Link>
        , start from{" "}
        <Link
          href="/tools/brand-palettes"
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
        >
          a real brand color
        </Link>
        , or read{" "}
        <Link
          href="/blog/one-color-to-a-working-design-system"
          className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
        >
          how to build a design system from one color
        </Link>{" "}
        step by step.
      </p>

      <h3 className="mt-10 text-sm font-semibold text-zinc-900 dark:text-zinc-100">FAQ</h3>
      <dl className="mt-4 max-w-3xl divide-y divide-zinc-200 dark:divide-zinc-800">
        {FAQS.map((faq) => (
          <div key={faq.q} className="py-4 first:pt-0">
            <dt className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{faq.q}</dt>
            <dd className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
