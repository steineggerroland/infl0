import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { crawlerIngest } from '../support/crawler-fixtures.js'
import {
  addSourceViaUi,
  hideOnboardingCards,
  readerArticleCard,
  setReadingBehaviourTracking,
  setShowReadArticles,
} from '../support/ui-helpers.js'

function articleOrdinalIndex(ordinal) {
  if (ordinal === 'first') return 0
  if (ordinal === 'second') return 1
  throw new Error(`Unsupported reader article ordinal: ${ordinal}`)
}

function currentArticle(world) {
  const id = world.currentReaderArticleId
  if (!id) throw new Error('No current reader article is focused.')
  return readerArticleCard(world.page, id)
}

async function visibleRatio(locator) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
    if (rect.height <= 0) return 0
    return Math.max(0, Math.min(visibleHeight, rect.height)) / rect.height
  })
}

async function ensureAppOrigin(world) {
  if (world.page.url() === 'about:blank') {
    await world.page.goto('/help')
  }
}

/** No UI for crawler delivery — simulates TopicKnowledgeCrawler after the user adds a source. */
Given('my inflow contains reader articles', async function () {
  await ensureAppOrigin(this)
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
  const feedUrl = `https://example.com/bdd-reader/${suffix}.xml`
  const now = Date.now()
  const articles = [
    {
      id: `bdd-reader-${suffix}-01`,
      title: 'BDD reader article one',
      teaser: 'A short first reader article for return-context tests.',
      summary: 'The first article summary gives the reader something to dwell on.',
      publishedAt: new Date(now - 60_000),
    },
    {
      id: `bdd-reader-${suffix}-02`,
      title: 'BDD reader article two',
      teaser: 'A second reader article that should stay addressable after reload.',
      summary: 'The second article summary is used to prove the current place is restored.',
      publishedAt: new Date(now - 120_000),
    },
  ]

  await hideOnboardingCards(this.page)
  await addSourceViaUi(this.page, this, feedUrl, 'BDD reader feed')
  const crawlKey = this.lastCrawlKey
  if (!crawlKey) throw new Error('Add source did not record crawlKey.')

  for (const article of articles) {
    await crawlerIngest(this.page, {
      crawlKey,
      id: article.id,
      link: `https://example.com/bdd-reader/${article.id}`,
      title: article.title,
      author: 'BDD Author',
      publishedAt: article.publishedAt.toISOString(),
      content_hash: `${article.id}-hash`,
      content_md: `# ${article.title}\n\nFull text for ${article.title}.`,
      source_type: 'rss',
      tld: 'example.com',
      categories: ['bdd', 'reader'],
      teaser: article.teaser,
      summary_long: article.summary,
      category: ['bdd', 'reader'],
      tags: ['return-context'],
      seriousness_rating: 'low',
    })
  }

  this.readerArticles = articles
  await this.page.goto('/')
})

Given('the first reader article is already read', async function () {
  const article = this.readerArticles?.[0]
  if (!article) throw new Error('No first reader article exists.')
  await this.page.goto('/')
  await setShowReadArticles(this.page, true)
  await this.page.getByTestId('reader-start-button').click()
  const card = readerArticleCard(this.page, article.id)
  await expect(card).toBeVisible()
  await card.scrollIntoViewIfNeeded()
  await card.locator('h1').first().click()
  await expect(card).toHaveAttribute('data-reader-selected', 'true')
  this.currentReaderArticleId = article.id
  await card.locator('[data-testid="article-read-status"]').first().click()
  await expect(card.locator('[data-testid="article-read-status"]').first()).toHaveAttribute(
    'aria-pressed',
    'true',
    { timeout: 10_000 },
  )
  await this.page.goto('/help')
})

Given('I show read reader articles', async function () {
  await setShowReadArticles(this.page, true)
})

Given('reading behaviour tracking is enabled', async function () {
  await setReadingBehaviourTracking(this.page, true)
})

Given('reading behaviour tracking is disabled', async function () {
  await setReadingBehaviourTracking(this.page, false)
})

/**
 * No UI to backdate the reader session anchor — PATCH mirrors a session that ended
 * before Background articles were ingested.
 */
Given('my last reader session started before these articles arrived', async function () {
  await ensureAppOrigin(this)
  const startedAt = new Date(Date.now() - 60_000).toISOString()
  const result = await this.page.evaluate(async (iso) => {
    const res = await fetch('/api/me/ui-prefs', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastReaderSessionStartedAt: iso }),
    })
    return { ok: res.ok, status: res.status, body: await res.text() }
  }, startedAt)
  if (!result.ok) {
    throw new Error(`Could not set last reader session (${result.status}): ${result.body}`)
  }
})

When('I start reading', async function () {
  await this.page.getByTestId('reader-start-button').click()
})

When('I jump to the last reader article', async function () {
  await this.page.getByTestId('reader-resume-button').click()
})

When('I leave the app without starting the reader', async function () {
  await this.page.waitForTimeout(2500)
  await this.page.goto('/settings')
})

When('I open the floating menu and go to Help', async function () {
  const menu = this.page.locator('body > header .dropdown.dropdown-end').first()
  const summary = menu.locator('summary').first()
  await expect(summary).toBeVisible({ timeout: 15_000 })
  const isOpen = await menu.evaluate((el) => el instanceof HTMLDetailsElement && el.open)
  if (!isOpen) {
    await summary.click()
  }
  const helpLink = menu.locator('.dropdown-content a[href="/help"]').first()
  await expect(helpLink).toBeVisible({ timeout: 10_000 })
  await helpLink.click()
  await expect(this.page).toHaveURL(/\/help(?:[?#].*)?$/u, { timeout: 15_000 })
})

When('I return to the timeline by opening home', async function () {
  await this.page.goto('/')
})

When('I focus the {word} reader article', async function (ordinal) {
  const article = this.readerArticles?.[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`No ${ordinal} reader article exists.`)
  const card = readerArticleCard(this.page, article.id)
  await expect(card).toBeVisible()
  await card.scrollIntoViewIfNeeded()
  await expect.poll(async () => visibleRatio(card)).toBeGreaterThan(0.5)
  await card.locator('h1').first().click()
  await expect(card).toHaveAttribute('data-reader-selected', 'true')
  this.currentReaderArticleId = article.id
})

When('I flip the current reader article', async function () {
  await currentArticle(this).locator('.action-flip-front').click()
})

When('I press the read-state shortcut', async function () {
  await this.page.keyboard.press('m')
})

When('I mark the current reader article as read', async function () {
  const card = currentArticle(this)
  const readControl = card.locator('[data-testid="article-read-status"]').first()
  if ((await readControl.getAttribute('aria-pressed')) !== 'true') {
    await readControl.click()
  }
  await expect(readControl).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
})

Given('read articles are hidden in my timeline view', async function () {
  await setShowReadArticles(this.page, false)
})

Then('the URL should point to the {word} reader article', async function (ordinal) {
  const article = this.readerArticles?.[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`No ${ordinal} reader article exists.`)
  await expect(this.page).toHaveURL(new RegExp(`/inflow/article/${article.id}$`, 'u'))
})

Then('the {word} reader article should be restored as my current reader article', async function (ordinal) {
  const article = this.readerArticles?.[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`No ${ordinal} reader article exists.`)
  const card = readerArticleCard(this.page, article.id)
  await expect(card).toBeVisible()
  await expect.poll(async () => visibleRatio(card)).toBeGreaterThan(0.5)
})

Then('the current reader article should show that it is read', async function () {
  const readControl = currentArticle(this).locator('[data-testid="article-read-status"]').first()
  await expect(readControl).toBeVisible({ timeout: 10_000 })
  await expect(readControl).toHaveAttribute('aria-pressed', 'true')
})

Then('the current reader article should become read', async function () {
  await expect(
    currentArticle(this).locator('[data-testid="article-read-status"]').first(),
  ).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
})

Then('the current reader article should become unread', async function () {
  await expect(
    currentArticle(this).locator('[data-testid="article-read-status"]').first(),
  ).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 })
})

Then('no reading behaviour event should be stored for the current reader article', async function () {
  const articleId = this.currentReaderArticleId
  if (!articleId) throw new Error('No current reader article is focused.')
  await this.page.goto('/settings/personalization')
  await expect(this.page).toHaveURL(/\/settings\/personalization/u)
  const row = this.page.locator(
    `[data-testid="personalization-timeline-row"][data-article-id="${articleId}"]`,
  )
  await expect(row).toBeVisible({ timeout: 20_000 })
  const feedback = row.getByTestId('personalization-feed-feedback')
  if (!(await feedback.isVisible())) {
    await row.getByRole('button').first().click()
  }
  await expect(feedback).toHaveText('0 / 0', {
    timeout: 15_000,
  })
})

Then('I should see the reader start screen', async function () {
  await expect(this.page.getByTestId('reader-start')).toBeVisible()
})

Then('I should not see the reader start screen', async function () {
  await expect(this.page.getByTestId('reader-start')).toHaveCount(0)
})

Then('I should not see reader article cards', async function () {
  await expect(this.page.getByTestId('article-card')).toHaveCount(0)
})

Then('I should not see the resume reader action', async function () {
  await expect(this.page.getByTestId('reader-resume-button')).toHaveCount(0)
})

Then('I should see {int} new reader articles on the reader start screen', async function (count) {
  await expect(this.page.getByTestId('reader-start')).toContainText(`${count}`)
})

Then('the first reader article should still be unread', async function () {
  const article = this.readerArticles?.[0]
  if (!article) throw new Error('No first reader article exists.')
  await this.page.goto('/')
  await setShowReadArticles(this.page, true)
  await this.page.getByTestId('reader-start-button').click()
  const card = readerArticleCard(this.page, article.id)
  await expect(card).toBeVisible({ timeout: 15_000 })
  await expect(card.locator('[data-testid="article-read-status"]').first()).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
