import { browserFetchJson, crawlerIngest } from '../../crawler-fixtures.js'
import { OperatorIngestPage } from '../../operator-ingest-page.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'
import { SignInAsSeededOperator } from './operator-observability.js'

function page(actor) {
  return BrowseTheWeb.as(actor)
}

function ingestPage(actor) {
  return new OperatorIngestPage(page(actor))
}

function requireCrawlerKey() {
  const key = process.env.NUXT_CRAWLER_API_KEY?.trim()
  if (!key) throw new Error('NUXT_CRAWLER_API_KEY is required for integrator observability fixtures.')
  return key
}

function articlePayload(crawlKey, suffix, index) {
  const age = typeof index === 'number' ? index : 1
  return {
    crawlKey,
    id: `bdd-ingo-article-${suffix}-${index}`,
    link: `https://example.com/bdd-ingo/article-${suffix}-${index}`,
    title: `Ingo article ${index}`,
    author: 'BDD Author',
    publishedAt: new Date(Date.now() - age * 60_000).toISOString(),
    content_hash: `ingo-article-${suffix}-${index}-hash`,
    content_md: `# Ingo article ${index}`,
    source_type: 'rss',
    tld: 'example.com',
    categories: ['bdd', 'integrator'],
    teaser: `Teaser ${index}`,
    summary_long: `Summary ${index}`,
    category: ['bdd', 'integrator'],
    tags: ['ingo'],
    seriousness_rating: 'low',
  }
}

function episodePayload(crawlKey, suffix) {
  return {
    ...articlePayload(crawlKey, suffix, 'episode'),
    item_kind: 'episode',
    id: `bdd-ingo-episode-${suffix}`,
    title: 'Ingo episode delivery',
    media_url: `https://example.com/bdd-ingo/${suffix}.mp3`,
    media_type: 'audio/mpeg',
    duration_seconds: 1200,
    shownotes_md: 'Episode shownotes.',
    transcript_md: 'Episode transcript.',
  }
}

function prepareIngestSource(actor, displayTitle) {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
  return {
    suffix,
    crawlKey: `https://example.com/bdd-ingo/${encodeURIComponent(displayTitle.toLowerCase().replace(/\s+/gu, '-'))}-${suffix}.xml`,
  }
}

export const SignInAsIntegratorOperator = SignInAsSeededOperator

export const SendRecentSuccessfulIngestRequests = {
  async performAs(actor) {
    const { suffix, crawlKey } = prepareIngestSource(actor, 'Ingo successful source')
    for (let index = 1; index <= 9; index += 1) {
      await crawlerIngest(page(actor), articlePayload(crawlKey, suffix, index))
    }
    await crawlerIngest(page(actor), episodePayload(crawlKey, suffix))
    actor.remember('ingoExpectedCounts', { articles: 9, episodes: 1, subscribers: 10 })
    actor.remember('ingoLatestContentId', `bdd-ingo-episode-${suffix}`)
  },
}

export const SendMixedSuccessfulIngestRequests = {
  async performAs(actor) {
    const { suffix, crawlKey } = prepareIngestSource(actor, 'Ingo count source')
    await crawlerIngest(page(actor), articlePayload(crawlKey, suffix, 1))
    await crawlerIngest(page(actor), episodePayload(crawlKey, suffix))
    actor.remember('ingoExpectedCounts', { articles: 1, episodes: 1, subscribers: 2 })
    actor.remember('ingoLatestContentId', `bdd-ingo-episode-${suffix}`)
  },
}

export const SendWrongKeyIngestRequest = {
  async performAs(actor) {
    const { suffix, crawlKey } = prepareIngestSource(actor, 'Ingo rejected auth source')
    const body = articlePayload(crawlKey, suffix, 'wrong-key')
    await browserFetchJson(page(actor), '/api/crawler/ingest', {
      method: 'POST',
      headers: { 'X-Crawler-Key': `${requireCrawlerKey()}-wrong` },
      body,
    })
    actor.remember('ingoRejectedCategory', 'auth_failed')
  },
}

export const SendInvalidStructureIngestRequest = {
  async performAs(actor) {
    const key = requireCrawlerKey()
    await browserFetchJson(page(actor), '/api/crawler/ingest', {
      method: 'POST',
      headers: { 'X-Crawler-Key': key },
      body: {
        crawlKey: 'https://example.com/bdd-ingo-invalid.xml',
        id: 'bdd-ingo-invalid-structure',
        link: 'https://example.com/bdd-ingo/invalid-structure',
      },
    })
    actor.remember('ingoRejectedCategory', 'invalid_structure')
  },
}

export const SendUnsupportedSectionIngestRequest = {
  async performAs(actor) {
    const key = requireCrawlerKey()
    await browserFetchJson(page(actor), '/api/crawler/ingest', {
      method: 'POST',
      headers: { 'X-Crawler-Key': key },
      body: {
        crawlKey: 'https://example.com/bdd-ingo-section.xml',
        item_kind: 'section',
        id: 'bdd-ingo-section',
        title: 'Ingo unsupported section',
        link: 'https://example.com/bdd-ingo/section',
      },
    })
    actor.remember('ingoRejectedCategory', 'unsupported_content')
  },
}

export const OpenIntegratorDashboard = {
  async performAs(actor) {
    await ingestPage(actor).open()
  },
}

export function OpenRejectedIngestRequest(category) {
  return {
    async performAs(actor) {
      await ingestPage(actor).open()
      await ingestPage(actor).expectRejectedRequest(category)
    },
  }
}

export const OpenLatestIngestRequest = {
  async performAs(actor) {
    await ingestPage(actor).open()
    const id = actor.recall('ingoLatestContentId')
    if (!id) throw new Error(`${actor.name} has no latest ingest content id.`)
    await ingestPage(actor).openFirstRequestMatching(id)
  },
}
