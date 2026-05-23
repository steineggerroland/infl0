import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL

if (!baseURL) {
  throw new Error(
    'PLAYWRIGHT_BASE_URL is required for remote smoke tests. Set it to the deployed infl0 URL.',
  )
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'remote-public-smoke',
      use: { ...devices['Desktop Chrome'] },
      testMatch: 'a11y-layout-smoke.spec.ts',
    },
    {
      name: 'remote-authed-smoke',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/dev.json',
      },
      testMatch: 'authed/settings-smoke.spec.ts',
    },
  ],
})
