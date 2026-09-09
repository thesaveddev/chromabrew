import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "HEX to HSL converter",
  description:
    "Convert HEX to HSL instantly. The unified Color Converter shows HEX, RGB, HSL and OKLCH equivalents at once.",
  alternates: { canonical: "/tools/color-converter" },
  robots: { index: false },
};

export default function Page() {
  permanentRedirect("/tools/color-converter");
  return null;
}