import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ZERO_REFINEMENT } from "@/lib/design-system";
import { RefinementPanel } from "./refinement-panel";

/**
 * The refinement panel.
 *
 * Contrast joined brightness, saturation, hue and temperature, and it has to
 * be a first-class sibling: the same row shape, the same signed read-out,
 * and — the part a glance at the markup misses — the same participation in
 * the active state, so a panel with *only* contrast moved still offers
 * Reset. That the Reset payload includes `contrast: 0` is enforced by the
 * type system rather than asserted here: the literal it sends is a complete
 * `Refinement`.
 *
 * Rendered to static markup, as the audit components' tests do.
 */
function render(refinement = ZERO_REFINEMENT): string {
  return renderToStaticMarkup(
    createElement(RefinementPanel, { refinement, palette: [], onChange: () => {} }),
  );
}

describe("RefinementPanel", () => {
  it("offers all five dials", () => {
    const html = render();
    for (const key of ["brightness", "contrast", "saturation", "hueShift", "temperature"]) {
      expect(html).toContain(`id="refine-${key}"`);
    }
  });

  it("reads out the contrast value with sign and unit like its siblings", () => {
    expect(render({ ...ZERO_REFINEMENT, contrast: 25 })).toContain("+25%");
    expect(render({ ...ZERO_REFINEMENT, contrast: -25 })).toContain("-25%");
    expect(render({ ...ZERO_REFINEMENT, contrast: 25 })).toContain("Contrast");
  });

  it("shows Reset when contrast alone is off zero, and hides it at zero", () => {
    expect(render({ ...ZERO_REFINEMENT, contrast: 10 })).toContain("Reset");
    expect(render()).not.toContain("Reset");
  });
});
