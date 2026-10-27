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

/**
 * Compact supporting copy under the generator workspace: a short intro and
 * the FAQ. The long marketing sections (steps, bento, export panel, related
 * tools) were trimmed — the workspace above is the page.
 */
export function DesignSystemContent() {
  return (
    <section
      aria-labelledby="generator-about"
      className="relative w-full overflow-hidden border-t border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-white px-4 py-14 sm:px-8 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950"
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

      <div className="relative mx-auto w-full max-w-6xl">
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
            A perceptual tonal scale, a harmony palette, semantic tokens, and
            matched light and dark themes — everything runs in your browser,
            nothing is uploaded.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                FAQ
              </p>
              <h3 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                Questions, answered
              </h3>
            </div>
          </div>
          <dl className="lg:col-span-8">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className={`grid grid-cols-[auto_1fr] gap-5 py-6 sm:gap-7 ${
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
