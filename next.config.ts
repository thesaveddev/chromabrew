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
};

export default nextConfig;
