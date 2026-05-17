import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { postCrawlerSourceHealth } from '../support/crawler-fixtures.js'
import { rememberFeedFromRow, sourceRow } from '../support/ui-helpers.js'

/**
 * Open the row’s `<details>` without relying on double-click semantics.
 */
async function ensureSourceRowExpanded(row) {
  const details = row.locator('details')
  await expect(details).toBeVisible()
  await details.evaluate((/** @type {HTMLDetailsElement} */ el) => {
    if (!el.open) el.open = true
  })
}

When('I open the sources page', async function () {
  await this.page.goto('/feeds')
  await expect(this.page).toHaveURL(/\/feeds/u)
})

Then('I should see the empty sources hint', async function () {
  await expect(this.page.getByTestId('feeds-empty-alert')).toBeVisible({ timeout: 15_000 })
})

When(
  'I add a source with address {string} and display name {string}',
  { timeout: 120_000 },
  async function (address, displayName) {
    await expect(this.page.getByTestId('feeds-add-fieldset')).toBeVisible({ timeout: 30_000 })

    // Prefer `#feed-*` over `getByLabel`: Daisy label markup + i18n vary in how Chromium exposes names.
    await this.page.locator('#feed-url-input').fill(address)
    await this.page.locator('#feed-display-input').fill(displayName)

    const submit = this.page.locator('[data-testid="feeds-add-fieldset"] button[type="submit"]')
    const errorAlert = this.page.getByTestId('feeds-add-error')
    const row = sourceRow(this.page, address)

    await expect(submit).toBeEnabled({ timeout: 30_000 })
    await submit.scrollIntoViewIfNeeded()
    await submit.click()

    // User-visible outcome: row appears or the form shows an error (not Playwright network hooks).
    await expect
      .poll(
        async () => {
          if (await errorAlert.isVisible()) return 'error'
          if ((await row.count()) > 0) return 'ok'
          return 'pending'
        },
        { timeout: 90_000 },
      )
      .not.toBe('pending')

    if (await errorAlert.isVisible()) {
      throw new Error(`Add source failed in UI: ${await errorAlert.textContent()}`)
    }

    await expect(row).toBeVisible({ timeout: 15_000 })
    await rememberFeedFromRow(this.page, this, address)
  },
)

Then('I should see the source list containing {string}', async function (snippet) {
  const list = this.page.getByTestId('feeds-source-list')
  await expect(list).toBeVisible({ timeout: 15_000 })
  await expect(list.getByText(snippet, { exact: false })).toBeVisible()
})

When('I remove the source row for {string}', async function (snippet) {
  const row = sourceRow(this.page, snippet)
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Remove' }).click()
  await expect(this.page.getByTestId('feeds-empty-alert')).toBeVisible({ timeout: 20_000 })
})

Given('the crawler API key is configured', function () {
  if (!process.env.NUXT_CRAWLER_API_KEY?.trim()) {
    throw new Error(
      'NUXT_CRAWLER_API_KEY is required for crawler BDD steps (merge .env.e2e into env for test:bdd).',
    )
  }
})

When(
  'I post crawler source health for the last added source as {string}',
  async function (healthStatus) {
    const crawlKey = this.lastCrawlKey
    if (!crawlKey) {
      throw new Error('No last added source — run the add-source step first (lastCrawlKey missing).')
    }
    await postCrawlerSourceHealth(this.page, {
      crawlKey,
      sourceStatus: 'ready',
      sourceHealthStatus: healthStatus,
    })
    await this.page.reload()
  },
)

Then(
  'the feed row for {string} should have source health {string}',
  async function (snippet, expectedAttr) {
    const row = sourceRow(this.page, snippet)
    const health = row.getByTestId('feed-source-health')
    await expect(health).toBeVisible()
    await expect(health).toHaveAttribute('data-source-health', expectedAttr)
  },
)

When('I expand the source row for {string}', async function (snippet) {
  const row = sourceRow(this.page, snippet)
  await expect(row).toBeVisible()
  await ensureSourceRowExpanded(row)
})

Then(
  'the expanded health label for {string} should include {string}',
  async function (snippet, substring) {
    const row = sourceRow(this.page, snippet)
    await ensureSourceRowExpanded(row)
    const label = row.getByTestId('feed-source-health-label')
    await expect(label).toBeVisible({ timeout: 15_000 })
    await expect(label).toContainText(substring)
  },
)

When('I pause the source row for {string}', async function (snippet) {
  const row = sourceRow(this.page, snippet)
  await expect(row).toBeVisible()
  const toggle = row.locator('button[data-testid^="feed-toggle-"]')
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(row).toHaveAttribute('data-active', 'false', { timeout: 25_000 })
})

When('I resume the source row for {string}', async function (snippet) {
  const row = sourceRow(this.page, snippet)
  await expect(row).toBeVisible()
  const toggle = row.locator('button[data-testid^="feed-toggle-"]')
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(row).toHaveAttribute('data-active', 'true', { timeout: 25_000 })
})

Then('the source row for {string} should be active', async function (snippet) {
  const row = sourceRow(this.page, snippet)
  await expect(row).toHaveAttribute('data-active', 'true')
})

Then('the source row for {string} should be paused', async function (snippet) {
  const row = sourceRow(this.page, snippet)
  await expect(row).toHaveAttribute('data-active', 'false')
})

Then('I should see the sources list heading', async function () {
  await expect(this.page.locator('#feeds-list-heading')).toBeVisible({ timeout: 15_000 })
})
