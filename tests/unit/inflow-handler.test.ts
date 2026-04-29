/**
 * Unit tests for the inflow handler (`/api/inflow` and the legacy
 * `/api/timeline` alias).
 *
 * Covers the contract that matters at the HTTP boundary:
 *
 * - Onboarding cards are prepended on `offset === 0` only when
 *   `uiPrefs.onboardingHidden === false`.
 * - On subsequent pages (`offset > 0`) onboarding cards never appear,
 *   so paginating into article rows does not duplicate them.
 * - `stats.total` / `stats.unread` count article rows only — onboarding
 *   cards are not in the read/unread accounting.
 * - Article items keep the `type: 'article'` discriminator and the
 *   shape `ArticleView` consumes today.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '../../server/utils/prisma'
import { loadInflowPage } from '../../server/utils/inflow-handler'
import { defaultUiPrefs, toStoredUiPrefs } from '../../utils/ui-prefs'
import { ONBOARDING_CARDS } from '../../utils/onboarding-cards'

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userTimelineItem: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

const mocked = {
  user: vi.mocked(prisma.user.findUnique),
  count: vi.mocked(prisma.userTimelineItem.count),
  findFirst: vi.mocked(prisma.userTimelineItem.findFirst),
  findMany: vi.mocked(prisma.userTimelineItem.findMany),
}

function fakeUser(onboardingHidden: boolean) {
  const prefs = defaultUiPrefs()
  prefs.onboardingHidden = onboardingHidden
  return { id: 'u1', uiPrefs: toStoredUiPrefs(prefs) }
}

function fakeArticleRow(id: string) {
  return {
    insertedAt: new Date('2026-04-29T10:00:00Z'),
    readAt: null,
    article: {
      id,
      title: `Article ${id}`,
      link: `https://example.com/${id}`,
      author: 'Author',
      publishedAt: new Date('2026-04-29T09:00:00Z'),
      fetchedAt: new Date('2026-04-29T09:30:00Z'),
      sourceType: 'rss',
      tld: 'example.com',
      contentMd: null,
      enrichment: {
        teaser: 'teaser',
        summaryLong: 'summary',
        category: ['demo'],
        tags: ['t'],
      },
    },
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('loadInflowPage', () => {
  it('prepends onboarding cards on the first page when not hidden', async () => {
    mocked.user.mockResolvedValue(fakeUser(false) as never)
    mocked.count.mockResolvedValueOnce(2).mockResolvedValueOnce(2)
    mocked.findFirst.mockResolvedValue(null)
    mocked.findMany.mockResolvedValue([fakeArticleRow('a1'), fakeArticleRow('a2')] as never)

    const res = await loadInflowPage({ userId: 'u1', limit: 20, offset: 0, showRead: false })

    const onboarding = res.items.filter((i) => i.type === 'onboarding')
    const articles = res.items.filter((i) => i.type === 'article')

    expect(onboarding.map((c) => c.topic)).toEqual(
      [...ONBOARDING_CARDS].sort((a, b) => a.ordinal - b.ordinal).map((c) => c.topic),
    )
    expect(articles.map((a) => a.id)).toEqual(['a1', 'a2'])
    // Onboarding always sits first.
    const firstArticleIdx = res.items.findIndex((i) => i.type === 'article')
    expect(firstArticleIdx).toBe(onboarding.length)
    // Stats count articles only.
    expect(res.stats).toEqual({ total: 2, unread: 2 })
  })

  it('omits onboarding cards entirely when onboardingHidden is true', async () => {
    mocked.user.mockResolvedValue(fakeUser(true) as never)
    mocked.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0)
    mocked.findFirst.mockResolvedValue(null)
    mocked.findMany.mockResolvedValue([] as never)

    const res = await loadInflowPage({ userId: 'u1', limit: 20, offset: 0, showRead: false })

    expect(res.items).toHaveLength(0)
    expect(res.stats).toEqual({ total: 0, unread: 0 })
  })

  it('does not re-emit onboarding cards on subsequent pages', async () => {
    mocked.user.mockResolvedValue(fakeUser(false) as never)
    mocked.count.mockResolvedValueOnce(50).mockResolvedValueOnce(50)
    mocked.findFirst.mockResolvedValue({ id: 'x' } as never)
    mocked.findMany.mockResolvedValue([fakeArticleRow('a3')] as never)

    const res = await loadInflowPage({ userId: 'u1', limit: 20, offset: 20, showRead: false })

    expect(res.items.every((i) => i.type === 'article')).toBe(true)
  })

  it('sets type=article and exposes the existing article shape', async () => {
    mocked.user.mockResolvedValue(fakeUser(true) as never)
    mocked.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1)
    mocked.findFirst.mockResolvedValue(null)
    mocked.findMany.mockResolvedValue([fakeArticleRow('a1')] as never)

    const res = await loadInflowPage({ userId: 'u1', limit: 20, offset: 0, showRead: false })
    const article = res.items[0]
    expect(article).toBeDefined()
    if (article && article.type === 'article') {
      expect(article.id).toBe('a1')
      expect(article.title).toBe('Article a1')
      expect(article.teaser).toBe('teaser')
      expect(article.summary_long).toBe('summary')
      expect(article.tags).toEqual(['t'])
      expect(article.publishedAt).toMatch(/^2026-04-29T09:00:00/u)
    } else {
      throw new Error('expected an article item')
    }
  })

  it('throws 401 when the session user no longer exists', async () => {
    mocked.user.mockResolvedValue(null)
    await expect(
      loadInflowPage({ userId: 'u1', limit: 20, offset: 0, showRead: false }),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('reports hasMore correctly when the database returns limit+1', async () => {
    mocked.user.mockResolvedValue(fakeUser(true) as never)
    mocked.count.mockResolvedValueOnce(10).mockResolvedValueOnce(10)
    mocked.findFirst.mockResolvedValue(null)
    const rows = Array.from({ length: 21 }, (_, i) => fakeArticleRow(`a${i}`))
    mocked.findMany.mockResolvedValue(rows as never)

    const res = await loadInflowPage({ userId: 'u1', limit: 20, offset: 0, showRead: false })

    const articles = res.items.filter((i) => i.type === 'article')
    expect(articles).toHaveLength(20)
    expect(res.hasMore).toBe(true)
  })
})
