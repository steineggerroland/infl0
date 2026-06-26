import { crawlerIngest, prepareReaderInflowFixture } from '../../crawler-fixtures.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'
import {
  buildKnowledgeInboxArticlePayload,
  buildKnowledgeInboxEpisodePayload,
} from '../builders/knowledge-inbox-content.js'

function ensureKnowledgeContentState(world) {
  if (!world.kbFixtures) {
    world.kbFixtures = { suffix: `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}` }
  }
  return world.kbFixtures
}

async function ensureKnowledgeContentFeed(page, world) {
  const state = ensureKnowledgeContentState(world)
  if (state.crawlKey) return state.crawlKey
  const feedUrl = `https://example.com/bdd/kb-inbox-${state.suffix}.xml`
  await prepareReaderInflowFixture(page, world, feedUrl, 'BDD Knowledge Inbox')
  state.crawlKey = world.lastCrawlKey
  return state.crawlKey
}

export function PrepareArticleForKnowledgeInbox(world, title, options = {}) {
  return {
    description: `Prepare article "${title}" for knowledge inbox scenarios`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const state = ensureKnowledgeContentState(world)
      const crawlKey = await ensureKnowledgeContentFeed(page, world)
      await crawlerIngest(page, buildKnowledgeInboxArticlePayload(crawlKey, state.suffix, title, options))
    },
  }
}

export function PrepareEpisodeForKnowledgeInbox(world, title, options = {}) {
  return {
    description: `Prepare episode "${title}" for knowledge inbox scenarios`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const state = ensureKnowledgeContentState(world)
      const crawlKey = await ensureKnowledgeContentFeed(page, world)
      await crawlerIngest(page, buildKnowledgeInboxEpisodePayload(crawlKey, state.suffix, title, options))
    },
  }
}
