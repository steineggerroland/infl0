import { expect } from '@playwright/test'
import { ReaderTimeline } from '../../reader-timeline.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function articleOrdinalIndex(ordinal) {
  if (ordinal === 'first') return 0
  if (ordinal === 'second') return 1
  throw new Error(`Unsupported reader article ordinal: ${ordinal}`)
}

function timeline(actor) {
  return new ReaderTimeline(BrowseTheWeb.as(actor))
}

function articleByOrdinal(actor, ordinal) {
  const articles = actor.recall('readerArticles')
  const article = articles?.[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`${actor.name} has no ${ordinal} reader article.`)
  return article
}

function currentArticleCard(actor) {
  const id = actor.recall('currentReaderArticleId')
  if (!id) throw new Error(`${actor.name} has no current reader article.`)
  return timeline(actor).articleCard(id)
}

export function ReaderUrlPointsTo(ordinal) {
  return {
    async answeredBy(actor) {
      const article = articleByOrdinal(actor, ordinal)
      await expect(BrowseTheWeb.as(actor)).toHaveURL(new RegExp(`/inflow/article/${article.id}$`, 'u'))
    },
  }
}

export function ReaderArticleIsCurrent(ordinal) {
  return {
    async answeredBy(actor) {
      const article = articleByOrdinal(actor, ordinal)
      const card = timeline(actor).articleCard(article.id)
      await expect(card).toBeVisible()
      await expect.poll(async () => timeline(actor).visibleRatio(card)).toBeGreaterThan(0.5)
    },
  }
}

export const ReaderStartIsVisible = {
  async answeredBy(actor) {
    await expect(BrowseTheWeb.as(actor).getByTestId('reader-start')).toBeVisible()
  },
}

export const ReaderStartIsNotVisible = {
  async answeredBy(actor) {
    await expect(BrowseTheWeb.as(actor).getByTestId('reader-start')).toHaveCount(0)
  },
}

export const ReaderArticleCardsAreHidden = {
  async answeredBy(actor) {
    await expect(BrowseTheWeb.as(actor).getByTestId('article-card')).toHaveCount(0)
  },
}

export const ResumeReaderActionIsHidden = {
  async answeredBy(actor) {
    await expect(BrowseTheWeb.as(actor).getByTestId('reader-resume-button')).toHaveCount(0)
  },
}

export function ReaderStartShowsNewArticleCount(count) {
  return {
    async answeredBy(actor) {
      await expect(BrowseTheWeb.as(actor).getByTestId('reader-start')).toContainText(`${count}`)
    },
  }
}

export const CurrentReaderArticleIsRead = {
  async answeredBy(actor) {
    const readControl = currentArticleCard(actor).locator('[data-testid="article-read-status"]').first()
    await expect(readControl).toBeVisible({ timeout: 10_000 })
    await expect(readControl).toHaveAttribute('aria-pressed', 'true')
  },
}

export const CurrentReaderArticleBecomesRead = {
  async answeredBy(actor) {
    await expect(
      currentArticleCard(actor).locator('[data-testid="article-read-status"]').first(),
    ).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
  },
}

export const CurrentReaderArticleBecomesUnread = {
  async answeredBy(actor) {
    await expect(
      currentArticleCard(actor).locator('[data-testid="article-read-status"]').first(),
    ).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 })
  },
}

export const CurrentReaderArticleHasNoBehaviourEvent = {
  async answeredBy(actor) {
    const articleId = actor.recall('currentReaderArticleId')
    if (!articleId) throw new Error(`${actor.name} has no current reader article.`)
    const page = BrowseTheWeb.as(actor)
    await page.goto('/settings/personalization')
    await expect(page).toHaveURL(/\/settings\/personalization/u)
    const row = page.locator(`[data-testid="personalization-timeline-row"][data-article-id="${articleId}"]`)
    await expect(row).toBeVisible({ timeout: 20_000 })
    const feedback = row.getByTestId('personalization-feed-feedback')
    if (!(await feedback.isVisible())) {
      await row.getByRole('button').first().click()
    }
    await expect(feedback).toHaveText('0 / 0', { timeout: 15_000 })
  },
}

export const FirstReaderArticleIsUnread = {
  async answeredBy(actor) {
    const article = articleByOrdinal(actor, 'first')
    await BrowseTheWeb.as(actor).goto('/')
    await timeline(actor).setShowReadArticles(true)
    await BrowseTheWeb.as(actor).getByTestId('reader-start-button').click()
    const card = timeline(actor).articleCard(article.id)
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card.locator('[data-testid="article-read-status"]').first()).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}
