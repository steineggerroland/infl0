import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

function articleOrdinalIndex(ordinal) {
  if (ordinal === 'first') return 0
  if (ordinal === 'second') return 1
  throw new Error(`Unsupported reader article ordinal: ${ordinal}`)
}

function currentArticle(world) {
  const id = world.currentReaderArticleId
  if (!id) throw new Error('No current reader article is focused.')
  return world.page.locator(`[data-testid="article-card"][data-article-id="${id}"]`).first()
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

async function authedJsonFetch(world, url, init) {
  await ensureAppOrigin(world)
  const data = await world.page.evaluate(
    async ({ targetUrl, requestInit }) => {
      const res = await fetch(targetUrl, {
        ...requestInit,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(requestInit.headers ?? {}),
        },
      })
      return { ok: res.ok, status: res.status, body: await res.text() }
    },
    { targetUrl: url, requestInit: init },
  )
  if (!data.ok) {
    throw new Error(`Authenticated request failed (${data.status}) ${url}: ${data.body}`)
  }
  return data.body ? JSON.parse(data.body) : null
}

async function crawlerIngest(world, payload) {
  await ensureAppOrigin(world)
  const crawlerKey = process.env.NUXT_CRAWLER_API_KEY
  if (!crawlerKey) {
    throw new Error('NUXT_CRAWLER_API_KEY is required for HTTP-only reader BDD fixtures.')
  }
  const data = await world.page.evaluate(
    async ({ requestPayload, key }) => {
      const res = await fetch('/api/crawler/ingest', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Crawler-Key': key,
        },
        body: JSON.stringify(requestPayload),
      })
      return { ok: res.ok, status: res.status, body: await res.text() }
    },
    { requestPayload: payload, key: crawlerKey },
  )
  if (!data.ok) {
    throw new Error(`Crawler ingest failed (${data.status}): ${data.body}`)
  }
  return data.body ? JSON.parse(data.body) : null
}

Given('my inflow contains reader articles', async function () {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
  const crawlKey = `https://example.com/bdd-reader/${suffix}`
  const feedUrl = `${crawlKey}.xml`
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

  await authedJsonFetch(this, '/api/me/ui-prefs', {
    method: 'PATCH',
    body: JSON.stringify({ onboardingHidden: true }),
  })

  const feed = await authedJsonFetch(this, '/api/feeds', {
    method: 'POST',
    body: JSON.stringify({ feedUrl, displayTitle: 'BDD reader feed' }),
  })
  const normalizedCrawlKey = feed?.feed?.crawlKey
  if (!normalizedCrawlKey) throw new Error('Feed creation did not return a crawlKey.')

  for (const article of articles) {
    await crawlerIngest(this, {
      crawlKey: normalizedCrawlKey,
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
})

Given('the first reader article is already read', async function () {
  await this.page.goto('/')
  await this.page.getByTestId('reader-start-button').click()
  const article = this.readerArticles?.[0]
  if (!article) throw new Error('No first reader article exists.')
  const card = this.page.locator(`[data-testid="article-card"][data-article-id="${article.id}"]`).first()
  await expect(card).toBeVisible()
  this.currentReaderArticleId = article.id
  await card.locator('.action-flip-front').click()
  await authedJsonFetch(this, `/api/me/articles/${encodeURIComponent(article.id)}/read-state`, {
    method: 'PATCH',
    body: JSON.stringify({ read: true }),
  })
  await this.page.goto('/help')
})

Given('I show read reader articles', async function () {
  await this.page.goto('/help')
  await this.page.evaluate(() => {
    window.localStorage.setItem('infl0.timeline.showRead', '1')
  })
})

Given('reading behaviour tracking is enabled', async function () {
  await authedJsonFetch(this, '/api/me/engagement-tracking', {
    method: 'PATCH',
    body: JSON.stringify({ enabled: true }),
  })
})

Given('reading behaviour tracking is disabled', async function () {
  await authedJsonFetch(this, '/api/me/engagement-tracking', {
    method: 'PATCH',
    body: JSON.stringify({ enabled: false }),
  })
})

Given('my last reader session started before these articles arrived', async function () {
  const startedAt = new Date(Date.now() - 60_000).toISOString()
  await authedJsonFetch(this, '/api/me/ui-prefs', {
    method: 'PATCH',
    body: JSON.stringify({ lastReaderSessionStartedAt: startedAt }),
  })
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

When('I focus the {word} reader article', async function (ordinal) {
  const article = this.readerArticles?.[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`No ${ordinal} reader article exists.`)
  const card = this.page.locator(`[data-testid="article-card"][data-article-id="${article.id}"]`).first()
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

Then('the URL should point to the {word} reader article', async function (ordinal) {
  const article = this.readerArticles?.[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`No ${ordinal} reader article exists.`)
  await expect(this.page).toHaveURL(new RegExp(`/inflow/article/${article.id}$`, 'u'))
})

Then('the {word} reader article should be restored as my current reader article', async function (ordinal) {
  const article = this.readerArticles?.[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`No ${ordinal} reader article exists.`)
  const card = this.page.locator(`[data-testid="article-card"][data-article-id="${article.id}"]`).first()
  await expect(card).toBeVisible()
  await expect.poll(async () => visibleRatio(card)).toBeGreaterThan(0.5)
})

Then('the current reader article should show that it is read', async function () {
  const card = currentArticle(this)
  await expect(card.locator('[data-testid="article-read-status"]').first()).toBeVisible({
    timeout: 10_000,
  })
  await expect(card.locator('[data-testid="article-read-status"]').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

Then('the current reader article should become read', async function () {
  const card = currentArticle(this)
  await expect(card.locator('[data-testid="article-read-status"]').first()).toHaveAttribute(
    'aria-pressed',
    'true',
    { timeout: 10_000 },
  )
  const data = await readStateForCurrentArticle(this)
  expect(data.item?.readAt).not.toBeNull()
})

Then('the current reader article should become unread', async function () {
  const card = currentArticle(this)
  await expect(card.locator('[data-testid="article-read-status"]').first()).toHaveAttribute(
    'aria-pressed',
    'false',
    { timeout: 10_000 },
  )
  const data = await readStateForCurrentArticle(this)
  expect(data.item?.readAt).toBeNull()
})

Then('no reading behaviour event should be stored for the current reader article', async function () {
  const articleId = this.currentReaderArticleId
  if (!articleId) throw new Error('No current reader article is focused.')
  const data = await authedJsonFetch(this, '/api/me/personalization-dashboard', { method: 'GET' })
  expect(data.pies.feeds).toEqual([])
  expect(data.pies.categories).toEqual([])
  expect(data.pies.tags).toEqual([])

  const row = data.timeline.find((candidate) => candidate.articleId === articleId)
  expect(row, `No personalization row found for article ${articleId}`).toBeTruthy()
  expect(row.engagement.feed.posPoints).toBe(0)
  expect(row.engagement.feed.negPoints).toBe(0)
  for (const category of row.engagement.categories) {
    expect(category.posPoints).toBe(0)
    expect(category.negPoints).toBe(0)
  }
  for (const tag of row.engagement.tags) {
    expect(tag.posPoints).toBe(0)
    expect(tag.negPoints).toBe(0)
  }
})

Then('I should see the reader start screen', async function () {
  await expect(this.page.getByTestId('reader-start')).toBeVisible()
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
  const data = await readStateForArticle(this, article.id)
  const item = data.item
  expect(item).toBeTruthy()
  expect(item.readAt).toBeNull()
})

async function readStateForCurrentArticle(world) {
  const articleId = world.currentReaderArticleId
  if (!articleId) throw new Error('No current reader article is focused.')
  return await readStateForArticle(world, articleId)
}

async function readStateForArticle(world, articleId) {
  await ensureAppOrigin(world)
  const data = await world.page.evaluate(async (targetArticleId) => {
    const res = await fetch('/api/inflow?showRead=1', { credentials: 'include' })
    return { ok: res.ok, status: res.status, body: await res.json(), articleId: targetArticleId }
  }, articleId)
  expect(data.ok, `GET /api/inflow?showRead=1 failed with ${data.status}`).toBe(true)
  return {
    item: data.body.items.find(
      (candidate) => candidate.type === 'article' && candidate.id === data.articleId,
    ),
  }
}
