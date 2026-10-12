import { contrastRatio } from "@/lib/design-system/colour/contrast";

export interface ContrastIssue {
  element: {
    selector: string;
    text: string;
  };
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAALarge: boolean;
}

export function checkContrast(
  foreground: string,
  background: string
): { ratio: number; passesAA: boolean; passesAALarge: boolean } {
  try {
    const ratio = contrastRatio(foreground, background);
    return {
      ratio: Math.round(ratio * 100) / 100,
      passesAA: ratio >= 4.5,
      passesAALarge: ratio >= 3.0,
    };
  } catch {
    return {
      ratio: 0,
      passesAA: false,
      passesAALarge: false,
    };
  }
}
