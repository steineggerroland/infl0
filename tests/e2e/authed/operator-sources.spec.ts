import { test, expect, type Page } from '@playwright/test'
import { loadE2eMergedEnv } from '../load-e2e-env'

async function browserFetchJson(
  page: Page,
  path: string,
  init: {
    method?: string
    body?: Record<string, unknown>
    headers?: Record<string, string>
  } = {},
): Promise<{ ok: boolean; status: number; data: unknown; text: string }> {
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
      let data: unknown = null
      if (text) {
        try {
          data = JSON.parse(text) as unknown
        } catch {
          data = null
        }
      }
      return { ok: res.ok, status: res.status, data, text }
    },
    { path, method, body: body ?? null, headers },
  )
}

async function expectOperatorFilter(
  page: Page,
  filter: 'blocked' | 'quiet',
  includedCrawlKey: string,
  excludedCrawlKey: string,
) {
  await expect(page).toHaveURL(new RegExp(`[?&]filter=${filter}(?:&|$)`, 'u'))
  const table = page.getByTestId('operator-sources-table')
  const rows = table.locator('tbody tr')
  const includedRow = rows.filter({ hasText: includedCrawlKey }).first()
  await expect(includedRow).toBeVisible({ timeout: 20_000 })
  await expect
    .poll(
      async () =>
        rows.evaluateAll(
          (visibleRows, expectedFilter) =>
            visibleRows
              .filter((row) => row.textContent?.trim())
              .every((row) => row.getAttribute('data-health') === expectedFilter),
          filter,
        ),
      { timeout: 20_000 },
    )
    .toBe(true)
  await expect(table).not.toContainText(excludedCrawlKey)
}

test.describe('operator sources page (signed in)', () => {
  test.beforeAll(() => {
    loadE2eMergedEnv()
  })

  test('shows summary and filter behavior for operator fixtures', async ({ page }) => {
    test.setTimeout(60_000)
    const crawlerKeyRaw = process.env.NUXT_CRAWLER_API_KEY?.trim()
    const operatorEmailsRaw = process.env.NUXT_OPERATOR_EMAILS?.trim()
    test.skip(!crawlerKeyRaw, 'NUXT_CRAWLER_API_KEY not set')
    test.skip(!operatorEmailsRaw, 'NUXT_OPERATOR_EMAILS not set')
    const crawlerKey = crawlerKeyRaw as string

    await page.goto('/operator/sources')
    await expect(page.getByTestId('operator-sources-table')).toBeVisible({ timeout: 20_000 })

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const blockedCrawlKey = `https://e2e-infl0.example.com/operator-blocked/${suffix}.xml`
    const quietCrawlKey = `https://e2e-infl0.example.com/operator-quiet/${suffix}.xml`
    const fixtures = [
      {
        crawlKey: blockedCrawlKey,
        sourceStatus: 'ready',
        sourceHealthStatus: 'blocked',
        operatorAttention: true,
        operatorAttentionReason: 'e2e blocked fixture',
        crawlCandidateCount: 4,
        crawlProcessedCount: 0,
        crawlSkippedCount: 0,
        crawlFetchErrorCount: 4,
        crawlLlmFailedCount: 1,
      },
      {
        crawlKey: quietCrawlKey,
        sourceStatus: 'ready',
        sourceHealthStatus: 'quiet',
        operatorAttention: false,
        operatorAttentionReason: null,
        crawlCandidateCount: 2,
        crawlProcessedCount: 2,
        crawlSkippedCount: 0,
        crawlFetchErrorCount: 0,
        crawlLlmFailedCount: 0,
      },
    ]
    for (const body of fixtures) {
      const upsert = await browserFetchJson(page, '/api/crawler/source-status', {
        method: 'POST',
        headers: { 'X-Crawler-Key': crawlerKey },
        body,
      })
      if (!upsert.ok) {
        throw new Error(`POST /api/crawler/source-status failed ${upsert.status}: ${upsert.text}`)
      }
    }

    // Full reload: do not tie assertions to a client GET — Nuxt may hydrate from payload
    // or dedupe fetches so `waitForResponse` for `/api/operator/source-statuses` is flaky.
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('operator-sources-table')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByTestId('operator-sources-table')).toContainText(blockedCrawlKey, {
      timeout: 45_000,
    })
    await expect(page.getByTestId('operator-summary-total')).toContainText(/\d+/u)
    await expect(page.getByTestId('operator-summary-attention')).toContainText(/\d+/u)

    const blockedRow = page
      .locator('[data-testid="operator-sources-table"] tbody tr[data-health="blocked"]')
      .filter({ hasText: blockedCrawlKey })
      .first()
    await expect(blockedRow).toContainText('e2e blocked fixture')

    await page.getByTestId('operator-filter-blocked').click()
    await expectOperatorFilter(page, 'blocked', blockedCrawlKey, quietCrawlKey)

    await page.getByTestId('operator-filter-quiet').click()
    await expectOperatorFilter(page, 'quiet', quietCrawlKey, blockedCrawlKey)
  })
})
