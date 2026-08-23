"use client";

import type { DesignSystem } from "@/lib/design-system/types";

/** Ecommerce preview with clearly demonstrative placeholder products. */
export function EcommercePreview({ system }: { system: DesignSystem }) {
  const scaleTints = system.primitives.colors.scale.filter((s) =>
    [100, 200, 300].includes(s.step),
  );
  const products = [
    ["Sample tote", "$42.00", "New", "success"],
    ["Demo mug", "$18.00", null, null],
    ["Placeholder tee", "$28.00", "-20%", "danger"],
    ["Example cap", "$24.00", null, null],
  ] as const;

  return (
    <div className="min-h-[560px] bg-[var(--ds-background)] font-sans text-[var(--ds-foreground)]">
      {/* Store header */}
      <header className="flex items-center justify-between border-b border-[var(--ds-border)] px-6 py-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-5 w-5 rounded bg-[var(--ds-primary)]" />
          Shop Demo
        </div>
        <nav aria-label="Store nav" className="hidden gap-4 text-xs text-[var(--ds-foreground-muted)] md:flex">
          <span>New in</span>
          <span>Bestsellers</span>
          <span>Sale</span>
        </nav>
        <button className="relative rounded-[var(--ds-radius-md)] border border-[var(--ds-input-border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--ds-secondary-hover)]">
          Cart
          <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--ds-primary)] text-[10px] font-semibold text-[var(--ds-primary-foreground)]">
            2
          </span>
        </button>
      </header>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[180px_1fr]">
        {/* Filters */}
        <aside aria-label="Product filters" className="space-y-5 text-xs lg:pt-1">
          <fieldset>
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ds-foreground-subtle)]">Category</legend>
            {["Apparel", "Homeware", "Accessories"].map((cat, i) => (
              <label key={cat} className="mb-1.5 flex items-center gap-2">
                <input type="checkbox" defaultChecked={i === 0} className="accent-[var(--ds-primary)]" />
                {cat}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ds-foreground-subtle)]">Price</legend>
            <input type="range" min="0" max="100" defaultValue="60" className="w-full accent-[var(--ds-primary)]" aria-label="Maximum price" />
            <p className="mt-1 text-[var(--ds-foreground-muted)]">Up to $60</p>
          </fieldset>
          <button className="w-full rounded-[var(--ds-radius-lg)] border border-[var(--ds-input-border)] bg-[var(--ds-secondary)] py-1.5 font-medium text-[var(--ds-secondary-foreground)] hover:bg-[var(--ds-secondary-hover)]">
            Apply filters
          </button>
        </aside>

        {/* Grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">All products</h2>
            <label className="text-xs">
              <span className="mr-1.5 text-[var(--ds-foreground-muted)]">Sort</span>
              <select
                className="rounded-[var(--ds-radius-md)] border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-2 py-1 outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
                defaultValue="featured"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price">Price</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {products.map(([name, price, badge, tone], i) => (
              <article key={name} className="group overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] shadow-[var(--ds-shadow-sm)] transition-shadow hover:shadow-[var(--ds-shadow-md)]">
                <div
                  className="relative grid h-28 place-items-center"
                  style={{ backgroundColor: scaleTints[i % scaleTints.length]?.hex ?? "#eee" }}
                >
                  <span className="h-10 w-10 rounded-[var(--ds-radius-lg)] bg-white/40 shadow-inner" />
                  {badge ? (
                    <span
                      className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tone === "danger"
                          ? "bg-[var(--ds-danger)] text-[var(--ds-danger-foreground)]"
                          : "bg-[var(--ds-success)] text-[var(--ds-success-foreground)]"
                      }`}
                    >
                      {badge}
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-xs font-medium">{name}</h3>
                  <p className="mt-0.5 flex items-center gap-1" aria-label={`Rated 4 of 5`}>
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star key={star} filled={star < 4} />
                    ))}
                    <span className="ml-1 text-[10px] text-[var(--ds-foreground-subtle)]">(demo)</span>
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">{price}</span>
                    <button className="rounded-[var(--ds-radius-md)] bg-[var(--ds-primary)] px-2.5 py-1 text-[11px] font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
                      Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Product detail strip */}
          <section className="mt-6 grid gap-4 rounded-[var(--ds-radius-xl)] border border-[var(--ds-border-muted)] bg-[var(--ds-surface-raised)] p-4 shadow-[var(--ds-shadow-sm)] sm:grid-cols-[140px_1fr]">
            <div
              className="h-32 rounded-[var(--ds-radius-lg)]"
              style={{ backgroundColor: scaleTints[1]?.hex ?? "#eee" }}
              aria-hidden
            />
            <div>
              <h3 className="text-sm font-semibold">Featured product Ã¢â‚¬â€ Ã¢â‚¬Å“The SampleÃ¢â‚¬Â</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--ds-foreground-muted)]">
                A product detail block demonstrating badges, size selection and
                the primary purchase action with your tokens.
              </p>
              <div className="mt-2 flex items-center gap-2">
                {["S", "M", "L"].map((size, i) => (
                  <span
                    key={size}
                    className={`grid h-7 w-7 place-items-center rounded-[var(--ds-radius-md)] border text-xs ${
                      i === 1
                        ? "border-[var(--ds-primary)] bg-[var(--ds-primary)] font-medium text-[var(--ds-primary-foreground)]"
                        : "border-[var(--ds-border-strong)]"
                    }`}
                  >
                    {size}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-[var(--ds-radius-lg)] bg-[var(--ds-primary)] px-4 py-1.5 text-xs font-medium text-[var(--ds-primary-foreground)] hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
                  Add to cart Ã¢â‚¬â€ $49
                </button>
                <span className="rounded-full bg-[var(--ds-info)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-info-foreground)]">
                  Free shipping
                </span>
              </div>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" aria-hidden className={filled ? "text-[var(--ds-warning)]" : "text-[var(--ds-border-strong)]"} fill="currentColor">
      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9z" />
    </svg>
  );
}
