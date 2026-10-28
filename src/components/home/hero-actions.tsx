"use client";

import { LinkButton } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";

/**
 * Hero CTAs with funnel tracking. Go Pro stays out of the hero on purpose:
 * it already owns the header, and the hero's job is first value.
 */
export function HeroActions() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <LinkButton
        href="/design-system"
        variant="primary"
        className="px-6 py-3 text-base"
        onClick={() => track("hero_generator_clicked")}
      >
        Generate a design system
      </LinkButton>
      <LinkButton
        href="/audit"
        variant="secondary"
        className="px-6 py-3 text-base"
        onClick={() => track("hero_audit_clicked")}
      >
        Audit a website
      </LinkButton>
    </div>
  );
}
