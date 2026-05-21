import { test, expect, type Page } from '@playwright/test'
import { loadE2eMergedEnv } from '../load-e2e-env'
import {
  tkcArticleExample,
  tkcEpisodeExample,
  tkcSectionExample,
  type TkcIngestExample,
} from '../../fixtures/tkc-ingest'

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

async function createFeedForExample(page: Page, example: TkcIngestExample, displayTitle: string) {
  const feedUrl = String(example.crawlKey ?? '')
  const res = await browserFetchJson(page, '/api/feeds', {
    method: 'POST',
    body: { feedUrl, displayTitle },
  })
  if (!res.ok) {
    throw new Error(`POST /api/feeds failed ${res.status}: ${res.text}`)
  }
  return (res.data as { feed: { id: string; crawlKey: string } }).feed
}

async function deleteFeed(page: Page, feedId: string) {
  const res = await browserFetchJson(page, `/api/feeds/${encodeURIComponent(feedId)}`, {
    method: 'DELETE',
  })
  expect.soft(res.ok, `Cleanup DELETE /api/feeds/${feedId}: ${res.status} ${res.text}`).toBeTruthy()
}

async function postCrawlerIngest(page: Page, crawlerKey: string, body: TkcIngestExample) {
  return browserFetchJson(page, '/api/crawler/ingest', {
    method: 'POST',
    headers: { 'X-Crawler-Key': crawlerKey },
    body,
  })
}

test.describe('crawler ingest contract examples', () => {
  test.beforeAll(() => {
    loadE2eMergedEnv()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/feeds')
  })

  test('accepts TKC article.json and exposes a rough inflow item', async ({ page }) => {
    const crawlerKey = process.env.NUXT_CRAWLER_API_KEY?.trim()
    test.skip(!crawlerKey, 'NUXT_CRAWLER_API_KEY not set (see .env.e2e)')

    const example = tkcArticleExample()
    const feed = await createFeedForExample(page, example, 'E2E TKC article ingest')

    try {
      const ingest = await postCrawlerIngest(page, crawlerKey as string, example)
      if (!ingest.ok) {
        throw new Error(`POST /api/crawler/ingest article failed ${ingest.status}: ${ingest.text}`)
      }
      expect(ingest.data).toMatchObject({
        ok: true,
        itemKind: 'article',
        articleId: example.id,
      })
      expect((ingest.data as { subscriberCount?: number }).subscriberCount).toBeGreaterThanOrEqual(1)

      const inflow = await browserFetchJson(page, '/api/inflow?showRead=1&limit=100')
      if (!inflow.ok) {
        throw new Error(`GET /api/inflow failed ${inflow.status}: ${inflow.text}`)
      }
      const items = (inflow.data as { items: Array<Record<string, unknown>> }).items
      expect(items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'article',
            id: example.id,
            title: example.title,
          }),
        ]),
      )
    } finally {
      await deleteFeed(page, feed.id)
    }
  })

  test('accepts TKC episode.json and exposes a rough inflow item', async ({ page }) => {
    const crawlerKey = process.env.NUXT_CRAWLER_API_KEY?.trim()
    test.skip(!crawlerKey, 'NUXT_CRAWLER_API_KEY not set (see .env.e2e)')

    const example = tkcEpisodeExample()
    const feed = await createFeedForExample(page, example, 'E2E TKC episode ingest')

    try {
      const ingest = await postCrawlerIngest(page, crawlerKey as string, example)
      if (!ingest.ok) {
        throw new Error(`POST /api/crawler/ingest episode failed ${ingest.status}: ${ingest.text}`)
      }
      expect(ingest.data).toMatchObject({
        ok: true,
        itemKind: 'episode',
        episodeId: example.id,
      })
      expect((ingest.data as { subscriberCount?: number }).subscriberCount).toBeGreaterThanOrEqual(1)

      const inflow = await browserFetchJson(page, '/api/inflow?showRead=1&limit=100')
      if (!inflow.ok) {
        throw new Error(`GET /api/inflow failed ${inflow.status}: ${inflow.text}`)
      }
      const items = (inflow.data as { items: Array<Record<string, unknown>> }).items
      expect(items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'episode',
            id: example.id,
            title: example.title,
            media_url: example.media_url,
            duration_seconds: example.duration_seconds,
          }),
        ]),
      )
    } finally {
      await deleteFeed(page, feed.id)
    }
  })

  test('rejects TKC section.json and records operator-visible source status', async ({ page }) => {
    const crawlerKey = process.env.NUXT_CRAWLER_API_KEY?.trim()
    test.skip(!crawlerKey, 'NUXT_CRAWLER_API_KEY not set (see .env.e2e)')

    const example = tkcSectionExample()
    const feed = await createFeedForExample(page, example, 'E2E TKC section ingest')

    try {
      const ingest = await postCrawlerIngest(page, crawlerKey as string, example)
      expect(ingest.ok).toBe(false)
      expect(ingest.status).toBe(400)
      expect(ingest.text).toContain('section is not supported')

      const statuses = await browserFetchJson(page, '/api/source-statuses')
      if (!statuses.ok) {
        throw new Error(`GET /api/source-statuses failed ${statuses.status}: ${statuses.text}`)
      }
      const items = (statuses.data as {
        items: Array<{
          feed: { id: string; crawlKey: string }
          latest: {
            operatorAttention: boolean
            lastCrawlStatus: string | null
            lastCrawlError: string | null
          } | null
        }>
      }).items
      const hit = items.find((item) => item.feed.id === feed.id)
      expect(hit?.latest).toMatchObject({
        operatorAttention: true,
        lastCrawlStatus: 'failed',
        lastCrawlError: expect.stringContaining('section is not supported'),
      })
    } finally {
      await deleteFeed(page, feed.id)
    }
  })
})
