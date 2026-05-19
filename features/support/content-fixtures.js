/**
 * BDD fixtures for article/episode card presentation (rich vs minimal).
 * Delivered via TopicKnowledgeCrawler ingest — no infl0 UI for ingest.
 */

import { crawlerIngest, prepareReaderInflowFixture } from './crawler-fixtures.js'

export const PODCAST_DISPLAY_TITLE = 'BDD Demo Podcast'

function newSuffix() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
}

function ensurePresentationState(world) {
  if (!world.contentPresentation) {
    world.contentPresentation = { suffix: newSuffix() }
  } else if (!world.contentPresentation.suffix) {
    world.contentPresentation.suffix = newSuffix()
  }
  return world.contentPresentation
}

/**
 * @param {string} suffix
 * @param {string} crawlKey
 */
function richArticlePayload(crawlKey, suffix) {
  const id = `bdd-present-article-rich-${suffix}`
  return {
    crawlKey,
    id,
    item_kind: 'article',
    title: 'BDD rich article',
    link: `https://example.com/bdd/present/${suffix}/rich-article`,
    author: 'BDD Author',
    publishedAt: new Date(Date.now() - 240_000).toISOString(),
    content_hash: `${id}-hash`,
    content_md: '# Rich body\n\nParagraph with **emphasis** for the reader modal.',
    source_type: 'rss',
    tld: 'example.com',
    categories: ['bdd', 'presentation'],
    teaser: 'Rich article teaser for the card front.',
    summary_long: 'Rich article long summary on the back of the card.',
    category: ['bdd', 'presentation'],
    tags: ['bdd'],
    seriousness_rating: 'low',
  }
}

/**
 * @param {string} suffix
 * @param {string} crawlKey
 */
function minimalArticlePayload(crawlKey, suffix) {
  const id = `bdd-present-article-minimal-${suffix}`
  return {
    crawlKey,
    id,
    item_kind: 'article',
    title: 'BDD minimal article',
    link: `https://example.com/bdd/present/${suffix}/minimal-article`,
    publishedAt: new Date(Date.now() - 300_000).toISOString(),
    content_hash: `${id}-hash`,
    content_md: '',
    source_type: 'rss',
    tld: 'example.com',
    teaser: 'Minimal teaser only.',
  }
}

/**
 * @param {string} suffix
 * @param {string} crawlKey
 */
function richEpisodePayload(crawlKey, suffix) {
  const id = `bdd-present-episode-rich-${suffix}`
  return {
    crawlKey,
    id,
    item_kind: 'episode',
    title: 'BDD rich episode',
    link: `https://example.com/bdd/present/${suffix}/rich-episode`,
    author: 'BDD Host',
    publishedAt: new Date(Date.now() - 120_000).toISOString(),
    content_hash: `${id}-hash`,
    content_md: '# Rich episode content\n\nEpisode description for the **Content** tab.',
    source_type: 'rss+podcast',
    tld: 'example.com',
    teaser: 'Rich episode teaser on the card front.',
    summary_long: 'Rich episode summary below the action buttons on the back.',
    category: ['bdd', 'podcast'],
    tags: ['presentation'],
    seriousness_rating: 'low',
    media_url: `https://cdn.example.com/bdd/present/${suffix}/rich.mp3`,
    media_type: 'audio/mpeg',
    duration_seconds: 3723,
    episode_number: 42,
    season_number: 3,
    episode_type: 'full',
    explicit: 'yes',
    subtitle: 'Rich episode subtitle',
    image_url: `https://example.com/bdd/present/${suffix}/cover.jpg`,
    shownotes_md:
      '## Shownotes\n\n- [DDD article](https://example.com/bdd/ddd)\n- Mentioned tool: Example Tool',
    chapters: [
      { start_seconds: 0, title: 'Intro' },
      { start_seconds: 312, title: 'Second chapter' },
    ],
    transcript_md: 'Welcome to the rich BDD episode.\n\nWe discuss bounded contexts.',
    transcript_url: `https://example.com/bdd/present/${suffix}/transcript.txt`,
    transcript_type: 'text/plain',
  }
}

/**
 * @param {string} suffix
 * @param {string} crawlKey
 */
function minimalEpisodePayload(crawlKey, suffix) {
  const id = `bdd-present-episode-minimal-${suffix}`
  return {
    crawlKey,
    id,
    item_kind: 'episode',
    title: 'BDD minimal episode',
    link: `https://example.com/bdd/present/${suffix}/minimal-episode`,
    publishedAt: new Date(Date.now() - 180_000).toISOString(),
    content_hash: `${id}-hash`,
    source_type: 'rss+podcast',
    tld: 'example.com',
    teaser: 'Minimal episode teaser only.',
    media_url: `https://cdn.example.com/bdd/present/${suffix}/minimal.mp3`,
    duration_seconds: 480,
  }
}

function metaFromRichArticle(payload) {
  return {
    id: payload.id,
    title: payload.title,
    teaser: payload.teaser,
    summaryLong: payload.summary_long,
    categoryLine: 'bdd, presentation',
    bodySnippet: 'Rich body',
    link: payload.link,
  }
}

function metaFromMinimalArticle(payload) {
  return {
    id: payload.id,
    title: payload.title,
    teaser: payload.teaser,
    link: payload.link,
  }
}

function metaFromRichEpisode(payload, podcastFeedUrl) {
  return {
    id: payload.id,
    title: payload.title,
    teaser: payload.teaser,
    summaryLong: payload.summary_long,
    subtitle: payload.subtitle,
    seasonEpisodeLabel: 'Season 3 · Episode 42',
    durationLabel: '1:02:03',
    podcastTitle: PODCAST_DISPLAY_TITLE,
    chapterTitle: 'Second chapter',
    shownotesSnippet: 'DDD article',
    contentSnippet: 'Rich episode content',
    transcriptSnippet: 'Welcome to the rich BDD episode',
    transcriptUrl: payload.transcript_url,
    mediaUrl: payload.media_url,
    episodePageUrl: payload.link,
    feedUrl: podcastFeedUrl,
  }
}

function metaFromMinimalEpisode(payload, podcastFeedUrl) {
  return {
    id: payload.id,
    title: payload.title,
    teaser: payload.teaser,
    durationLabel: '8:00',
    mediaUrl: payload.media_url,
    episodePageUrl: payload.link,
    feedUrl: podcastFeedUrl,
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../support/world.js').BddWorld} world
 */
export async function ensureArticleFeed(page, world) {
  const state = ensurePresentationState(world)
  if (state.articleCrawlKey) return state.articleCrawlKey
  const feedUrl = `https://example.com/bdd/present/articles-${state.suffix}.xml`
  await prepareReaderInflowFixture(page, world, feedUrl, 'BDD presentation articles')
  state.articleCrawlKey = world.lastCrawlKey
  state.articleFeedUrl = feedUrl
  return state.articleCrawlKey
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../support/world.js').BddWorld} world
 */
export async function ensurePodcastFeed(page, world) {
  const state = ensurePresentationState(world)
  if (state.podcastCrawlKey) return state.podcastCrawlKey
  const feedUrl = `https://example.com/bdd/present/podcast-${state.suffix}.xml`
  await prepareReaderInflowFixture(page, world, feedUrl, PODCAST_DISPLAY_TITLE)
  state.podcastCrawlKey = world.lastCrawlKey
  state.podcastFeedUrl = feedUrl
  return state.podcastCrawlKey
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../support/world.js').BddWorld} world
 */
export async function ingestRichArticle(page, world) {
  const state = ensurePresentationState(world)
  const crawlKey = await ensureArticleFeed(page, world)
  const payload = richArticlePayload(crawlKey, state.suffix)
  await crawlerIngest(page, payload)
  state.articles = state.articles ?? {}
  state.articles.rich = metaFromRichArticle(payload)
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../support/world.js').BddWorld} world
 */
export async function ingestMinimalArticle(page, world) {
  const state = ensurePresentationState(world)
  const crawlKey = await ensureArticleFeed(page, world)
  const payload = minimalArticlePayload(crawlKey, state.suffix)
  await crawlerIngest(page, payload)
  state.articles = state.articles ?? {}
  state.articles.minimal = metaFromMinimalArticle(payload)
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../support/world.js').BddWorld} world
 */
export async function ingestRichEpisode(page, world) {
  const state = ensurePresentationState(world)
  const crawlKey = await ensurePodcastFeed(page, world)
  const payload = richEpisodePayload(crawlKey, state.suffix)
  await crawlerIngest(page, payload)
  state.episodes = state.episodes ?? {}
  state.episodes.rich = metaFromRichEpisode(payload, state.podcastFeedUrl)
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../support/world.js').BddWorld} world
 */
export async function ingestMinimalEpisode(page, world) {
  const state = ensurePresentationState(world)
  const crawlKey = await ensurePodcastFeed(page, world)
  const payload = minimalEpisodePayload(crawlKey, state.suffix)
  await crawlerIngest(page, payload)
  state.episodes = state.episodes ?? {}
  state.episodes.minimal = metaFromMinimalEpisode(payload, state.podcastFeedUrl)
}
