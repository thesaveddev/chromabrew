"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TOOLS, categoryLabel, type ToolCategory } from "@/lib/tools";

/** Signature swatch per tool — real color, hinting at what it does. */
const SWATCHES: Record<string, string> = {
  "/tools/color-palette-generator":
    "linear-gradient(135deg, #7c3aed 0%, #2563eb 35%, #10b981 65%, #eab308 100%)",
  "/tools/brand-palettes":
    "linear-gradient(135deg, #1da1f2 0%, #ff6900 100%)",
  "/tools/shade-generator":
    "linear-gradient(135deg, #eef2ff 0%, #a5b4fc 35%, #4f46e5 65%, #1e1b4b 100%)",
  "/tools/contrast-checker":
    "linear-gradient(135deg, #09090b 50%, #fafafa 50%)",
  "/tools/color-converter":
    "linear-gradient(135deg, #14b8a6 0%, #8b5cf6 100%)",
  "/tools/color-names":
    "linear-gradient(135deg, #fbbf24 0%, #ec4899 100%)",
  "/tools/tailwind-color-generator":
    "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 60%, #1e3a8a 100%)",
  "/tools/shadcn-theme-generator":
    "linear-gradient(135deg, #fafafa 0%, #a1a1aa 55%, #18181b 100%)",
  "/tools/dark-mode-generator":
    "linear-gradient(135deg, #18181b 0%, #3f3f46 60%, #a78bfa 100%)",
  "/tools/design-token-generator":
    "linear-gradient(135deg, #fbbf24 0%, #b45309 60%, #451a03 100%)",
  "/tools/image-color-extractor":
    "linear-gradient(135deg, #f97316 0%, #db2777 55%, #4c1d95 100%)",
  "/tools/color-blindness-simulator":
    "linear-gradient(135deg, #ef4444 0%, #eab308 35%, #22c55e 65%, #3b82f6 100%)",
  "/tools/css-gradient-generator":
    "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
  "/tools/color-mixer":
    "linear-gradient(135deg, #8b5cf6 0%, #22c55e 100%)",
  "/tools/css-shadow-generator":
    "linear-gradient(135deg, #f4f4f5 0%, #d4d4d8 60%, #71717a 100%)",
  "/tools/alpha-channel":
    "repeating-conic-gradient(#d4d4d8 0% 25%, #fafafa 0% 50%) 50% / 20px 20px",
  "/tools/wcag-palette-checker":
    "linear-gradient(135deg, #34d399 0%, #0d9488 60%, #134e4a 100%)",
  "/tools/typography-scale-generator":
    "linear-gradient(135deg, #faf7f0 0%, #e7e5e4 55%, #1c1917 100%)",
  "/tools/svg-to-jpg":
    "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)",
  "/tools/jpg-to-svg":
    "linear-gradient(135deg, #34d399 0%, #60a5fa 100%)",
  "/tools/ai-palette-suggestion":
    "linear-gradient(135deg, #a78bfa 0%, #e879f9 60%, #701a75 100%)",
  "/tools/llms-txt-generator":
    "linear-gradient(135deg, #052e16 0%, #166534 60%, #4ade80 100%)",
};

const FALLBACK_SWATCH =
  "linear-gradient(135deg, #71717a 0%, #3f3f46 100%)";

const CATEGORIES: ("all" | ToolCategory)[] = [
  "all",
  "color",
  "converter",
  "css",
  "image",
  "ai",
];

/**
 * The full directory as an explorer: search across every tool, filter by
 * category, and big visual cards instead of a text list. Ends with a tool
 * request form that posts to the existing feedback endpoint as a feature
 * request — the same inbox the floating widget uses.
 */
export function ToolsExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ToolCategory>("all");
  const [request, setRequest] = useState("");
  const [email, setEmail] = useState("");
  const [requestState, setRequestState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!q) return true;
      return `${tool.title} ${tool.navLabel} ${tool.blurb} ${tool.description}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, category]);

  const submitRequest = async () => {
    if (!request.trim() || requestState === "sending") return;
    setRequestState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "feature",
          message: `[Tool request] ${request.trim()}`,
          email: email.trim() || undefined,
          page: "/tools",
        }),
      });
      setRequestState(res.ok ? "sent" : "error");
      if (res.ok) {
        setRequest("");
        setEmail("");
      }
    } catch {
      setRequestState("error");
    }
  };

  return (
    <>
      {/* Search + category filters */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="tool-search" className="sr-only">
          Search tools
        </label>
        <input
          id="tool-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${TOOLS.length} tools… try “contrast” or “gradient”`}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:max-w-sm"
        />
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 ${
                category === c
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
              }`}
            >
              {c === "all" ? `All (${TOOLS.length})` : categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        Showing {results.length} of {TOOLS.length} tools
        {query.trim() ? ` for “${query.trim()}”` : ""}
        {category !== "all" ? ` in ${categoryLabel(category)}` : ""}.
      </p>

      {/* Visual card grid */}
      {results.length > 0 ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
              >
                <span
                  aria-hidden
                  className="block h-20 w-full"
                  style={{
                    background: SWATCHES[tool.href] ?? FALLBACK_SWATCH,
                  }}
                />
                <span className="flex flex-1 flex-col p-5">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold text-zinc-900 group-hover:underline group-hover:underline-offset-4 dark:text-zinc-100">
                      {tool.title}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500"
                    >
                      →
                    </span>
                  </span>
                  <span className="mt-1.5 block text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {tool.blurb}
                  </span>
                  <span className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                    {categoryLabel(tool.category)} · Free
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No tools match that search
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Try a different word — or request it below and we&apos;ll consider
            building it.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Tool request */}
      <section
        id="request"
        aria-labelledby="request-heading"
        className="mt-14 scroll-mt-20 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        <h2
          id="request-heading"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Can&apos;t find the tool you need?
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Tell us what it should do. Requests land in the same inbox as site
          feedback, and popular ones get built.
        </p>
        {requestState === "sent" ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          >
            Thanks — your tool request is in. We&apos;ll consider it alongside
            other feedback.
          </p>
        ) : (
          <div className="mt-4 max-w-xl">
            <label
              htmlFor="tool-request"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              What should the tool do?
            </label>
            <textarea
              id="tool-request"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="e.g. A tool that turns a screenshot into a Tailwind theme…"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <label htmlFor="tool-request-email" className="sr-only">
                Email (optional)
              </label>
              <input
                id="tool-request-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional, for follow-up)"
                className="h-10 flex-1 rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={submitRequest}
                disabled={!request.trim() || requestState === "sending"}
                className="h-10 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {requestState === "sending" ? "Sending…" : "Request this tool"}
              </button>
            </div>
            {requestState === "error" && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                Something went wrong — try again, or use the feedback button
                at the bottom-right.
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
