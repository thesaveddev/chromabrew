"use client";

import type { DesignSystem } from "@/lib/design-system/types";

/** Marketing website preview with clearly demonstrative placeholder copy. */
export function MarketingPreview({ system }: { system: DesignSystem }) {
  const accent = system.primitives.colors.palette.find((p) => p.role !== "Primary")?.hex ?? system.source.primary.hex;
  return (
    <div className="min-h-[560px] bg-[var(--ds-background)] font-sans text-[var(--ds-foreground)]">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-[var(--ds-border-muted)] px-6 py-3.5 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <span className="h-5 w-5 rounded-[var(--ds-radius-md)] bg-[var(--ds-primary)]" />
          Northstar
        </div>
        <nav aria-label="Marketing nav" className="hidden gap-5 text-xs text-[var(--ds-foreground-muted)] md:flex">
          <span>Product</span>
          <span>Pricing</span>
          <span>Docs</span>
          <span>Blog</span>
        </nav>
        <button className="rounded-[var(--ds-radius-lg)] bg-[var(--ds-primary)] px-3.5 py-1.5 text-xs font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
          Get started
        </button>
      </header>

      {/* Hero */}
      <section className="px-6 py-14 text-center">
        <p className="mx-auto w-fit rounded-full bg-[var(--ds-secondary)] px-3 py-1 text-[11px] font-medium text-[var(--ds-secondary-foreground)]">
          Placeholder content Ã¢â‚¬â€ swap in your own story
        </p>
        <h2 className="mx-auto mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Ship your product faster than ever
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--ds-foreground-muted)]">
          This hero demonstrates your generated typography scale, foreground
          tokens and primary call to action.
        </p>
        <form className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="you@example.com"
            readOnly
            className="w-full flex-1 rounded-[var(--ds-radius-lg)] border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-3 py-2 text-sm outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
            aria-label="Email address (demo)"
          />
          <button className="rounded-[var(--ds-radius-lg)] bg-[var(--ds-primary)] px-4 py-2 text-sm font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)]">
            Start free
          </button>
        </form>
      </section>

      {/* Features */}
      <section className="grid gap-4 border-t border-[var(--ds-border-muted)] bg-[var(--ds-background-subtle)] px-6 py-10 sm:grid-cols-3">
        {[
          ["Fast by default", "Feature cards show surface tokens, muted foregrounds and borders."],
          ["Accessible pairs", "Every combination is measured against WCAG thresholds."],
          ["Yours to theme", "The accent swatch demonstrates secondary hues from your palette."],
        ].map(([title, body], i) => (
          <article key={title} className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] p-4 shadow-[var(--ds-shadow-sm)]">
            <span className="mb-2 block h-8 w-8 rounded-[var(--ds-radius-lg)]" style={{ backgroundColor: i === 1 ? accent : "var(--ds-primary)", opacity: 0.9 }} />
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--ds-foreground-muted)]">{body}</p>
          </article>
        ))}
      </section>

      {/* Testimonials + pricing */}
      <section className="grid gap-6 px-6 py-10 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            ["Placeholder quote from a fictional customer.", "Alex Doe Ã¢â‚¬â€ Demo Title"],
            ["Replace this layout with real social proof.", "SamPLE Ã¢â‚¬â€ Another Title"],
          ].map(([quote, author]) => (
            <figure key={author} className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] p-4 shadow-[var(--ds-shadow-sm)]">
              <blockquote className="text-sm leading-6">Ã¢â‚¬Å“{quote}Ã¢â‚¬Â</blockquote>
              <figcaption className="mt-2 text-xs font-medium text-[var(--ds-foreground-subtle)]">{author}</figcaption>
            </figure>
          ))}
        </div>
        <section className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-6 shadow-[var(--ds-shadow-md)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ds-foreground-subtle)]">Sample plan</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            $0<span className="text-base font-normal text-[var(--ds-foreground-muted)]">/month</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {["Everything in demo", "Unlimited placeholders", "Community support"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckMark /> {item}
              </li>
            ))}
          </ul>
          <button className="mt-5 w-full rounded-[var(--ds-radius-lg)] bg-[var(--ds-primary)] px-4 py-2 text-sm font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
            Choose sample plan
          </button>
        </section>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-[var(--ds-border-muted)] bg-[var(--ds-background-subtle)] px-6 py-10 text-center">
        <h3 className="text-xl font-semibold tracking-tight">A closing call to action</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--ds-foreground-muted)]">
          The footer band demonstrates background-subtle contrast at scale.
        </p>
        <button className="mt-4 rounded-[var(--ds-radius-lg)] bg-[var(--ds-accent)] px-4 py-2 text-sm font-medium text-[var(--ds-accent-foreground)] hover:brightness-110">
          Accent button example
        </button>
      </footer>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-[var(--ds-success)]">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.15" />
      <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
