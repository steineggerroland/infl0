import { expect } from '@playwright/test'
import { SourcesPage } from '../../sources-page.js'
import { ReaderTimeline } from '../../reader-timeline.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function sourceFor(actor) {
  const source = actor.recall('sourceToCurate')
  if (!source) {
    throw new Error(`${actor.name} has no remembered source to inspect.`)
  }
  return source
}

function sourcesPage(actor) {
  return new SourcesPage(BrowseTheWeb.as(actor))
}

export const SourceListIsEmpty = {
  async answeredBy(actor) {
    await sourcesPage(actor).expectEmptyHint()
  },
}

export const RememberedSourceIsListed = {
  async answeredBy(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).expectListHeading()
    await sourcesPage(actor).expectListContains(source.address)
  },
}

export const RememberedSourceIsActive = {
  async answeredBy(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).expectSourceActive(source.address)
  },
}

export const RememberedSourceIsPaused = {
  async answeredBy(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).expectSourcePaused(source.address)
  },
}

export function RememberedSourceHasHealth(expectedAttr) {
  return {
    async answeredBy(actor) {
      const source = sourceFor(actor)
      await sourcesPage(actor).expectSourceHealth(source.address, expectedAttr)
    },
  }
}

export function RememberedSourceHealthExplains(substring) {
  return {
    async answeredBy(actor) {
      const source = sourceFor(actor)
      await sourcesPage(actor).expectExpandedHealthLabel(source.address, substring)
    },
  }
}

export const RememberedSourcePreferenceIsSaved = {
  async answeredBy(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).expectSourcePreference(source.address, 1)
  },
}

export const WeightedSourceLeadsFutureTimeline = {
  async answeredBy(actor) {
    const articleId = actor.recall('weightedSourceArticleId')
    if (!articleId) throw new Error(`${actor.name} has no remembered weighted-source article.`)
    const page = BrowseTheWeb.as(actor)
    const timeline = new ReaderTimeline(page)
    await timeline.open()
    await timeline.startReading()
    const firstCard = page.getByTestId('article-card').first()
    await expect(firstCard).toBeVisible({ timeout: 20_000 })
    await expect(firstCard).toHaveAttribute('data-article-id', articleId)
  },
}

export const FocusedWorkingSetIsVisible = {
  async answeredBy(actor) {
    const articleId = actor.recall('weightedSourceArticleId')
    if (!articleId) throw new Error(`${actor.name} has no remembered working-set article.`)
    const page = BrowseTheWeb.as(actor)
    await expect(page.getByTestId('source-focus-banner')).toBeVisible({ timeout: 20_000 })
    await new ReaderTimeline(page).startReading()
    await expect(new ReaderTimeline(page).articleCard(articleId)).toBeVisible({ timeout: 20_000 })
  },
}

export const FullInflowIsVisibleAgain = {
  async answeredBy(actor) {
    const baseline = actor.recall('baselineSourceArticleId')
    if (!baseline) throw new Error(`${actor.name} has no remembered baseline article.`)
    const page = BrowseTheWeb.as(actor)
    const timeline = new ReaderTimeline(page)
    await expect(page.getByTestId('source-focus-banner')).toHaveCount(0, { timeout: 15_000 })
    await timeline.startReading()
    await expect(timeline.articleCard(baseline)).toBeVisible({ timeout: 20_000 })
  },
}
