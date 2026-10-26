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
    n: "01",
    tag: "Seed",
    title: "Seed your colors",
    body: "Start from one primary color and optionally add secondary and accent colors. Randomize, paste a HEX, or start from a real brand color.",
  },
  {
    n: "02",
    tag: "Refine",
    title: "Refine the system",
    body: "Adjust the scale, palette strategy and size, radius, type ratio, and dark-theme background. Live previews update as you go, and the accessibility report grades every pair.",
  },
  {
    n: "03",
    tag: "Ship",
    title: "Export and ship",
    body: "Copy tokens straight into your codebase in the format your stack expects, or share the URL so teammates open the same system.",
  },
] as const;

/** Real scale produced by the generator for #6d28d9 — shown as evidence, not decoration. */
const SCALE_STRIP = [
  "#f7f6ff",
  "#edeaff",
  "#dfd9ff",
  "#cdc3ff",
  "#b5a2ff",
  "#9f7fff",
  "#8c56ff",
  "#6d28d9",
  "#5e1dbe",
  "#49079a",
  "#2d0066",
] as const;

const HARMONY_DOTS = ["#6d28d9", "#004be4", "#9900ab", "#276cff", "#864cf9"] as const;

const EXPORT_FORMATS = [
  "CSS variables",
  "JSON",
  "Tailwind CSS",
  "Bootstrap",
  "shadcn/ui",
  "MUI",
  "Ant Design",
  "Chakra",
  "React Native",
  "Flutter",
  "iOS Swift",
  "Android",
  "Figma",
  "W3C tokens",
  "Penpot",
] as const;

const RELATED_TOOLS = [
  { href: "/tools/color-palette-generator", label: "Color palette generator", blurb: "Six harmony strategies from one color." },
  { href: "/tools/tailwind-color-generator", label: "Tailwind color generator", blurb: "Turn a color into a Tailwind CSS theme." },
  { href: "/tools/shadcn-theme-generator", label: "shadcn/ui theme generator", blurb: "Generate shadcn/ui CSS variables from a color." },
  { href: "/tools/design-token-generator", label: "Design token generator", blurb: "W3C-compatible tokens from any color." },
  { href: "/tools/contrast-checker", label: "WCAG contrast checker", blurb: "Grade any two colors against WCAG." },
  { href: "/tools/dark-mode-generator", label: "Dark mode generator", blurb: "A dark theme with real contrast, not just inverted." },
] as const;

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 8h11M9.5 4.5 13 8l-3.5 3.5" />
    </svg>
  );
}

export function DesignSystemContent() {
  return (
    <section
      aria-labelledby="generator-about"
      className="relative w-full overflow-hidden border-t border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-white px-4 pb-24 pt-16 sm:px-6 sm:pt-20 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950"
    >
      {/* Ambient depth: one soft radial wash + film grain, both non-interactive. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-950/40" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.035] dark:opacity-[0.05]">
          <filter id="cb-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          </filter>
          <rect width="100%" height="100%" filter="url(#cb-grain)" />
        </svg>
      </div>

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

      <div className="relative mx-auto w-full max-w-7xl">
        {/* ---- Intro ---------------------------------------------------- */}
        <div className="max-w-[62ch]">
          <p className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Free generator · No sign-up · Runs in your browser
          </p>
          <h2
            id="generator-about"
            className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
          >
            From one color to a working design system
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            ChromaBrew builds every color decision your interface needs from a
            single seed color: a perceptual tonal scale, a harmony palette,
            semantic tokens, and matched light and dark themes. Everything runs
            in your browser — nothing is uploaded — and there is no account
            required.
          </p>
        </div>

        {/* ---- How it works: sticky intro + stepped rows ----------------- */}
        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                How it works
              </p>
              <p className="mt-3 max-w-[38ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Three moves, each one visible the moment you make it. The strip
                below is a real scale the generator computed — not a mockup.
              </p>
              <div
                aria-hidden
                className="mt-5 flex h-9 overflow-hidden rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-800"
              >
                {SCALE_STRIP.map((hex) => (
                  <span key={hex} className="h-full flex-1" style={{ backgroundColor: hex }} />
                ))}
              </div>
              <p className="mt-2 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                50 → 950 · #6d28d9 · computed in OKLCH
              </p>
            </div>
          </div>

          <ol className="lg:col-span-8">
            {STEPS.map((step, i) => (
              <li
                key={step.n}
                className={`grid grid-cols-[auto_1fr] gap-5 py-8 sm:gap-8 ${
                  i > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
                } ${i === 0 ? "pt-0 lg:pt-1" : ""}`}
              >
                <span
                  aria-hidden
                  className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-zinc-200 sm:text-5xl dark:text-zinc-800"
                >
                  {step.n}
                </span>
                <div>
                  <p className="inline-block rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300">
                    {step.tag}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-[58ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {step.body}
                  </p>
                  {i === 0 && (
                    <div aria-hidden className="mt-4 flex items-center gap-2">
                      {HARMONY_DOTS.map((hex) => (
                        <span
                          key={hex}
                          className="h-7 w-7 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">
                        analogous harmony from the same seed
                      </span>
                    </div>
                  )}
                  {i === 2 && (
                    <div aria-hidden className="mt-4 flex flex-wrap gap-1.5">
                      {["CSS", "Tailwind", "shadcn/ui", "JSON", "W3C", ".zip"].map((f) => (
                        <span
                          key={f}
                          className="rounded-md bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ---- What you get: bento --------------------------------------- */}
        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                What you get
              </p>
              <h3 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                A system, not a swatch pack
              </h3>
            </div>
            <p className="max-w-[42ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Every tile below is generated from the same seed at the same
              time — scale, palette, tokens and themes can never drift apart.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-6">
            {/* Tonal scale — wide tile */}
            <article className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(109,40,217,0.35)] sm:col-span-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Eleven-step tonal scale
              </h4>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
                50–950 computed in OKLCH, so steps look evenly spaced instead
                of clumping in the middle.
              </p>
              <div aria-hidden className="mt-4 flex h-12 overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                {SCALE_STRIP.map((hex) => (
                  <span key={hex} className="h-full flex-1" style={{ backgroundColor: hex }} />
                ))}
              </div>
            </article>

            {/* Harmony palette */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.4)] sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Harmony palette
              </h4>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
                Complementary, analogous, triadic and more.
              </p>
              <div aria-hidden className="mt-4 flex items-center gap-1.5">
                {HARMONY_DOTS.map((hex) => (
                  <span
                    key={hex}
                    className="h-9 flex-1 rounded-lg ring-1 ring-black/10 first:rounded-l-xl last:rounded-r-xl dark:ring-white/15"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </article>

            {/* Semantic tokens */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.4)] sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Semantic tokens
              </h4>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
                Named for the job, not the value.
              </p>
              <div aria-hidden className="mt-4 space-y-1.5 font-mono text-[11px]">
                <p className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  --primary: #6d28d9
                </p>
                <p className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  --primary-hover: #6311cb
                </p>
              </div>
            </article>

            {/* Light + dark */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.4)] sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Light and dark together
              </h4>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
                Generated as siblings — never hand-inverted.
              </p>
              <div aria-hidden className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-700">
                <div className="bg-[#fdfcff] p-3">
                  <div className="h-2 w-3/4 rounded-full bg-[#13101e]" />
                  <div className="mt-1.5 h-2 w-1/2 rounded-full bg-[#6d28d9]" />
                </div>
                <div className="bg-[#0b0a0f] p-3">
                  <div className="h-2 w-3/4 rounded-full bg-[#edebf6]" />
                  <div className="mt-1.5 h-2 w-1/2 rounded-full bg-[#8c56ff]" />
                </div>
              </div>
            </article>

            {/* Previews */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.4)] sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Live previews
              </h4>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
                SaaS, marketing, ecommerce and mobile.
              </p>
              <div aria-hidden className="mt-4 rounded-xl border border-zinc-200 p-2.5 dark:border-zinc-700">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                </div>
                <div className="mt-2 h-2 w-2/3 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="mt-1.5 flex gap-1.5">
                  <span className="h-4 w-12 rounded-md bg-[#6d28d9]" />
                  <span className="h-4 w-12 rounded-md border border-zinc-300 dark:border-zinc-600" />
                </div>
              </div>
            </article>

            {/* Contrast report — wide */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.4)] sm:col-span-3 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                WCAG report for every pair
              </h4>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
                Light and dark graded against AA and AAA — with one-click fixes
                where a pair fails.
              </p>
              <dl className="mt-4 space-y-1.5 text-[13px]">
                <div className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
                  <dt className="text-zinc-600 dark:text-zinc-400">Body / background</dt>
                  <dd className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    18.33:1 AA
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
                  <dt className="text-zinc-600 dark:text-zinc-400">Primary button</dt>
                  <dd className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    7.10:1 AA
                  </dd>
                </div>
              </dl>
            </article>

            {/* AI suggestions */}
            <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.4)] sm:col-span-3 dark:border-zinc-800 dark:bg-zinc-900">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                AI palette suggestions
              </h4>
              <p className="mt-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
                Optional starting points you can apply — or ignore entirely.
              </p>
              <div aria-hidden className="mt-4 flex gap-1.5">
                {["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"].map((hex) => (
                  <span
                    key={hex}
                    className="h-9 flex-1 rounded-lg ring-1 ring-black/10 dark:ring-white/15"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </article>
          </div>

          <p className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/60 px-5 py-4 text-center text-[13px] leading-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
            No account, no upload, no tracking in the tool itself — an account
            is only ever used to save and revisit your own projects.
          </p>
        </div>

        {/* ---- Export ------------------------------------------------------ */}
        <div className="mt-20 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 p-8 sm:p-12 dark:border-zinc-700 dark:bg-black">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[52ch]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Export where you work
              </p>
              <h3 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                One system, every dialect your stack speaks
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Copy CSS variables or JSON for any codebase, or take a
                framework theme, native tokens, or design-tool variables. One
                ZIP contains every format for your team.
              </p>
            </div>
            <div aria-hidden className="hidden gap-1.5 md:flex">
              {SCALE_STRIP.slice(4, 9).map((hex) => (
                <span
                  key={hex}
                  className="h-10 w-6 rounded-md ring-1 ring-white/20"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {EXPORT_FORMATS.map((format) => (
              <li
                key={format}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs text-zinc-200 transition-colors hover:border-white/30 hover:bg-white/10"
              >
                {format}
              </li>
            ))}
            <li className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-900">
              + full .zip
            </li>
          </ul>
        </div>

        {/* ---- Related tools ----------------------------------------------- */}
        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                Keep exploring
              </p>
              <h3 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                Related free tools
              </h3>
            </div>
            <Link
              href="/tools"
              className="group flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Browse all free color tools
              <ArrowIcon />
            </Link>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED_TOOLS.map((tool, i) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="group flex h-full items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
                >
                  <span>
                    <span aria-hidden className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1 block text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {tool.label}
                    </span>
                    <span className="mt-1 block text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
                      {tool.blurb}
                    </span>
                  </span>
                  <span className="mt-1 text-zinc-400 transition-colors group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-100">
                    <ArrowIcon />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- FAQ ---------------------------------------------------------- */}
        <div className="mt-20 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                FAQ
              </p>
              <h3 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                Questions, answered
              </h3>
              <p className="mt-3 max-w-[42ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Prefer a single-purpose tool, or want the full walkthrough?
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                <li>
                  <Link
                    href="/tools"
                    className="group flex items-center gap-1.5 font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                  >
                    Full list of free color tools
                    <ArrowIcon />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/brand-palettes"
                    className="group flex items-center gap-1.5 font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                  >
                    Start from a real brand color
                    <ArrowIcon />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog/one-color-to-a-working-design-system"
                    className="group flex items-center gap-1.5 font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                  >
                    How to build a design system from one color
                    <ArrowIcon />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <dl className="lg:col-span-8">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className={`grid grid-cols-[auto_1fr] gap-5 py-7 sm:gap-7 ${
                  i > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
                } ${i === 0 ? "pt-0 lg:pt-1" : ""}`}
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
                  <dd className="mt-2 max-w-[62ch] text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {faq.a}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
