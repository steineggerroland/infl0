import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { crawlerIngest, prepareReaderInflowFixture } from '../../support/crawler-fixtures.js'
import { logArticleEngagement } from '../../support/reader-engagement.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  HaveReaderArticles,
  SetReadingBehaviourTracking,
} from '../../support/screenplay/tasks/active-reader.js'
function timeline(world) {
  return new ReaderTimeline(world.page)
}

Given('{word} has unread articles in her inflow', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, HaveReaderArticles)
  const actor = currentActor(this, name)
  const articles = actor.recall('readerArticles')
  actor.remember('passiveArticleId', articles[0].id)
})

When('{word} opens infl0 without starting the reader', async function (name) {
  currentActor(this, name)
  await timeline(this).open()
  await expect(this.page.getByTestId('reader-start')).toBeVisible({ timeout: 20_000 })
})

When('{word} leaves for settings', async function (name) {
  currentActor(this, name)
  await this.page.goto('/settings')
  await expect(this.page).toHaveURL(/\/settings/u)
})

Then('{word} should still have no reading behaviour event for that article', async function (name) {
  const actor = currentActor(this, name)
  const articleId = actor.recall('passiveArticleId')
  if (!articleId) throw new Error(`${name} has no remembered passive article id.`)
  actor.remember('currentReaderArticleId', articleId)
  const page = this.page
  await page.goto('/settings/personalization')
  await expect(page).toHaveURL(/\/settings\/personalization/u)
  const row = page.locator(`[data-testid="personalization-timeline-row"][data-article-id="${articleId}"]`)
  await expect(row).toBeVisible({ timeout: 20_000 })
  const feedback = row.getByTestId('personalization-feed-feedback')
  if (!(await feedback.isVisible())) {
    await row.getByRole('button').first().click()
  }
  await expect(feedback).toHaveText('0 / 0', { timeout: 15_000 })
})

Given('{word} has enabled reading behaviour tracking', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, SetReadingBehaviourTracking(true))
})

Given('{word} has read articles from multiple sources', async function (name) {
  const actor = currentActor(this, name)
  const page = this.page
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
  const articles = []

  for (const index of [1, 2]) {
    const feedUrl = `https://example.com/bdd-priya/${suffix}-${index}.xml`
    await prepareReaderInflowFixture(page, this, feedUrl, `Priya source ${index}`)
    const articleId = `bdd-priya-${suffix}-0${index}`
    await crawlerIngest(page, {
      crawlKey: this.lastCrawlKey,
      id: articleId,
      link: `https://example.com/bdd-priya/${articleId}`,
      title: `Priya article ${index}`,
      author: 'BDD Author',
      publishedAt: new Date(Date.now() - index * 60_000).toISOString(),
      content_hash: `${articleId}-hash`,
      content_md: `# Priya ${index}`,
      source_type: 'rss',
      tld: 'example.com',
      categories: ['bdd'],
      teaser: `Teaser ${index}`,
      summary_long: `Summary ${index}`,
      category: ['bdd'],
      tags: ['priya'],
      seriousness_rating: 'low',
    })
    await logArticleEngagement(page, articleId, 'teaser', 8)
    articles.push({ id: articleId })
  }

  actor.remember('readerArticles', articles)
})

Then('{word} should see which signals influenced ranking', async function (name) {
  const actor = currentActor(this, name)
  const page = this.page
  await page.goto('/settings/personalization')
  await expect(page).toHaveURL(/\/settings\/personalization/u)
  const articles = actor.recall('readerArticles') ?? []
  const articleId = articles[0]?.id
  if (!articleId) throw new Error(`${name} has no remembered article for personalization inspection.`)
  actor.remember('personalizationArticleId', articleId)

  const row = page.locator(`[data-testid="personalization-timeline-row"][data-article-id="${articleId}"]`)
  await expect(row).toBeVisible({ timeout: 20_000 })
  const rankStats = row.getByTestId('personalization-rank-stats')
  if (!(await rankStats.isVisible())) {
    await row.locator('button').first().click()
  }
  await expect(rankStats).toBeVisible({ timeout: 15_000 })
  await expect(row.locator('table tbody tr').first()).toBeVisible()
})

Then('{word} should be able to reach the controls for changing those signals', async function (name) {
  const actor = currentActor(this, name)
  const page = this.page
  const articleId = actor.recall('personalizationArticleId')
  if (!articleId) throw new Error(`${name} has no remembered personalization article.`)
  const row = page.locator(`[data-testid="personalization-timeline-row"][data-article-id="${articleId}"]`)
  const rowFeedsLink = row.locator('a[href="/feeds"]').first()
  await expect(rowFeedsLink).toBeVisible()
  await rowFeedsLink.click()
  await expect(page).toHaveURL(/\/feeds/u)
})
