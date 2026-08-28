import { defineConfig, devices } from "@playwright/test";

// Tests run against the real static export served on the configured basePath,
// so anchor/asset regressions caused by `basePath` show up here.
const BASE_PATH = "/deti-plus-26";
const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
    trace: "on-first-retry",
  },
  webServer: {
    command: `node scripts/serve-export.mjs`,
    env: { PORT: String(PORT), BASE_PATH },
    url: `http://127.0.0.1:${PORT}${BASE_PATH}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
