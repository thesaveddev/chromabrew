"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive hero dot field — design-system graph paper, made obvious.
 *
 * A full-bleed canvas grid that covers the whole hero (its parent is
 * `absolute inset-0`) and responds to the pointer: dots near the cursor
 * brighten, tint violet and swell slightly, while the whole layer drifts
 * with a gentle parallax. Idle state is a clearly visible dot grid, not
 * a whisper.
 *
 * Performance + a11y: single canvas, DPR-capped, rAF loop that pauses
 * offscreen; `prefers-reduced-motion` renders one static frame and
 * ignores the pointer.
 */
export function HeroDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
    if (!ctx) return;
    const g: CanvasRenderingContext2D = ctx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const SPACING = 22;
    const RADIUS = 1.4;
    const INFLUENCE = 140;
    let raf = 0;
    let running = true;
    let inView = true;
    let dark = document.documentElement.classList.contains("dark");
    let w = 0;
    let h = 0;

    // Pointer in canvas coords + eased copies for buttery settle.
    const target = { x: -9999, y: -9999 };
    const eased = { x: -9999, y: -9999 };
    const parallax = { x: 0, y: 0 };
    const parallaxTarget = { x: 0, y: 0 };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced.matches) draw(performance.now());
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      // Parallax: -1..1 across the hero, eased in the loop.
      parallaxTarget.x = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      parallaxTarget.y = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };

    const onLeave = () => {
      target.x = -9999;
      target.y = -9999;
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
    };

    const observer = new MutationObserver(() => {
      dark = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && running && !reduced.matches && !raf) loop();
      },
      { threshold: 0 }
    );
    io.observe(parent);

    const dotColor = (alpha: number, hot: number) => {
      // Hot dots near the cursor pick up a violet tint; idle dots stay neutral.
      if (hot > 0.01) {
        return dark
          ? `rgba(167,139,250,${(0.28 + hot * 0.62).toFixed(3)})`
          : `rgba(109,40,217,${(0.24 + hot * 0.56).toFixed(3)})`;
      }
      return dark ? `rgba(255,255,255,${alpha.toFixed(3)})` : `rgba(24,24,27,${alpha.toFixed(3)})`;
    };

    function draw(now: number) {
      g.clearRect(0, 0, w, h);
      const drift = reduced.matches ? 0 : Math.sin(now / 2400) * 3;
      const ox = parallax.x * 10;
      const oy = parallax.y * 8 + drift;

      const baseAlpha = dark ? 0.22 : 0.2;
      g.save();
      g.translate(ox, oy);
      // Overdraw slightly so parallax never exposes an edge.
      for (let y = -SPACING; y < h + SPACING * 2; y += SPACING) {
        for (let x = -SPACING; x < w + SPACING * 2; x += SPACING) {
          const dx = x - (eased.x - ox);
          const dy = y - (eased.y - oy);
          const dist = Math.hypot(dx, dy);
          const hot = dist < INFLUENCE ? 1 - dist / INFLUENCE : 0;
          const easedHot = hot * hot;
          const r = RADIUS + easedHot * 1.6;
          g.beginPath();
          g.fillStyle = dotColor(baseAlpha, easedHot);
          g.arc(x, y, r, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
    }

    function loop() {
      raf = 0;
      if (!running || !inView) return;
      // Ease pointer + parallax toward their targets for a premium settle.
      eased.x += (target.x - eased.x) * 0.12;
      eased.y += (target.y - eased.y) * 0.12;
      parallax.x += (parallaxTarget.x - parallax.x) * 0.06;
      parallax.y += (parallaxTarget.y - parallax.y) * 0.06;
      draw(performance.now());
      raf = requestAnimationFrame(loop);
    }

    const onReduced = () => {
      if (reduced.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        onLeave();
        eased.x = -9999;
        eased.y = -9999;
        draw(performance.now());
      } else if (inView && running && !raf) {
        loop();
      }
    };
    reduced.addEventListener("change", onReduced);

    resize();
    window.addEventListener("resize", resize);
    // Listen on the hero section so the field reacts across the full height.
    const section = parent.closest("section") ?? parent;
    section.addEventListener("pointermove", onMove as EventListener, { passive: true });
    section.addEventListener("pointerleave", onLeave);

    if (!reduced.matches) loop();
    else draw(performance.now());

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      io.disconnect();
      reduced.removeEventListener("change", onReduced);
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", onMove as EventListener);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
