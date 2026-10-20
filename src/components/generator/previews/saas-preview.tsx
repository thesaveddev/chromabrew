"use client";

import type { DesignSystem } from "@/lib/design-system/types";

/**
 * SaaS product preview: a support workspace — one conversation selected,
 * its thread and reply composer open.
 *
 * The previous design was a widget zoo (three equal KPI cards, a table, two
 * side panels) where nothing led and every element claimed the same weight.
 * This takes the other approach a real product takes: a split workspace with
 * hierarchy. The list rail stays quiet and carries the status vocabulary
 * (Open / Pending / Escalated / Resolved) the design system must be judged on;
 * the detail pane is the single dominant surface, holding the story, the
 * raised overflow menu, the focus-ring treatment and the primary/secondary
 * actions. The generated palette earns its place as the week's conversation
 * volume — every swatch, no text on top of it.
 *
 * The signature is the *primary thread*: the selection rail on the active
 * row, its unread dot, and the Send button are the same generated primary,
 * so the eye follows one colour from the list into the action.
 *
 * Every colour, radius, shadow and font comes from `--ds-*`; all content is
 * clearly demonstrative placeholder data.
 */

const VOLUME_HEIGHTS = [45, 70, 55, 90, 65, 80, 50];

export function SaasPreview({ system }: { system: DesignSystem }) {
  const swatches = system.primitives.colors.palette.map((p) => p.hex);
  const swatch = (index: number): string =>
    swatches[index % Math.max(swatches.length, 1)] ?? "var(--ds-primary)";

  const conversations = [
    {
      initials: "JR",
      name: "Jamie Rivera",
      subject: "Refund for invoice #1042",
      time: "2h",
      status: "Open",
      tone: "info",
      selected: true,
      unread: true,
    },
    {
      initials: "PN",
      name: "Priya Nair",
      subject: "SSO setup on staging",
      time: "4h",
      status: "Pending",
      tone: "warning",
      selected: false,
      unread: false,
    },
    {
      initials: "MF",
      name: "Marcus Feld",
      subject: "CSV export stops at 10k rows",
      time: "1d",
      status: "Escalated",
      tone: "danger",
      selected: false,
      unread: true,
    },
    {
      initials: "DB",
      name: "Dana Brooks",
      subject: "Add seat to the Pro plan",
      time: "Mon",
      status: "Resolved",
      tone: "success",
      selected: false,
      unread: false,
    },
  ];

  return (
    <div className="flex min-h-[560px] flex-col bg-[var(--ds-background)] font-sans text-[13px] text-[var(--ds-foreground)]">
      {/* Product bar */}
      <header className="flex items-center gap-2.5 border-b border-[var(--ds-border)] px-4 py-2.5">
        <span
          className="h-5 w-5 rounded-[var(--ds-radius-md)] bg-[var(--ds-primary)]"
          aria-hidden
        />
        <span className="text-sm font-semibold">Acme Cloud</span>
        <span className="text-[var(--ds-foreground-subtle)]" aria-hidden>
          /
        </span>
        <span className="text-xs text-[var(--ds-foreground-muted)]">Support</span>
        <label className="ml-auto hidden md:block">
          <span className="sr-only">Search conversations</span>
          <input
            type="text"
            placeholder="Search conversations…"
            className="w-48 rounded-[var(--ds-radius-md)] border border-[var(--ds-input-border)] bg-[var(--ds-input)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--ds-focus-ring)] focus:ring-2 focus:ring-[var(--ds-focus-ring)]"
            readOnly
          />
        </label>
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: swatch(1) }}
          aria-label="Signed in as Alex Morgan"
        >
          AM
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Conversation list */}
        <aside
          className="hidden w-56 shrink-0 flex-col border-r border-[var(--ds-border)] bg-[var(--ds-background-subtle)] sm:flex"
          aria-label="Conversations"
        >
          <div className="flex items-baseline justify-between px-4 py-3">
            <h2 className="text-sm font-semibold">Inbox</h2>
            <span className="text-[11px] text-[var(--ds-foreground-muted)]">
              12 open
            </span>
          </div>

          <ul className="flex-1 space-y-0.5 px-2">
            {conversations.slice(0, 3).map((row, index) => (
              <ConversationRow key={row.subject} row={row} colour={swatch(index)} />
            ))}
            <li
              className="px-2.5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-foreground-subtle)]"
              aria-hidden
            >
              Resolved
            </li>
            <ConversationRow
              row={conversations[3]}
              colour={swatch(3)}
            />
          </ul>

          {/* The generated palette, at work: one bar per swatch. */}
          <div className="border-t border-[var(--ds-border-muted)] px-4 py-3">
            <p className="text-[11px] text-[var(--ds-foreground-muted)]">
              48 conversations this week
            </p>
            <div className="mt-2 flex h-8 items-end gap-1" aria-hidden>
              {VOLUME_HEIGHTS.map((height, index) => (
                <span
                  key={index}
                  className="w-full rounded-t-[3px]"
                  style={{
                    height: `${height}%`,
                    backgroundColor: swatch(index),
                  }}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Detail pane */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex items-start gap-3 border-b border-[var(--ds-border)] px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--ds-foreground-subtle)]">
                  #2481
                </span>
                <StatusBadge tone="info">Open</StatusBadge>
              </div>
              <h2 className="mt-1 truncate text-base font-semibold">
                Refund for invoice #1042
              </h2>
              <p className="mt-0.5 truncate text-xs text-[var(--ds-foreground-muted)]">
                Jamie Rivera · via email · 2h ago
              </p>
            </div>

            <span className="hidden shrink-0 rounded-full bg-[var(--ds-accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--ds-accent-foreground)] sm:inline-block">
              SLA · due in 2h
            </span>
            <button
              type="button"
              aria-label="More conversation actions"
              aria-expanded="true"
              className="shrink-0 rounded-[var(--ds-radius-md)] border border-[var(--ds-input-border)] bg-[var(--ds-surface)] px-2 py-1 hover:bg-[var(--ds-background-subtle)]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <circle cx="3" cy="7" r="1.4" fill="currentColor" />
                <circle cx="7" cy="7" r="1.4" fill="currentColor" />
                <circle cx="11" cy="7" r="1.4" fill="currentColor" />
              </svg>
            </button>

            {/* The raised surface, shown open so the elevation reads. */}
            <div className="absolute right-5 top-[68px] z-10 w-44 rounded-[var(--ds-radius-lg)] border border-[var(--ds-border-muted)] bg-[var(--ds-surface-raised)] p-1 shadow-[var(--ds-shadow-md)]">
              <span className="block rounded-[var(--ds-radius-md)] px-2.5 py-1.5 text-xs hover:bg-[var(--ds-background-subtle)]">
                Mark as pending
              </span>
              <span className="block rounded-[var(--ds-radius-md)] px-2.5 py-1.5 text-xs hover:bg-[var(--ds-background-subtle)]">
                Export transcript
              </span>
              <span className="mt-1 block border-t border-[var(--ds-border-muted)] px-2.5 pt-1.5 text-xs font-medium text-[var(--ds-danger)]">
                Delete conversation
              </span>
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 space-y-3 px-5 py-4">
            <article className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-border-muted)] bg-[var(--ds-surface)] p-3.5">
              <div className="flex items-center gap-2">
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-semibold text-white"
                  style={{ backgroundColor: swatch(0) }}
                  aria-hidden
                >
                  JR
                </span>
                <p className="text-xs font-semibold">Jamie Rivera</p>
                <span className="text-[10px] text-[var(--ds-foreground-subtle)]">
                  2h ago
                </span>
              </div>
              <p className="mt-2 leading-5 text-[var(--ds-foreground-muted)]">
                Hi — Stripe shows two charges for March (invoice #1042), $1,240
                each. Could you refund the duplicate? Our finance close is
                Friday.
              </p>
            </article>

            <article className="rounded-[var(--ds-radius-lg)] border border-l-2 border-[var(--ds-border-muted)] border-l-[var(--ds-primary)] bg-[var(--ds-surface)] p-3.5">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--ds-secondary)] text-[9px] font-semibold text-[var(--ds-secondary-foreground)]">
                  AM
                </span>
                <p className="text-xs font-semibold">You · support</p>
                <span className="text-[10px] text-[var(--ds-foreground-subtle)]">
                  1h ago
                </span>
              </div>
              <p className="mt-2 leading-5 text-[var(--ds-foreground-muted)]">
                Found it — the retry after a timeout double-charged you. Refund
                issued to the card ending 4242; banks take 3–5 days. I&apos;ve
                added a note to the invoice.
              </p>
            </article>
          </div>

          {/* Composer — worn focus, so the system's focus ring is visible. */}
          <div className="border-t border-[var(--ds-border)] px-5 py-4">
            <label className="block">
              <span className="sr-only">Reply to Jamie Rivera</span>
              <textarea
                rows={2}
                readOnly
                placeholder="Write a reply…"
                className="w-full resize-none rounded-[var(--ds-radius-lg)] border-2 border-[var(--ds-focus-ring)] bg-[var(--ds-input)] px-3 py-2.5 text-xs leading-5 outline-none"
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-[var(--ds-radius-md)] bg-[var(--ds-primary)] px-3.5 py-1.5 text-xs font-medium text-[var(--ds-primary-foreground)] transition-colors hover:bg-[var(--ds-primary-hover)] active:bg-[var(--ds-primary-active)]"
              >
                Send reply
              </button>
              <button
                type="button"
                className="rounded-[var(--ds-radius-md)] bg-[var(--ds-secondary)] px-3.5 py-1.5 text-xs font-medium text-[var(--ds-secondary-foreground)] transition-colors hover:bg-[var(--ds-secondary-hover)]"
              >
                Assign to me
              </button>
              <button
                type="button"
                className="rounded-[var(--ds-radius-md)] border border-[var(--ds-input-border)] bg-[var(--ds-surface)] px-3.5 py-1.5 text-xs font-medium hover:bg-[var(--ds-background-subtle)]"
              >
                Snooze
              </button>
              <span className="ml-auto hidden text-[11px] text-[var(--ds-foreground-subtle)] sm:block">
                Sample conversation — nothing is sent.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({
  row,
  colour,
}: {
  row: {
    initials: string;
    name: string;
    subject: string;
    time: string;
    status: string;
    tone: string;
    selected: boolean;
    unread: boolean;
  };
  colour: string;
}) {
  return (
    <li aria-current={row.selected ? "true" : undefined}>
      <div
        className={`flex gap-2.5 rounded-[var(--ds-radius-md)] border-l-2 px-2.5 py-2.5 transition-colors ${
          row.selected
            ? "border-[var(--ds-primary)] bg-[var(--ds-surface)] shadow-[var(--ds-shadow-sm)]"
            : "border-transparent hover:bg-[var(--ds-surface)]"
        }`}
      >
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: colour }}
          aria-hidden
        >
          {row.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={`truncate text-xs ${row.unread ? "font-semibold" : "font-medium"}`}
            >
              {row.name}
            </p>
            <span className="flex shrink-0 items-center gap-1.5">
              {row.unread ? (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--ds-primary)]"
                  aria-label="Unread"
                />
              ) : null}
              <span className="text-[10px] text-[var(--ds-foreground-subtle)]">
                {row.time}
              </span>
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--ds-foreground-muted)]">
            {row.subject}
          </p>
          <div className="mt-1.5">
            <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
          </div>
        </div>
      </div>
    </li>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: string;
  children: React.ReactNode;
}) {
  const map: Record<string, [string, string]> = {
    success: ["bg-[var(--ds-success)]", "text-[var(--ds-success-foreground)]"],
    warning: ["bg-[var(--ds-warning)]", "text-[var(--ds-warning-foreground)]"],
    danger: ["bg-[var(--ds-danger)]", "text-[var(--ds-danger-foreground)]"],
    info: ["bg-[var(--ds-info)]", "text-[var(--ds-info-foreground)]"],
  };
  const [bg, fg] = map[tone] ?? map.info;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${bg} ${fg}`}
    >
      {children}
    </span>
  );
}
