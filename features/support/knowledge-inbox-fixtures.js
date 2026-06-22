import { crawlerIngest, prepareReaderInflowFixture } from './crawler-fixtures.js'

function ensureKbState(world) {
  if (!world.kbFixtures) {
    world.kbFixtures = { suffix: `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}` }
  }
  return world.kbFixtures
}

export async function ensureInboxFeed(page, world) {
  const state = ensureKbState(world)
  if (state.crawlKey) return state.crawlKey
  const feedUrl = `https://example.com/bdd/kb-inbox-${state.suffix}.xml`
  await prepareReaderInflowFixture(page, world, feedUrl, 'BDD Knowledge Inbox')
  state.crawlKey = world.lastCrawlKey
  return state.crawlKey
}

export async function ingestKnowledgeInboxArticle(page, world, title, options = {}) {
  const state = ensureKbState(world)
  const crawlKey = await ensureInboxFeed(page, world)
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const id = `bdd-kb-${safeId}-${state.suffix}`
  const defaultContent = `# ${title}\n\nBody for ${title}.`
  const payload = {
    crawlKey,
    id,
    item_kind: 'article',
    title,
    link: `https://example.com/bdd/kb/${state.suffix}/${id}`,
    publishedAt: options.publishedAt || new Date().toISOString(),
    content_hash: `${id}-hash`,
    content_md: options.contentMd ?? defaultContent,
    source_type: 'rss',
    tld: 'example.com',
    teaser: options.teaser || `${title} teaser for the knowledge inbox.`,
    seriousness_rating: 'low',
  }
  await crawlerIngest(page, payload)
}

export async function ingestKnowledgeInboxEpisode(page, world, title, options = {}) {
  const state = ensureKbState(world)
  const crawlKey = await ensureInboxFeed(page, world)
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const id = `bdd-kb-ep-${safeId}-${state.suffix}`
  const defaultContent = `# ${title}\n\nBody for ${title}.`
  const payload = {
    crawlKey,
    id,
    item_kind: 'episode',
    title,
    link: `https://example.com/bdd/kb/${state.suffix}/${id}`,
    publishedAt: options.publishedAt || new Date().toISOString(),
    content_hash: `${id}-hash`,
    content_md: options.contentMd ?? defaultContent,
    source_type: 'podcast',
    tld: 'example.com',
    teaser: options.teaser || `${title} teaser for the knowledge inbox.`,
    seriousness_rating: 'low',
    duration_seconds: options.durationSeconds ?? 1800,
  }
  await crawlerIngest(page, payload)
}
