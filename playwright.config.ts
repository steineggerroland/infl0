import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4275',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'onboarding-setup',
      testMatch: 'onboarding-auth.setup.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/authed\//, /auth\.setup\.ts$/, /onboarding\//, /onboarding-auth\.setup\.ts$/],
    },
    {
      name: 'chromium-authed',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/dev.json',
      },
      testMatch: 'authed/**/*.spec.ts',
    },
    {
      name: 'chromium-onboarding',
      dependencies: ['onboarding-setup'],
      // The setup spec writes one storage-state file per worker
      // (`onboarding-<workerIndex>.json`); a single project-wide
      // `storageState` cannot multiplex that. We pin the project to
      // one worker so the storage path stays predictable. Future
      // parallelism (per the e2e-strategy.md follow-up) can lift
      // this constraint via a per-test fixture.
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/onboarding-0.json',
      },
      testMatch: 'onboarding/**/*.spec.ts',
    },
  ],
})
