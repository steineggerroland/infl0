import { test, expect, type Page } from '@playwright/test'
import { loadE2eMergedEnv } from '../load-e2e-env'

/**
 * Same-origin fetch from the loaded page so `infl0_auth` (httpOnly) is sent.
 * Playwright's `page.request` / `context().request` can omit storageState cookies
 * for API calls (see microsoft/playwright#40180).
 */
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

/**
 * End-to-end path: authenticated user feed + crawler upsert + session read of
 * `GET /api/source-statuses`. Requires `NUXT_CRAWLER_API_KEY` (committed default in
 * `.env.e2e`) and migration **`source_statuses`** applied to the E2E database.
 */
test.describe('source statuses (signed in)', () => {
  test.beforeAll(() => {
    loadE2eMergedEnv()
  })

  test('crawler POST /api/crawler/source-status appears on GET /api/source-statuses', async ({
    page,
  }) => {
    const crawlerKeyRaw = process.env.NUXT_CRAWLER_API_KEY?.trim()
    test.skip(!crawlerKeyRaw, 'NUXT_CRAWLER_API_KEY not set (see .env.e2e)')
    const crawlerKey = crawlerKeyRaw as string

    await page.goto('/feeds')

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    const feedUrl = `https://e2e-infl0.example.com/source-status/${suffix}.xml`
    const createRes = await browserFetchJson(page, '/api/feeds', {
      method: 'POST',
      body: { feedUrl, displayTitle: 'E2E source status' },
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
          sourceHealthStatus: 'healthy',
          lastCrawlStatus: 'ok',
        },
      })
      if (!upsertRes.ok) {
        throw new Error(
          `POST /api/crawler/source-status failed ${upsertRes.status}: ${upsertRes.text}`,
        )
      }
      expect(upsertRes.data).toMatchObject({ ok: true, crawlKey })

      const listRes = await browserFetchJson(page, '/api/source-statuses')
      if (!listRes.ok) {
        throw new Error(`GET /api/source-statuses failed ${listRes.status}: ${listRes.text}`)
      }
      const body = listRes.data as {
        items: Array<{
          feed: { id: string; crawlKey: string }
          latest: { sourceHealthStatus: string | null; sourceStatus: string | null } | null
        }>
      }
      const hit = body.items.find((i) => i.feed.id === feedId)
      expect(hit, `feed ${feedId} missing from ${JSON.stringify(body.items.map((i) => i.feed.id))}`).toBeTruthy()
      expect(hit!.latest?.sourceHealthStatus).toBe('healthy')
      expect(hit!.latest?.sourceStatus).toBe('ready')
    } finally {
      const del = await browserFetchJson(page, `/api/feeds/${encodeURIComponent(feedId)}`, {
        method: 'DELETE',
      })
      expect.soft(del.ok, `Cleanup DELETE /api/feeds/${feedId}: ${del.status} ${del.text}`).toBeTruthy()
    }
  })
})
