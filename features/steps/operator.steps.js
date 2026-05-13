import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

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

Given('I am signed in as seeded operator', async function () {
  if (!this.browser) throw new Error('Browser not initialized.')
  if (this.page) await this.page.close()
  if (this.context) await this.context.close()

  this.context = await this.browser.newContext({
    baseURL: this.baseURL,
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  this.page = await this.context.newPage()

  const email = process.env.OPERATOR_LOGIN_EMAIL?.trim()
  const password = process.env.OPERATOR_LOGIN_PASSWORD?.trim()
  if (!email || !password) {
    throw new Error(
      'OPERATOR_LOGIN_EMAIL and OPERATOR_LOGIN_PASSWORD are required for seeded operator login.',
    )
  }

  await this.page.goto('/login')
  await this.page.getByLabel('Email').fill(email)
  await this.page.locator('input[autocomplete="current-password"]').fill(password)
  await Promise.all([
    this.page.waitForURL(/\/(\?|$)/u),
    this.page.getByRole('button', { name: 'Sign in' }).click(),
  ])
})

Given('I post operator source status fixtures', async function () {
  const key = process.env.NUXT_CRAWLER_API_KEY?.trim()
  if (!key) throw new Error('NUXT_CRAWLER_API_KEY is not set')

  const fixtures = [
    {
      crawlKey: 'https://example.com/operator-blocked.xml',
      sourceStatus: 'ready',
      sourceHealthStatus: 'blocked',
      operatorAttention: true,
      operatorAttentionReason: 'blocked fixture',
      crawlCandidateCount: 4,
      crawlProcessedCount: 0,
      crawlSkippedCount: 0,
      crawlFetchErrorCount: 4,
      crawlLlmFailedCount: 1,
      sourceHealthJson: { statusCode: 403, retryAfter: '600', cacheControl: 'no-store' },
    },
    {
      crawlKey: 'https://example.com/operator-healthy.xml',
      sourceStatus: 'ready',
      sourceHealthStatus: 'healthy',
      operatorAttention: false,
      operatorAttentionReason: null,
      crawlCandidateCount: 8,
      crawlProcessedCount: 8,
      crawlSkippedCount: 0,
      crawlFetchErrorCount: 0,
      crawlLlmFailedCount: 0,
    },
    {
      crawlKey: 'https://example.com/operator-quiet.xml',
      sourceStatus: 'ready',
      sourceHealthStatus: 'quiet',
      operatorAttention: false,
      operatorAttentionReason: null,
      crawlCandidateCount: 1,
      crawlProcessedCount: 1,
      crawlSkippedCount: 0,
      crawlFetchErrorCount: 0,
      crawlLlmFailedCount: 0,
    },
  ]

  for (const body of fixtures) {
    const res = await browserFetchJson(this.page, '/api/crawler/source-status', {
      method: 'POST',
      headers: { 'X-Crawler-Key': key },
      body,
    })
    if (!res.ok) {
      throw new Error(`POST /api/crawler/source-status failed (${res.status}): ${res.text}`)
    }
  }
})

When('I open the operator sources page', async function () {
  await this.page.goto('/operator/sources')
})

Then('I should see operator access denied', async function () {
  await expect(
    this.page.getByRole('heading', { name: /operator access denied/i }),
  ).toBeVisible({ timeout: 15_000 })
})

Then('I should see the operator sources summary band', async function () {
  await expect(
    this.page.getByRole('heading', { level: 1, name: 'Operator · sources' }),
  ).toBeVisible({ timeout: 20_000 })
  await expect(this.page.getByTestId('operator-summary-total')).toBeVisible()
  await expect(this.page.getByTestId('operator-summary-attention')).toBeVisible()
})

Then('operator attention sources should be listed first', async function () {
  const table = this.page.getByTestId('operator-sources-table')
  const blockedRow = table.locator('tbody tr').filter({ hasText: 'https://example.com/operator-blocked.xml' }).first()
  const healthyRow = table.locator('tbody tr').filter({ hasText: 'https://example.com/operator-healthy.xml' }).first()
  await expect(blockedRow).toBeVisible()
  await expect(blockedRow).toContainText('Attention')
  await expect(healthyRow).toBeVisible()

  const { blockedIndex, healthyIndex } = await this.page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[data-testid="operator-sources-table"] tbody tr'))
    const indexOf = (substr) => rows.findIndex((tr) => (tr.textContent ?? '').includes(substr))
    return {
      blockedIndex: indexOf('https://example.com/operator-blocked.xml'),
      healthyIndex: indexOf('https://example.com/operator-healthy.xml'),
    }
  })
  if (blockedIndex < 0 || healthyIndex < 0) {
    throw new Error(`Expected fixture rows in table (blockedIndex=${blockedIndex}, healthyIndex=${healthyIndex})`)
  }
  expect(blockedIndex).toBeLessThan(healthyIndex)
})

Then('the operator sources table should show rows', async function () {
  const rows = this.page.locator('[data-testid="operator-sources-table"] tbody tr')
  await expect(rows.first()).toBeVisible()
})

When('I activate the operator filter {string}', async function (label) {
  await this.page.getByRole('button', { name: label }).click()
})

Then('the operator table should include source key {string}', async function (crawlKey) {
  await expect(this.page.locator('[data-testid="operator-sources-table"]')).toContainText(crawlKey)
})

Then('the operator table should not include source key {string}', async function (crawlKey) {
  await expect(this.page.locator('[data-testid="operator-sources-table"]')).not.toContainText(crawlKey)
})

