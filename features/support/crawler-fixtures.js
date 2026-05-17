/**
 * Simulates TopicKnowledgeCrawler delivery — no user-facing UI exists for ingest/status.
 */

export async function browserFetchJson(page, path, init = {}) {
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

export async function crawlerIngest(page, payload) {
  const crawlerKey = process.env.NUXT_CRAWLER_API_KEY
  if (!crawlerKey) {
    throw new Error('NUXT_CRAWLER_API_KEY is required for crawler BDD fixtures.')
  }
  const res = await browserFetchJson(page, '/api/crawler/ingest', {
    method: 'POST',
    headers: { 'X-Crawler-Key': crawlerKey },
    body: payload,
  })
  if (!res.ok) {
    throw new Error(`Crawler ingest failed (${res.status}): ${res.text}`)
  }
  return res.data
}

export async function postCrawlerSourceHealth(page, body) {
  const key = process.env.NUXT_CRAWLER_API_KEY?.trim()
  if (!key) throw new Error('NUXT_CRAWLER_API_KEY is not set')
  const res = await browserFetchJson(page, '/api/crawler/source-status', {
    method: 'POST',
    headers: { 'X-Crawler-Key': key },
    body,
  })
  if (!res.ok) {
    throw new Error(`POST /api/crawler/source-status failed (${res.status}): ${res.text}`)
  }
}
