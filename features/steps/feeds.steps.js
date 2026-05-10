import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

/**
 * Locate a single source row in the list by matching visible text (URL or title).
 */
function sourceRow(page, snippet) {
  return page.locator('[data-testid="feeds-source-list"] li').filter({ hasText: snippet })
}

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

/**
 * Same-origin fetch so session cookies are sent (matches Playwright e2e helpers).
 */
async function browserFetchJson(page, path, init = {}) {
  const { method = 'GET', body, headers = {} } = init
  return page.evaluate(
    async ({ path: urlPath, method: m, body: b, headers: h }) => {
      const hasBody = b !== undefined && b !== null
      const res = await fetch(urlPath, {
        method: m,
        credentials: 'include',
        headers: {
          ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
          ...h,
        },
        ...(hasBody ? { body: JSON.stringify(b) } : {}),
      })
      const text = await res.text()
      let data = null
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          data = null
        }
      }
      return { ok: res.ok, status: res.status, data, text }
    },
    { path, method, body: body ?? null, headers },
  )
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

    const responsePromise = this.page.waitForResponse(
      (res) => {
        if (res.request().method() !== 'POST') return false
        try {
          const path = new URL(res.url()).pathname.replace(/\/$/, '')
          return path === '/api/feeds'
        } catch {
          return false
        }
      },
      { timeout: 75_000 },
    )

    await this.page.locator('[data-testid="feeds-add-fieldset"] button[type="submit"]').click()

    const postRes = await responsePromise
    if (!postRes.ok()) {
      const body = await postRes.text().catch(() => '')
      throw new Error(`POST /api/feeds failed (${postRes.status()}): ${body}`)
    }

    const payload = await postRes.json().catch(() => null)
    if (payload?.feed?.crawlKey) {
      this.lastCrawlKey = payload.feed.crawlKey
      this.lastFeedId = payload.feed.id
    }

    await expect(this.page.getByTestId('feeds-add-error')).toHaveCount(0)
    await expect(this.page.getByTestId('feeds-source-list')).toBeVisible({ timeout: 30_000 })
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
    const key = process.env.NUXT_CRAWLER_API_KEY?.trim()
    if (!key) {
      throw new Error('NUXT_CRAWLER_API_KEY is not set')
    }
    const crawlKey = this.lastCrawlKey
    if (!crawlKey) {
      throw new Error('No last added source — run the add-source step first (lastCrawlKey missing).')
    }
    const res = await browserFetchJson(this.page, '/api/crawler/source-status', {
      method: 'POST',
      headers: { 'X-Crawler-Key': key },
      body: {
        crawlKey,
        sourceStatus: 'ready',
        sourceHealthStatus: healthStatus,
      },
    })
    if (!res.ok) {
      throw new Error(`POST /api/crawler/source-status failed (${res.status}): ${res.text}`)
    }
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
