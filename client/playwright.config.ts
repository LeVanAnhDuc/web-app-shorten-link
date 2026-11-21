import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * E2E runs against the real app: client on :3300 and server on :5300 (with
 * PostgreSQL). Start the server yourself; Playwright starts or reuses Vite.
 * Chromium only in P1 — clipboard permissions exist only there (design DR-11).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3300',
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    port: 3300,
    reuseExistingServer: true,
  },
})
