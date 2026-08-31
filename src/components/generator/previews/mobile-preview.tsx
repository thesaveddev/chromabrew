"use client";

import type { DesignSystem } from "@/lib/design-system/types";

/** Phone-framed mobile app preview. */
export function MobilePreview({ system }: { system: DesignSystem }) {
  const tint = system.primitives.colors.scale.find((s) => s.step === 100)?.hex ?? "#eee";
  return (
    <div className="flex min-h-[560px] items-center justify-center bg-zinc-100 p-6 font-sans dark:bg-zinc-800/50">
      <div
        className="w-[300px] overflow-hidden rounded-[2rem] border-[10px] border-zinc-900 bg-[var(--ds-background)] shadow-xl"
        role="img"
        aria-label="Mobile application preview using the generated design system"
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-2 text-[10px] font-medium text-[var(--ds-foreground-muted)]">
          <span>9:41</span>
          <span className="flex items-center gap-1" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ds-foreground-muted)]" />
            <span className="h-1.5 w-3 rounded-sm bg-[var(--ds-foreground-muted)]" />
          </span>
        </div>

        {/* App header */}
        <header className="flex items-center justify-between px-4 py-2">
          <h2 className="text-base font-bold tracking-tight">Wallet</h2>
          <button className="rounded-[var(--ds-radius-md)] bg-[var(--ds-primary)] px-2.5 py-1 text-[11px] font-medium text-[var(--ds-primary-foreground)] hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
            + Add
          </button>
        </header>

        {/* Balance card */}
        <section className="mx-4 rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, var(--ds-primary), var(--ds-accent))` }}>
          <p className="text-[10px] uppercase tracking-wider opacity-80">Sample balance</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">$12,480.00</p>
          <div className="mt-3 flex gap-2">
            <button className="rounded-[var(--ds-radius-lg)] bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur hover:bg-white/30">
              Send
            </button>
            <button className="rounded-[var(--ds-radius-lg)] bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur hover:bg-white/30">
              Request
            </button>
          </div>
        </section>

        {/* Segmented control */}
        <div className="mx-4 mt-4 grid grid-cols-3 gap-1 rounded-[var(--ds-radius-lg)] bg-[var(--ds-background-subtle)] p-1 text-[11px]" role="tablist" aria-label="Transaction filters">
          {["All", "Sent", "Received"].map((tab, i) => (
            <span
              key={tab}
              className={`rounded-[var(--ds-radius-md)] py-1 text-center ${
                i === 0 ? "bg-[var(--ds-secondary)] font-semibold text-[var(--ds-secondary-foreground)] shadow-[var(--ds-shadow-sm)]" : "text-[var(--ds-foreground-muted)]"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Transaction list */}
        <ul className="mt-3 px-4 text-xs">
          {[
            ["Coffee Demo", "-$4.50", "success"],
            ["Salary sample", "+$2,900", "info"],
            ["Groceries demo", "-$56.20", "warning"],
          ].map(([name, amount]) => (
            <li key={name} className="flex items-center gap-3 rounded-[var(--ds-radius-xl)] px-1 py-2.5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--ds-radius-xl)] text-[10px] font-bold"
                style={{ backgroundColor: tint }}
              >
                {String(name).slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{name}</span>
                <span className="block text-[10px] text-[var(--ds-foreground-subtle)]">Today &middot; placeholder</span>
              </span>
              <span
                className={`font-semibold ${
                  String(amount).startsWith("+") ? "" : "text-[var(--ds-foreground)]"
                }`}
              >
                {amount}
              </span>
            </li>
          ))}
        </ul>

        {/* Form control */}
        <div className="mx-4 mt-2">
          <label className="mb-1 block text-[10px] font-medium text-[var(--ds-foreground-muted)]" htmlFor="mp-search">
            Search transactions
          </label>
          <input
            id="mp-search"
            type="text"
            placeholder='Try "coffee"'
            readOnly
            className="w-full rounded-[var(--ds-radius-xl)] border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-3 py-2 text-xs outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
          />
        </div>

        {/* Bottom nav */}
        <nav aria-label="App sections" className="mt-4 flex items-center justify-around border-t border-[var(--ds-border-muted)] bg-[var(--ds-background-subtle)] px-2 py-2.5 text-[10px]">
          {["Home", "Cards", "Stats"].map((item, i) => (
            <span key={item} className={`flex flex-col items-center gap-0.5 ${i === 0 ? "font-semibold text-[var(--ds-primary)]" : "text-[var(--ds-foreground-subtle)]"}`}>
              <span className={`block h-4 w-4 rounded-[var(--ds-radius-md)] ${i === 0 ? "bg-[var(--ds-primary)]" : "bg-[var(--ds-border-strong)]"}`} />
              {item}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
