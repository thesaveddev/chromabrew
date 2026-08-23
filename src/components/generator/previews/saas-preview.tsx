"use client";

import type { DesignSystem } from "@/lib/design-system/types";
import { BarChartPlaceholder } from "./preview-frame";

/**
 * Realistic SaaS dashboard preview. All content is clearly demonstrative
 * placeholder data.
 */
export function SaasPreview({ system }: { system: DesignSystem }) {
  const chart = chartColours(system);
  return (
    <div className="flex min-h-[560px] bg-[var(--ds-background)] font-sans text-[13px] text-[var(--ds-foreground)]">
      {/* Sidebar */}
      <aside className="hidden w-48 shrink-0 flex-col border-r border-[var(--ds-border)] bg-[var(--ds-background-subtle)] p-4 sm:flex">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md bg-[var(--ds-primary)]" />
          <span className="text-sm font-semibold">Acme Cloud</span>
        </div>
        <nav aria-label="Dashboard sections" className="mt-6 space-y-1">
          {[
            ["Overview", true],
            ["Customers", false],
            ["Invoices", false],
            ["Reports", false],
            ["Settings", false],
          ].map(([label, active]) => (
            <span
              key={label as string}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 ${
                active
                  ? "bg-[var(--ds-primary)] font-medium text-[var(--ds-primary-foreground)]"
                  : "text-[var(--ds-foreground-muted)] hover:bg-[var(--ds-secondary-hover)]"
              }`}
            >
              {label}
              {label === "Invoices" ? (
                <span className="rounded-full bg-[var(--ds-danger)] px-1.5 py-px text-[10px] font-semibold text-white">
                  3
                </span>
              ) : null}
            </span>
          ))}
        </nav>
        <div className="mt-auto rounded-lg border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] p-3">
          <p className="font-medium">Sample workspace</p>
          <p className="mt-0.5 text-xs text-[var(--ds-foreground-muted)]">
            Demo data only
          </p>
          <button className="mt-2 w-full rounded-md border border-[var(--ds-input-border)] bg-[var(--ds-surface-raised)] px-2 py-1 text-xs font-medium hover:bg-[var(--ds-secondary-hover)]">
            Manage plan
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center gap-3 border-b border-[var(--ds-border)] px-4 py-3">
          <h2 className="text-sm font-semibold">Overview</h2>
          <label className="ml-auto hidden items-center md:flex">
            <span className="sr-only">Search</span>
            <input
              type="text"
              placeholder="Search…"
              className="w-44 rounded-md border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
              readOnly
            />
          </label>
          <button className="rounded-md bg-[var(--ds-primary)] px-3 py-1.5 text-xs font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]">
            New invoice
          </button>
          <span
            className="h-7 w-7 rounded-full"
            style={{ backgroundColor: chart[1] }}
            aria-hidden
          />
        </header>

        <div className="grid gap-4 p-4 lg:grid-cols-3">
          {/* KPI cards */}
          {[
            { label: "MRR", value: "$48,210", delta: "+12.4%", up: true },
            { label: "Active customers", value: "1,284", delta: "+3.1%", up: true },
            { label: "Churned", value: "17", delta: "-0.8%", up: false },
          ].map((kpi, i) => (
            <section
              key={kpi.label}
              className="rounded-xl border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-[var(--ds-foreground-muted)]">{kpi.label}</p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className="text-xl font-semibold tracking-tight">{kpi.value}</p>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    kpi.up
                      ? "bg-[var(--ds-success)] text-[var(--ds-success-foreground)]"
                      : "bg-[var(--ds-info)] text-[var(--ds-info-foreground)]"
                  }`}
                >
                  {kpi.delta} sample
                </span>
              </div>
              <div className="mt-3">
                <BarChartPlaceholder colours={chart.slice(i % 2)} />
              </div>
            </section>
          ))}

          {/* Table */}
          <section className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--ds-border-muted)] px-4 py-3">
                <h3 className="font-semibold">Recent invoices</h3>
                <button className="rounded-md border border-[var(--ds-input-border)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--ds-secondary-hover)]">
                  View all
                </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--ds-border-muted)] text-xs text-[var(--ds-foreground-muted)]">
                    <th scope="col" className="px-4 py-2 font-medium">Customer</th>
                    <th scope="col" className="px-4 py-2 font-medium">Amount</th>
                    <th scope="col" className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Harbor & Co", "$1,240.00", "Paid", "success"],
                    ["Northwind Labs", "$860.00", "Pending", "warning"],
                    ["Bluepeak GmbH", "$2,410.00", "Paid", "success"],
                    ["Summit Studio", "$310.00", "Overdue", "danger"],
                    ["Ridgeway LLC", "$980.00", "Draft", "info"],
                  ].map(([customer, amount, status, tone]) => (
                    <tr key={customer} className="border-b border-[var(--ds-border-muted)] last:border-0 hover:bg-[var(--ds-background-subtle)]">
                      <td className="px-4 py-2.5 font-medium">{customer}</td>
                      <td className="px-4 py-2.5 text-[var(--ds-foreground-muted)]">{amount}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge tone={tone}>{status}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Form controls */}
            <div className="mt-4 grid gap-3 rounded-xl border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] p-4 shadow-sm sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium">Customer name</span>
                <input
                  type="text"
                  placeholder="Jane Sample"
                  readOnly
                  className="w-full rounded-md border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium">Plan</span>
                <select
                  className="w-full rounded-md border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
                  defaultValue="pro"
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>
              <div className="sm:col-span-2">
                <fieldset>
                  <legend className="mb-1.5 text-xs font-medium">Notifications</legend>
                  <label className="mr-4 inline-flex items-center gap-1.5 text-xs">
                    <input type="radio" name="ds-notif" defaultChecked className="accent-[var(--ds-primary)]" /> Email
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs">
                    <input type="radio" name="ds-notif" className="accent-[var(--ds-primary)]" /> None
                  </label>
                </fieldset>
              </div>
            </div>
          </section>

          {/* Right rail: dropdown + modal demo */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] p-4 shadow-sm">
              <h3 className="mb-2 font-semibold">Dropdown menu</h3>
              <div className="rounded-lg border border-[var(--ds-border-muted)] bg-[var(--ds-surface-raised)] p-1 shadow-sm">
                {["Duplicate", "Archive", "Export CSV"].map((item) => (
                  <span key={item} className="block rounded-md px-2.5 py-1.5 text-xs hover:bg-[var(--ds-secondary-hover)]">
                    {item}
                  </span>
                ))}
                <span className="mt-1 block border-t border-[var(--ds-border-muted)] pt-1 text-xs font-medium text-[var(--ds-danger)]">
                  Delete project
                </span>
              </div>
            </section>
            <section className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-4 shadow-md">
              <h3 className="font-semibold">Delete workspace?</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--ds-foreground-muted)]">
                This is a demonstration modal rendered inline so you can see
                destructive styling without popups.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-md bg-[var(--ds-danger)] px-3 py-1.5 text-xs font-medium text-[var(--ds-danger-foreground)] hover:brightness-95">
                  Delete
                </button>
                <button className="rounded-md border border-[var(--ds-input-border)] bg-[var(--ds-surface)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--ds-secondary-hover)]">
                  Cancel
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: string; children: React.ReactNode }) {
  const map: Record<string, [string, string]> = {
    success: ["bg-[var(--ds-success)]", "text-[var(--ds-success-foreground)]"],
    warning: ["bg-[var(--ds-warning)]", "text-[var(--ds-warning-foreground)]"],
    danger: ["bg-[var(--ds-danger)]", "text-[var(--ds-danger-foreground)]"],
    info: ["bg-[var(--ds-info)]", "text-[var(--ds-info-foreground)]"],
  };
  const [bg, fg] = map[tone] ?? map.info;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${bg} ${fg}`}>
      {children}
    </span>
  );
}

function chartColours(system: DesignSystem): string[] {
  const palette = system.primitives.colors.palette;
  if (palette.length >= 2) return [palette[0].hex, palette[1].hex];
  return [system.source.primary.hex];
}
