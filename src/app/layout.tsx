import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Providers } from "@/components/providers";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
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
    default: "ChromaBrew — Turn one color into an entire design system",
    template: "%s · ChromaBrew",
  },
  description:
    "Generate accessible palettes, semantic tokens, light and dark themes, and production-ready code from a single color. Free, no account required.",
  openGraph: {
    type: "website",
    siteName: "ChromaBrew",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

const noFlashScript = `(function(){try{var t=localStorage.getItem("cs-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
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
        {/* Analytics only load on Vercel deployments; local/dev stays silent. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
