import { postCrawlerSourceHealth } from '../../crawler-fixtures.js'
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
