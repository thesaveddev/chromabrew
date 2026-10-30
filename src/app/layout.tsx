import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Providers } from "@/components/providers";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { SiteJsonLd } from "@/components/site/site-json-ld";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    // The site-wide fallback, so it carries the same breadth as the home page:
    // Chromabrew is a color toolkit, of which the one-color generator is the
    // headline path rather than the whole product.
    default: "ChromaBrew — Free Color Tools & Design System Generator",
    template: "%s · ChromaBrew",
  },
  description:
    "Free browser-based color toolkit: palette generator, WCAG contrast checker, image color extraction, design tokens, Figma variables and plugin, and Tailwind v4 or shadcn/ui exports. Free, no account required.",
  keywords: [
    "color palette generator",
    "figma color palette generator",
    "figma design system generator",
    "figma variables",
    "figma design tokens",
    "figma plugin",
    "design system generator",
    "wcag contrast checker",
  ],
  openGraph: {
    type: "website",
    siteName: "ChromaBrew",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const noFlashScript = `(function(){try{var t=localStorage.getItem("cs-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

/** Google AdSense publisher id. Ad unit snippets in the page body reference it. */
export const ADSENSE_CLIENT_ID = "ca-pub-8157187960778729";

const adsenseLoaderSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

/**
 * Where ads belong: the production site, and nowhere else.
 *
 * - `next dev` is a development build, so local work makes no ad requests.
 * - A Vercel *preview* deployment is not the approved domain: loading the loader
 *   there only adds unfilled requests to the account's reports.
 * - A production build anywhere else (a self-hosted deployment) still renders
 *   it, so ads are not silently missing off Vercel.
 */
const adsEnabled =
  process.env.NODE_ENV === "production" &&
  (process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === "production");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        {/*
          AdSense's loader, rendered into the server HTML head on purpose.

          Google requires this exact snippet between the head tags of every page
          it serves ads on, and its site review reads the served HTML — a script
          injected after hydration can be missed. `async` keeps it off the
          critical path, so it never delays rendering or hydration.

          Rendered only where ads belong — see `adsEnabled` above. Nothing here
          depends on hydration, so the tag is in the HTML the review crawler
          reads, with the `async` and `crossorigin` attributes Google expects.
        */}
        {adsEnabled ? (
          <script async src={adsenseLoaderSrc} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <SiteJsonLd />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white dark:focus:bg-white dark:focus:text-zinc-900"
        >
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
          <FeedbackWidget />
        </Providers>
        {/* Self-hosted Umami analytics (stats.chromabrew.com). Rendered only
            when configured; builds without the env vars stay silent. */}
        {process.env.NEXT_PUBLIC_UMAMI_URL &&
        process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? (
          <script
            async
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        ) : null}
      </body>
    </html>
  );
}
