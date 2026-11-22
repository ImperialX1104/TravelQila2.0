import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:3000",
    viewport: { width: 1365, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: [
    {
      command: "npm run start -- --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ""
      }
    },
    {
      command: "node tests/qa-static-server.js",
      url: "http://127.0.0.1:3001/index.html",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { QA_ROOT: process.env.QA_ROOT || ".." }
    }
  ]
});
