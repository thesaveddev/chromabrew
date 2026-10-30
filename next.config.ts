import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `axe-core` must not be bundled into the server output.
   *
   * The engine exposes the script it runs inside the scanned page by calling
   * `Function.prototype.toString()` on its own IIFE:
   *
   *   axe.source = "(" + axeFunction.toString() + ")(typeof window === 'object' ? window : this);"
   *
   * A bundler renames and minifies that function, so the serialised body starts
   * referring to the bundler's own module parameters — the injected script then
   * dies in the page with "ReferenceError: t is not defined" the moment it runs.
   * Keeping the package external means Node requires the published file, whose
   * function stringifies to exactly what axe intends to inject.
   *
   * (`playwright` is already external by default, but it is listed here so the
   * renderer's dependency contract is stated in one place.)
   */
  serverExternalPackages: ["axe-core", "playwright"],

  /**
   * One canonical host: `www.chromabrew.com`.
   *
   * `SITE_URL` names it, every canonical, sitemap `<loc>` and OG URL follows,
   * and it is the host search engines actually have indexed. The apex used to
   * answer 200 with a second copy of the same pages, so the two hosts could
   * disagree — Google picked `www` on its own, but nothing here enforced it.
   * A permanent redirect makes the apex state its preference instead of
   * leaving consolidation to the crawler.
   *
   * Matched on the Host header, so it holds wherever the request lands
   * (bare IP, preview origin, `www` itself never matches). Query strings are
   * carried over by Next when the destination declares none.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "chromabrew.com" }],
        destination: "https://www.chromabrew.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
