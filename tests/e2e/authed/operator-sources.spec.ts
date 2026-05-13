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

    const fixtures = [
      {
        crawlKey: 'https://example.com/e2e-operator-blocked.xml',
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
        crawlKey: 'https://example.com/e2e-operator-quiet.xml',
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
    await expect(page.getByTestId('operator-sources-table')).toContainText(
      'https://example.com/e2e-operator-blocked.xml',
      { timeout: 45_000 },
    )
    await expect(page.getByTestId('operator-summary-total')).toContainText(/\d+/u)
    await expect(page.getByTestId('operator-summary-attention')).toContainText(/\d+/u)

    const firstRow = page.locator('[data-testid="operator-sources-table"] tbody tr').first()
    await expect(firstRow).toContainText('https://example.com/e2e-operator-blocked.xml')

    await page.getByTestId('operator-filter-blocked').click()
    await expect(page.getByTestId('operator-sources-table')).toContainText(
      'https://example.com/e2e-operator-blocked.xml',
    )
    await expect(page.getByTestId('operator-sources-table')).not.toContainText(
      'https://example.com/e2e-operator-quiet.xml',
    )

    await page.getByTestId('operator-filter-quiet').click()
    await expect(page.getByTestId('operator-sources-table')).toContainText(
      'https://example.com/e2e-operator-quiet.xml',
    )
  })
})

