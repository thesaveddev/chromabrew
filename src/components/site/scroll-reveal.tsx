"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealTag = "div" | "li" | "article";

interface ScrollRevealProps {
  children: ReactNode;
  as?: RevealTag;
  className?: string;
  /** Stagger offset in ms — caller passes (i % n) * step. */
  delay?: number;
}

/**
 * Scroll-driven entrance: fades + rises once when the element scrolls into
 * view, then stays put. The delay prop creates the stagger; the CSS in
 * globals.css owns the motion and disables it under
 * prefers-reduced-motion, matching the ribbon/scanner patterns.
 */
export function ScrollReveal({
  children,
  as = "div",
  className,
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | HTMLLIElement | HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;
  const combined = className ? `reveal ${className}` : "reveal";

  if (as === "li") {
    return (
      <li ref={ref as React.Ref<HTMLLIElement>} className={combined} style={style}>
        {children}
      </li>
    );
  }
  if (as === "article") {
    return (
      <article ref={ref as React.Ref<HTMLElement>} className={combined} style={style}>
        {children}
      </article>
    );
  }
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={combined} style={style}>
      {children}
    </div>
  );
}
