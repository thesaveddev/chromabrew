"use client";

import type { DesignSystem } from "@/lib/design-system/types";

/**
 * Ecommerce preview — lookbook + ledger.
 *
 * The previous version was an equal-weight card zoo: a filter sidebar, four
 * identical product cards and an orphaned detail strip, nothing leading. This
 * one spends its hierarchy on a single editorial featured block, then judges
 * the palette where a shop actually would — a stock-status column where
 * success, warning, info and danger sit side by side. All copy is clearly
 * demonstrative.
 */
export function EcommercePreview({ system }: { system: DesignSystem }) {
  const plate =
    system.primitives.colors.scale.find((s) => s.step === 200)?.hex ??
    system.primitives.colors.scale[0]?.hex ??
    "#eee";

  const rows = [
    {
      name: "Demo mug",
      detail: "Stoneware · demo",
      price: "$18.00",
      was: null,
      status: "In stock",
      tone: "success",
    },
    {
      name: "Placeholder tee",
      detail: "Garment-dyed cotton",
      price: "$22.40",
      was: "$28.00",
      status: "Low stock",
      tone: "warning",
    },
    {
      name: "Example cap",
      detail: "Six-panel · adjustable",
      price: "$24.00",
      was: null,
      status: "Backorder",
      tone: "info",
    },
    {
      name: "Sample bowl",
      detail: "Glazed ceramic · set of 2",
      price: "$12.00",
      was: null,
      status: "Sold out",
      tone: "danger",
    },
  ] as const;

  return (
    <div className="flex min-h-[560px] flex-col bg-[var(--ds-background)] font-sans text-[var(--ds-foreground)]">
      {/* Store header */}
      <header className="flex items-center justify-between border-b border-[var(--ds-border)] px-6 py-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="h-5 w-5 rounded-[var(--ds-radius-md)] bg-[var(--ds-primary)]" aria-hidden />
          Shop Demo
        </div>
        <nav aria-label="Store nav" className="hidden gap-4 text-xs text-[var(--ds-foreground-muted)] md:flex">
          <span>New in</span>
          <span>Bestsellers</span>
          <span>Sale</span>
        </nav>
        <button className="relative rounded-[var(--ds-radius-md)] border border-[var(--ds-input-border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--ds-background-subtle)]">
          Cart
          <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--ds-primary)] text-[10px] font-semibold text-[var(--ds-primary-foreground)]">
            3
          </span>
        </button>
      </header>

      {/* Featured product — the one loud moment */}
      <section className="grid gap-5 px-6 py-6 sm:grid-cols-[190px_minmax(0,1fr)]">
        <div
          className="relative grid h-44 place-items-center overflow-hidden rounded-[var(--ds-radius-xl)] shadow-[var(--ds-shadow-sm)] sm:h-auto sm:min-h-[184px]"
          style={{ backgroundColor: plate }}
        >
          <ToteGlyph />
          <span className="absolute left-3 top-3 rounded-full bg-[var(--ds-accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-accent-foreground)]">
            New
          </span>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ds-foreground-subtle)]">
            Featured — placeholder
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-3xl font-bold leading-tight tracking-tight">The Sample Tote</h2>
            <p className="text-2xl font-bold tabular-nums">$42.00</p>
          </div>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--ds-foreground-muted)]">
            Handwoven canvas with a reinforced base — demonstrative copy
            standing in for your product story.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {["S", "M", "L"].map((size, i) => (
              <span
                key={size}
                className={`grid h-7 w-7 place-items-center rounded-[var(--ds-radius-md)] border text-xs ${
                  i === 1
                    ? "border-[var(--ds-secondary)] bg-[var(--ds-secondary)] font-medium text-[var(--ds-secondary-foreground)]"
                    : "border-[var(--ds-border-strong)]"
                }`}
              >
                {size}
              </span>
            ))}
            <button className="ml-1 rounded-[var(--ds-radius-lg)] bg-[var(--ds-primary)] px-4 py-1.5 text-xs font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
              Add to bag
            </button>
            <span className="rounded-full bg-[var(--ds-info)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-info-foreground)]">
              Free shipping
            </span>
          </div>
        </div>
      </section>

      {/* The index — stock status is where the palette proves itself */}
      <section className="px-6 pb-6">
        <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">The index</h2>
            <p className="text-xs text-[var(--ds-foreground-muted)]">
              Demo catalogue — four of 128
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--ds-foreground-muted)]">
            <input type="checkbox" defaultChecked className="accent-[var(--ds-primary)]" />
            In stock only
          </label>
        </div>
        <div className="overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] shadow-[var(--ds-shadow-sm)]">
          <table className="w-full border-collapse text-left text-xs">
            <caption className="sr-only">
              Demo product index with prices, stock status and add buttons
            </caption>
            <thead>
              <tr className="bg-[var(--ds-background-subtle)] text-[10px] uppercase tracking-wide text-[var(--ds-foreground-subtle)]">
                <th scope="col" className="px-4 py-2 font-semibold">Product</th>
                <th scope="col" className="px-4 py-2 font-semibold">Price</th>
                <th scope="col" className="px-4 py-2 font-semibold">Stock</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">Add</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const soldOut = row.tone === "danger";
                return (
                  <tr
                    key={row.name}
                    className="border-t border-[var(--ds-border-muted)] transition-colors hover:bg-[var(--ds-background-subtle)]"
                  >
                    <td className="px-4 py-2.5">
                      <span className={`block font-medium ${soldOut ? "text-[var(--ds-foreground-muted)]" : ""}`}>
                        {row.name}
                      </span>
                      <span className="block text-[10px] text-[var(--ds-foreground-subtle)]">{row.detail}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                      <span
                        className={
                          soldOut
                            ? "text-[var(--ds-foreground-subtle)]"
                            : row.was
                              ? "font-semibold text-[var(--ds-danger)]"
                              : "font-semibold"
                        }
                      >
                        {row.price}
                      </span>
                      {row.was ? (
                        <span className="ml-1.5 text-[10px] text-[var(--ds-foreground-subtle)] line-through">
                          {row.was}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[var(--ds-foreground-muted)]">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: `var(--ds-${row.tone})` }}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        disabled={soldOut}
                        className="rounded-[var(--ds-radius-md)] border border-[var(--ds-border-strong)] px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-[var(--ds-background-subtle)] disabled:cursor-not-allowed disabled:border-[var(--ds-border-muted)] disabled:text-[var(--ds-foreground-subtle)]"
                      >
                        {soldOut ? "Sold out" : "Add"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cart bar */}
      <footer className="mt-auto border-t border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-6 py-3.5 shadow-[var(--ds-shadow-md)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex min-w-[200px] flex-1 items-center gap-2">
            <span className="whitespace-nowrap text-xs font-medium text-[var(--ds-foreground-muted)]">Promo code</span>
            <input
              type="text"
              placeholder="DEMO10"
              readOnly
              aria-label="Promo code (demo)"
              className="w-full max-w-[170px] rounded-[var(--ds-radius-md)] border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
            />
          </label>
          <p className="text-xs text-[var(--ds-foreground-muted)]">
            <span className="font-semibold text-[var(--ds-foreground)]">3 items</span> · $64.40 (demo)
          </p>
          <button className="rounded-[var(--ds-radius-lg)] bg-[var(--ds-primary)] px-4 py-1.5 text-xs font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
            Checkout
          </button>
        </div>
      </footer>
    </div>
  );
}

function ToteGlyph() {
  return (
    <svg width="76" height="76" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M10 16h28l-3 24H13L10 16z" fill="white" fillOpacity="0.5" />
      <path
        d="M17 16v-3a7 7 0 0 1 14 0v3"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="17" y="25" width="14" height="3" rx="1.5" fill="white" fillOpacity="0.75" />
    </svg>
  );
}
