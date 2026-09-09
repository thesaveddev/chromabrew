import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Brand color palettes",
  description:
    "Real brand color palettes from 110+ well-known products, ready to copy or seed a design system generator.",
  alternates: { canonical: "/tools/brand-palettes" },
  robots: { index: false },
};

export default function Page() {
  permanentRedirect("/tools/brand-palettes");
  return null;
}