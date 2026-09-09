"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export function ToolSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? TOOLS.filter((tool) =>
        `${tool.navLabel} ${tool.title} ${tool.blurb} ${tool.description}`
          .toLowerCase()
          .includes(trimmed),
      ).slice(0, 8)
    : [];

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="relative hidden md:block">
      <label htmlFor="tool-search" className="sr-only">
        Search tools
      </label>
      <input
        ref={inputRef}
        id="tool-search"
        type="search"
        placeholder="Search tools…"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="tool-search-listbox"
        aria-activedescendant={open && results[active] ? `tool-search-${results[active].href.replace(/\//g, "-")}` : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
            inputRef.current?.blur();
          } else if (event.key === "ArrowDown" && results.length) {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (event.key === "ArrowUp" && results.length) {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter" && results[active]) {
            event.preventDefault();
            go(results[active].href);
          }
        }}
        className="h-9 w-44 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:outline-zinc-100 lg:w-56"
      />

      {open && results.length > 0 ? (
        <ul
          id="tool-search-listbox"
          role="listbox"
          className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {results.map((tool, index) => (
            <li key={tool.href} role="option" aria-selected={index === active}>
              <button
                id={`tool-search-${tool.href.replace(/\//g, "-")}`}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  go(tool.href);
                }}
                onMouseEnter={() => setActive(index)}
                className={`block w-full px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 ${
                  index === active ? "bg-zinc-100 dark:bg-zinc-800" : ""
                }`}
              >
                <span className="block font-medium text-zinc-800 dark:text-zinc-200">
                  {tool.title}
                </span>
                <span className="block truncate text-xs text-zinc-500">{tool.blurb}</span>
              </button>
            </li>
          ))}
          <li className="border-t border-zinc-200 dark:border-zinc-700">
            <Link
              href="/tools"
              onMouseDown={(event) => {
                event.preventDefault();
                go("/tools");
              }}
              className="block px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              All {TOOLS.length} tools →
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  );
}