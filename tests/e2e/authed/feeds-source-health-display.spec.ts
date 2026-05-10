import { test, expect, type Page } from '@playwright/test'
import { loadE2eMergedEnv } from '../load-e2e-env'
import { TKC_SOURCE_HEALTH_STATUSES } from '../../../utils/source-health-display'

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

test.describe('feeds page source health display (TKC statuses)', () => {
  test.beforeAll(() => {
    loadE2eMergedEnv()
  })

  test('shows data-source-health=no_snapshot before crawler posts', async ({ page }) => {
    const crawlerKey = process.env.NUXT_CRAWLER_API_KEY?.trim()
    test.skip(!crawlerKey, 'NUXT_CRAWLER_API_KEY not set (see .env.e2e)')

    await page.goto('/feeds')
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    const feedUrl = `https://e2e-infl0.example.com/health-none/${suffix}.xml`

    const createRes = await browserFetchJson(page, '/api/feeds', {
      method: 'POST',
      body: { feedUrl, displayTitle: 'E2E no snapshot' },
    })
    if (!createRes.ok) {
      throw new Error(`POST /api/feeds failed ${createRes.status}: ${createRes.text}`)
    }
    const { feed } = createRes.data as { feed: { id: string } }
    const { id: feedId } = feed

    try {
      await page.reload()
      const row = page.locator(`[data-feed-id="${feedId}"]`)
      await expect(row.getByTestId('feed-source-health')).toHaveAttribute(
        'data-source-health',
        'no_snapshot',
      )
    } finally {
      await browserFetchJson(page, `/api/feeds/${encodeURIComponent(feedId)}`, { method: 'DELETE' })
    }
  })

  for (const health of TKC_SOURCE_HEALTH_STATUSES) {
    test(`shows data-source-health=${health} after crawler POST`, async ({ page }) => {
      const crawlerKeyRaw = process.env.NUXT_CRAWLER_API_KEY?.trim()
      test.skip(!crawlerKeyRaw, 'NUXT_CRAWLER_API_KEY not set (see .env.e2e)')
      const crawlerKey = crawlerKeyRaw as string

      await page.goto('/feeds')
      const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
      const feedUrl = `https://e2e-infl0.example.com/health-${health}/${suffix}.xml`

      const createRes = await browserFetchJson(page, '/api/feeds', {
        method: 'POST',
        body: { feedUrl, displayTitle: `E2E ${health}` },
      })
      if (!createRes.ok) {
        throw new Error(`POST /api/feeds failed ${createRes.status}: ${createRes.text}`)
      }
      const { feed } = createRes.data as { feed: { id: string; crawlKey: string } }
      const { id: feedId, crawlKey } = feed

      try {
        const upsertRes = await browserFetchJson(page, '/api/crawler/source-status', {
          method: 'POST',
          headers: { 'X-Crawler-Key': crawlerKey },
          body: {
            crawlKey,
            sourceStatus: 'ready',
            sourceHealthStatus: health,
            sourceHealthReason: `e2e_${health}`,
          },
        })
        if (!upsertRes.ok) {
          throw new Error(
            `POST /api/crawler/source-status failed ${upsertRes.status}: ${upsertRes.text}`,
          )
        }

        await page.reload()
        const row = page.locator(`[data-feed-id="${feedId}"]`)
        await expect(row.getByTestId('feed-source-health')).toHaveAttribute(
          'data-source-health',
          health,
        )
      } finally {
        const del = await browserFetchJson(page, `/api/feeds/${encodeURIComponent(feedId)}`, {
          method: 'DELETE',
        })
        expect
          .soft(del.ok, `Cleanup DELETE /api/feeds/${feedId}: ${del.status} ${del.text}`)
          .toBeTruthy()
      }
    })
  }
})
