import { describe, expect, it } from "vitest";
import { BRAND_PALETTES, BRAND_SECTORS } from "./brand-palettes";
import { isValidHex } from "./design-system/colour/convert";

describe("brand palettes dataset", () => {
  it("has a substantial, non-empty catalogue", () => {
    expect(BRAND_PALETTES.length).toBeGreaterThanOrEqual(60);
  });

  it("uses valid hex colours throughout", () => {
    for (const brand of BRAND_PALETTES) {
      expect(isValidHex(brand.hex), brand.name).toBe(true);
    }
  });

  it("keeps brand names unique", () => {
    const names = BRAND_PALETTES.map((b) => b.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("only uses declared sectors", () => {
    const sectors = new Set<string>(BRAND_SECTORS);
    for (const brand of BRAND_PALETTES) {
      expect(sectors.has(brand.sector), `${brand.name} has sector ${brand.sector}`).toBe(true);
    }
  });

  it("covers every declared sector with at least one brand", () => {
    const used = new Set(BRAND_PALETTES.map((b) => b.sector));
    for (const sector of BRAND_SECTORS) {
      expect(used.has(sector), sector).toBe(true);
    }
  });
});