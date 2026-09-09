"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BRAND_PALETTES, BRAND_SECTORS } from "@/lib/brand-palettes";
import { CopyButton, TabList } from "@/components/ui/primitives";

/**
 * Browse reference brand colours, copy them, or start a full design
 * system generation from one as the primary seed.
 */
export function BrandPalettes() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BRAND_PALETTES.filter((brand) => {
      if (sector && brand.sector !== sector) return false;
      if (q && !brand.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, sector]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-xs">
          <label htmlFor="brand-search" className="sr-only">
            Search brands
          </label>
          <input
            id="brand-search"
            type="search"
            autoComplete="off"
            placeholder="Search brands… e.g. Stripe"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:outline-zinc-100"
          />
        </div>
        <TabList
          label="Filter by sector"
          size="sm"
          value={sector}
          onChange={setSector}
          options={[{ id: "", label: "All" }, ...BRAND_SECTORS.map((s) => ({ id: s, label: s }))]}
        />
      </div>

      <p className="text-xs text-zinc-500" role="status">
        {results.length} of {BRAND_PALETTES.length} brands
      </p>

      {results.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((brand) => (
            <li key={brand.name}>
              <BrandCard name={brand.name} hex={brand.hex} sector={brand.sector} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No brands match that search. Try a sector filter or a different
          spelling.
        </p>
      )}

      <p className="text-xs leading-5 text-zinc-500">
        These are widely published reference values, not official brand
        guidelines. Always confirm the current colour with the brand&apos;s own
        materials before shipping anything in their identity.{" "}
        <Link
          href="/design-system"
          className="font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Open the design system generator
        </Link>{" "}
        to build an accessible palette and full theme from any seed.
      </p>
    </div>
  );
}

function BrandCard({ name, hex, sector }: { name: string; hex: string; sector: string }) {
  const light = relativeLuma(hex) > 0.5;
  const seedHref = `/design-system?primary=${hex.slice(1)}`;
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative flex h-16 items-end px-3 pb-2 pt-3" style={{ backgroundColor: hex }}>
        <span className={`text-sm font-semibold ${light ? "text-zinc-900" : "text-white"}`}>{name}</span>
        <span
          className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-medium backdrop-blur ${
            light ? "bg-white/70 text-zinc-700" : "bg-black/25 text-white"
          }`}
        >
          {sector}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <code className="font-mono text-sm uppercase text-zinc-800 dark:text-zinc-200">{hex}</code>
        <CopyButton value={hex.toUpperCase()} label="Copy" className="!px-2 !py-1 text-[11px]" />
      </div>
      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <Link
          href={seedHref}
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
        >
          Use as seed
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function relativeLuma(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}