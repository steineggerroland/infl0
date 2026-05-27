import {
  crawlerIngest,
  postCrawlerSourceHealth,
  prepareReaderInflowFixture,
} from '../../crawler-fixtures.js'
import { waitForNuxtAppReady } from '../../app-ready.js'
import { SourcesPage } from '../../sources-page.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

const sourceProfiles = {
  default: {
    address: 'https://example.com/bdd-sam-feed.xml',
    displayName: 'Sam Feed',
  },
  noSnapshot: {
    address: 'https://example.com/bdd-sam-no-snapshot.xml',
    displayName: 'Sam No Snapshot',
  },
  pausable: {
    address: 'https://example.com/bdd-sam-pause.xml',
    displayName: 'Sam Pause',
  },
  needsSetup: {
    address: 'https://example.com/bdd-sam-health-contract.xml',
    displayName: 'Sam Health',
  },
  healthy: {
    address: 'https://example.com/bdd-sam-healthy-label.xml',
    displayName: 'Sam Healthy',
  },
}

function sourceFor(actor) {
  const source = actor.recall('sourceToCurate')
  if (!source) {
    throw new Error(`${actor.name} has no remembered source to curate.`)
  }
  return source
}

function sourcesPage(actor) {
  return new SourcesPage(BrowseTheWeb.as(actor))
}

export function PrepareSourceCuration(profile = 'default') {
  return {
    async performAs(actor) {
      const source = sourceProfiles[profile]
      if (!source) {
        throw new Error(`Unknown source curation profile: ${profile}`)
      }
      actor.remember('sourceToCurate', source)
      await sourcesPage(actor).open()
    },
  }
}

export const AddRememberedSource = {
  async performAs(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).addSource(actor.world, source.address, source.displayName)
    actor.remember('curatedSource', {
      ...source,
      crawlKey: actor.world.lastCrawlKey,
      feedId: actor.world.lastFeedId,
    })
  },
}

export const HaveMultipleActiveSources = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
    const sources = [
      {
        role: 'preferred',
        address: `https://example.com/bdd-sam-weighted/${suffix}-preferred.xml`,
        displayName: 'Sam Preferred Source',
        articleId: `bdd-sam-weighted-${suffix}-preferred`,
        title: 'Sam weighted preferred article',
        publishedAt: new Date(Date.now() - 120_000).toISOString(),
      },
      {
        role: 'baseline',
        address: `https://example.com/bdd-sam-weighted/${suffix}-baseline.xml`,
        displayName: 'Sam Baseline Source',
        articleId: `bdd-sam-weighted-${suffix}-baseline`,
        title: 'Sam weighted baseline article',
        publishedAt: new Date(Date.now() - 60_000).toISOString(),
      },
    ]

    for (const source of sources) {
      await prepareReaderInflowFixture(page, actor.world, source.address, source.displayName)
      source.crawlKey = actor.world.lastCrawlKey
      source.feedId = actor.world.lastFeedId
      await crawlerIngest(page, {
        crawlKey: source.crawlKey,
        id: source.articleId,
        link: `https://example.com/bdd-sam-weighted/${source.articleId}`,
        title: source.title,
        author: 'BDD Author',
        publishedAt: source.publishedAt,
        content_hash: `${source.articleId}-hash`,
        content_md: `# ${source.title}\n\nA source-weighting article for Sam.`,
        source_type: 'rss',
        tld: 'example.com',
        categories: ['bdd', 'curation'],
        teaser: `Teaser for ${source.title}`,
        summary_long: `Summary for ${source.title}`,
        category: ['bdd', 'curation'],
        tags: ['source-weighting'],
        seriousness_rating: 'low',
      })
    }

    const preferred = sources.find((source) => source.role === 'preferred')
    if (!preferred) throw new Error('Preferred source fixture was not created.')
    actor.remember('sourceToCurate', preferred)
    actor.remember('weightedSourceArticleId', preferred.articleId)
    actor.remember('weightedSources', sources)
    await sourcesPage(actor).open()
  },
}

export const IncreaseRememberedSourceWeight = {
  async performAs(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).setSourcePreference(source.address, 1)
  },
}

export const RemoveRememberedSource = {
  async performAs(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).removeSource(source.address)
  },
}

export const PauseRememberedSource = {
  async performAs(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).pauseSource(source.address)
  },
}

export const ResumeRememberedSource = {
  async performAs(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).resumeSource(source.address)
  },
}

export function ReceiveCrawlerHealth(status) {
  return {
    async performAs(actor) {
      const source = actor.recall('curatedSource')
      if (!source?.crawlKey) {
        throw new Error(`${actor.name} has no added source with crawlKey.`)
      }
      await postCrawlerSourceHealth(BrowseTheWeb.as(actor), {
        crawlKey: source.crawlKey,
        sourceStatus: 'ready',
        sourceHealthStatus: status,
      })
      await BrowseTheWeb.as(actor).reload()
      await waitForNuxtAppReady(BrowseTheWeb.as(actor))
    },
  }
}

export function RequireCrawlerStatusReporting() {
  return {
    async performAs(actor) {
      if (!process.env.NUXT_CRAWLER_API_KEY?.trim()) {
        throw new Error(
          'NUXT_CRAWLER_API_KEY is required for crawler BDD steps (merge .env.e2e into env for test:bdd).',
        )
      }
      actor.remember('crawlerStatusReporting', true)
    },
  }
}
