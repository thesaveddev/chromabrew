import { JsonLd } from "./json-ld";
import { siteUrl } from "@/lib/site-url";

/** Site-wide entity graph: rendered once per page from the root layout. */
export function SiteJsonLd() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ChromaBrew",
          url: siteUrl,
          description:
            "Free color palette generator and design system tool: accessible palettes, semantic tokens, light and dark themes, and production-ready code from one color.",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ChromaBrew",
          url: siteUrl,
          logo: `${siteUrl}/favicon.svg`,
          contactPoint: {
            "@type": "ContactPoint",
            email: "hello@chromabrew.com",
            contactType: "customer support",
            url: `${siteUrl}/contact`,
          },
          sameAs: [],
        }}
      />
    </>
  );
}
