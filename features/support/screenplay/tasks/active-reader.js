import { expect } from '@playwright/test'
import { browserFetchJson, crawlerIngest, prepareReaderInflowFixture } from '../../crawler-fixtures.js'
import { ReaderTimeline } from '../../reader-timeline.js'
import { SettingsPage } from '../../settings-page.js'
import { UserMenu } from '../../user-menu.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function articleOrdinalIndex(ordinal) {
  if (ordinal === 'first') return 0
  if (ordinal === 'second') return 1
  throw new Error(`Unsupported reader article ordinal: ${ordinal}`)
}

function timeline(actor) {
  return new ReaderTimeline(BrowseTheWeb.as(actor))
}

function readerArticles(actor) {
  const articles = actor.recall('readerArticles')
  if (!articles?.length) throw new Error(`${actor.name} has no reader articles.`)
  return articles
}

function articleByOrdinal(actor, ordinal) {
  const article = readerArticles(actor)[articleOrdinalIndex(ordinal)]
  if (!article) throw new Error(`${actor.name} has no ${ordinal} reader article.`)
  return article
}

function currentArticleCard(actor) {
  const id = actor.recall('currentReaderArticleId')
  if (!id) throw new Error(`${actor.name} has no current reader article.`)
  return timeline(actor).articleCard(id)
}

async function ensureAppOrigin(actor) {
  const page = BrowseTheWeb.as(actor)
  if (page.url() === 'about:blank') {
    await page.goto('/help')
  }
}

async function waitForReaderArticles(page, articles) {
  const ids = new Set(articles.map((article) => article.id))
  await expect.poll(async () => {
    const res = await browserFetchJson(page, '/api/inflow?limit=20&showRead=1')
    if (!res.ok) return { ready: false, detail: `GET /api/inflow failed (${res.status})` }
    const items = Array.isArray(res.data?.items) ? res.data.items : []
    const seen = items.filter((item) => ids.has(item?.id)).length
    return {
      ready: seen === ids.size && (res.data?.stats?.total ?? 0) >= ids.size,
      detail: `saw ${seen}/${ids.size} reader articles`,
    }
  }, {
    message: 'reader fixture articles should be visible through /api/inflow',
    timeout: 20_000,
  }).toMatchObject({ ready: true })
}

export const HaveReaderArticles = {
  async performAs(actor) {
    await ensureAppOrigin(actor)
    const page = BrowseTheWeb.as(actor)
    const suffix = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`
    const feedUrl = `https://example.com/bdd-reader/${suffix}.xml`
    const now = Date.now()
    const articles = [
      {
        id: `bdd-reader-${suffix}-01`,
        title: `${actor.name} reader article one`,
        teaser: 'A short first reader article for return-context tests.',
        summary: 'The first article summary gives the reader something to dwell on.',
        publishedAt: new Date(now - 60_000),
      },
      {
        id: `bdd-reader-${suffix}-02`,
        title: `${actor.name} reader article two`,
        teaser: 'A second reader article that should stay addressable after reload.',
        summary: 'The second article summary is used to prove the current place is restored.',
        publishedAt: new Date(now - 120_000),
      },
    ]

    await prepareReaderInflowFixture(page, actor.world, feedUrl, `${actor.name} reader feed`)
    for (const article of articles) {
      await crawlerIngest(page, {
        crawlKey: actor.world.lastCrawlKey,
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

    await waitForReaderArticles(page, articles)
    actor.remember('readerArticles', articles)
    await page.goto('/')
  },
}

export const OpenReaderTimeline = {
  async performAs(actor) {
    await timeline(actor).open()
  },
}

export const StartReaderSession = {
  async performAs(actor) {
    await timeline(actor).startReading()
  },
}

export function FocusReaderArticle(ordinal) {
  return {
    async performAs(actor) {
      const article = articleByOrdinal(actor, ordinal)
      const card = timeline(actor).articleCard(article.id)
      await expect(card).toBeVisible()
      await card.scrollIntoViewIfNeeded()
      await expect.poll(async () => timeline(actor).visibleRatio(card)).toBeGreaterThan(0.5)
      await card.locator('h1').first().click()
      await expect(card).toHaveAttribute('data-reader-selected', 'true')
      actor.remember('currentReaderArticleId', article.id)
    },
  }
}

export const ReloadReaderTimeline = {
  async performAs(actor) {
    await BrowseTheWeb.as(actor).reload({ waitUntil: 'networkidle' })
  },
}

export const JumpToLastReaderArticle = {
  async performAs(actor) {
    await BrowseTheWeb.as(actor).getByTestId('reader-resume-button').click()
  },
}

export const LeaveBeforeReaderStart = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await page.waitForTimeout(2500)
    await page.goto('/settings')
  },
}

export const GoToHelpFromReader = {
  async performAs(actor) {
    await new UserMenu(BrowseTheWeb.as(actor)).goToHelp()
  },
}

export const ReturnHome = {
  async performAs(actor) {
    await BrowseTheWeb.as(actor).goto('/')
  },
}

export const MarkCurrentReaderArticleRead = {
  async performAs(actor) {
    const readControl = currentArticleCard(actor).locator('[data-testid="article-read-status"]').first()
    if ((await readControl.getAttribute('aria-pressed')) !== 'true') {
      await readControl.click()
    }
    await expect(readControl).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
  },
}

export const PressReadStateShortcut = {
  async performAs(actor) {
    await BrowseTheWeb.as(actor).keyboard.press('m')
  },
}

export const HideReadReaderArticles = {
  async performAs(actor) {
    await timeline(actor).setShowReadArticles(false)
  },
}

export const ShowReadReaderArticles = {
  async performAs(actor) {
    await timeline(actor).setShowReadArticles(true)
  },
}

export const HaveFirstReaderArticleRead = {
  async performAs(actor) {
    const article = articleByOrdinal(actor, 'first')
    await BrowseTheWeb.as(actor).goto('/')
    await ShowReadReaderArticles.performAs(actor)
    await StartReaderSession.performAs(actor)
    await FocusReaderArticle('first').performAs(actor)
    await MarkCurrentReaderArticleRead.performAs(actor)
    await expect(timeline(actor).articleCard(article.id)).toBeVisible()
    await BrowseTheWeb.as(actor).goto('/help')
  },
}

export function SetReadingBehaviourTracking(enabled) {
  return {
    async performAs(actor) {
      await new SettingsPage(BrowseTheWeb.as(actor)).setReadingBehaviourTracking(enabled)
    },
  }
}

export const BackdateLastReaderSession = {
  async performAs(actor) {
    await ensureAppOrigin(actor)
    const startedAt = new Date(Date.now() - 60_000).toISOString()
    const result = await BrowseTheWeb.as(actor).evaluate(async (iso) => {
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
  },
}
