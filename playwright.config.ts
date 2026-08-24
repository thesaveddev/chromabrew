import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  retries: 0,
  // Three engine processes compiling the same chunks starve each other on
  // this machine — cap parallelism so cold-start latency stays bounded.
  workers: process.env.CI ? undefined : 2,
  use: {
    baseURL: "http://localhost:3123",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "npx next start -p 3123",
    port: 3123,
    timeout: 120_000,
    reuseExistingServer: false,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
