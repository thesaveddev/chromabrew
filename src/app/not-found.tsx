import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        The link may be old or mistyped. The generator and the free tools are
        all one click away.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Back home
        </Link>
        <Link
          href="/design-system"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
        >
          Open the generator
        </Link>
      </div>
      <ul className="mt-10 flex flex-wrap justify-center gap-2">
        {TOOLS.slice(0, 5).map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="inline-block rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
            >
              {tool.navLabel}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
