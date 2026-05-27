import { browserFetchJson } from './crawler-fixtures.js'

/** Records dwell for BDD when the UI path is not under test. */
export async function logArticleEngagement(page, articleId, segment = 'teaser', durationSec = 5) {
  const res = await browserFetchJson(page, '/api/me/article-engagement', {
    method: 'POST',
    body: { articleId, segment, durationSec },
  })
  if (!res.ok) {
    throw new Error(`POST /api/me/article-engagement failed (${res.status}): ${res.text}`)
  }
  return res.data
}
