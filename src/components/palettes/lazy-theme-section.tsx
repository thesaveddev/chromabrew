"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mounts a below-the-fold theme section only when it nears the viewport.
 * The server renders a lightweight skeleton (small HTML, no layout work),
 * and the real cards mount once scrolled within 800px. `eager` skips the
 * wait for the first section so above-the-fold content never flashes.
 * `cv-auto` additionally lets the browser skip rendering offscreen sections.
 */
export function LazyThemeSection({
  children,
  eager = false,
}: {
  children: ReactNode;
  eager?: boolean;
}) {
  // Server and hydration both render the skeleton for non-eager sections,
  // so the initial HTML stays small; the effect below reveals on scroll.
  // (Reading IntersectionObserver here would be true on the server and
  // defeat the purpose — every section would render immediately.)
  const [visible, setVisible] = useState(eager);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <section ref={ref} className="cv-auto mt-12">
      {visible ? (
        children
      ) : (
        <div aria-hidden className="lazy-skeleton animate-pulse">
          <div className="h-7 w-52 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-1 h-4 w-72 max-w-full rounded bg-zinc-100 dark:bg-zinc-800/70" />
          <div className="mt-3 h-12 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800/70" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="h-36 rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
            <div className="h-36 rounded-xl bg-zinc-100 dark:bg-zinc-800/70" />
          </div>
        </div>
      )}
    </section>
  );
}
