import type { Metadata } from "next";
import { FastGenerator } from "@/components/generate/fast-generator";
import { defaultOgImage } from "@/lib/og";

export const metadata: Metadata = {
  title: "Fast Palette Generator",
  description:
    "Press space to generate instant color palettes. Lock the colors you love, tune hue, brightness, vibrance and contrast, copy any hex, and share the palette as a link — free, no sign-up.",
  alternates: { canonical: "/generate" },
  openGraph: {
    title: "Fast Palette Generator · ChromaBrew",
    description:
      "Press space, lock the keepers, tune the feel, copy the hex. Instant palettes with shareable links.",
    url: "/generate",
    type: "website",
    images: [defaultOgImage],
  },
  robots: { index: true },
};

/**
 * An app-like route: the generator owns the whole viewport below the header
 * (100dvh minus the 3.5rem bar), so nothing on this page scrolls as a document —
 * the palette column scrolls internally on narrow screens instead. The site
 * footer steps aside here for the same reason (see SiteFooter).
 */
export default function GeneratePage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col overflow-hidden">
      <FastGenerator />
    </div>
  );
}
