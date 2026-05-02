/**
 * Shared handler for `/api/inflow` (the canonical endpoint) and the
 * deprecated `/api/timeline` alias kept around for one release.
 *
 * The response is a discriminated union of card types: `article` cards
 * come from the database (per-user `UserTimelineItem` rows + the global
 * `Article` + `ArticleEnrichment` join), and `onboarding` cards are
 * produced server-side from `utils/onboarding-cards.ts` when
 * `User.uiPrefs.onboardingHidden === false`.
 *
 * Onboarding cards do NOT participate in show-read, engagement
 * tracking, or rank scoring — they are always prepended to the first
 * page (`offset === 0`) and never appear on subsequent pages, no
 * matter how the article rows below them are ordered.
 */
import type { Article, ArticleEnrichment, Prisma } from '~/generated/prisma/client'
import type { H3Event } from 'h3'
import { createError, getQuery } from 'h3'
import { prisma } from './prisma'
import { getSessionUserId } from './auth-session'
import {
  ONBOARDING_CARDS,
  type OnboardingCardCta,
  type OnboardingTopic,
} from '../../utils/onboarding-cards'
import { resolveUiPrefs } from '../../utils/ui-prefs'

type ArticleWithEnrichment = Article & { enrichment: ArticleEnrichment | null }

/** Article-shaped row in the inflow response (kept compatible with `ArticleView.vue`). */
export interface InflowArticleItem {
  type: 'article'
  id: string
  title: string
  link: string
  author: string
  publishedAt: string
  fetchedAt: string
  source_type: string
  tld: string
  teaser: string
  summary_long: string
  category?: string[]
  tags: string[]
  rawMarkdown?: string
  insertedAt: string
  readAt: string | null
}

/** Onboarding-shaped row in the inflow response (locale-free; copy lives in i18n). */
export interface InflowOnboardingItem {
  type: 'onboarding'
  id: `onboarding/${OnboardingTopic}`
  topic: OnboardingTopic
  ordinal: number
  hasDeviceVariants: boolean
  cta?: OnboardingCardCta
}

export type InflowItem = InflowArticleItem | InflowOnboardingItem

export interface InflowResponse {
  items: InflowItem[]
  hasMore: boolean
  stats: { total: number; unread: number; newSinceLastReaderSession: number }
}

function mapArticle(a: ArticleWithEnrichment): Omit<InflowArticleItem, 'type' | 'insertedAt' | 'readAt'> {
  const e = a.enrichment
  return {
    id: a.id,
    title: a.title,
    link: a.link,
    author: a.author ?? '',
    publishedAt: (a.publishedAt ?? a.fetchedAt).toISOString(),
    fetchedAt: a.fetchedAt.toISOString(),
    source_type: a.sourceType ?? 'unknown',
    tld: a.tld ?? '',
    teaser: e?.teaser ?? '',
    summary_long: e?.summaryLong ?? '',
    category: e?.category?.length ? e.category : undefined,
    tags: e?.tags ?? [],
    rawMarkdown: a.contentMd ?? undefined,
  }
}

function mapTimelineItem(row: {
  insertedAt: Date
  readAt: Date | null
  article: ArticleWithEnrichment
}): InflowArticleItem {
  return {
    type: 'article',
    ...mapArticle(row.article),
    insertedAt: row.insertedAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  }
}

function queryShowRead(q: Record<string, unknown>): boolean {
  const v = q.showRead
  if (v === true || v === 1) return true
  if (typeof v === 'string') {
    const s = v.toLowerCase()
    return s === '1' || s === 'true' || s === 'yes'
  }
  return false
}

function buildOnboardingItems(): InflowOnboardingItem[] {
  return [...ONBOARDING_CARDS]
    .sort((a, b) => a.ordinal - b.ordinal)
    .map<InflowOnboardingItem>((card) => ({
      type: 'onboarding',
      id: `onboarding/${card.topic}` as InflowOnboardingItem['id'],
      topic: card.topic,
      ordinal: card.ordinal,
      hasDeviceVariants: card.hasDeviceVariants,
      ...(card.cta ? { cta: { ...card.cta } } : {}),
    }))
}

/**
 * Pure helper extracted so unit tests can drive `handleInflowRequest`
 * without a real H3 event. The wrapper exported below performs the
 * H3-specific bits (auth lookup, query parsing).
 */
export async function loadInflowPage(opts: {
  userId: string
  limit: number
  offset: number
  showRead: boolean
}): Promise<InflowResponse> {
  const { userId, limit, offset, showRead } = opts

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, uiPrefs: true },
  })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const prefs = resolveUiPrefs(user.uiPrefs)
  const onboardingItems = prefs.onboardingHidden ? [] : buildOnboardingItems()

  const listWhere: Prisma.UserTimelineItemWhereInput = showRead
    ? { userId }
    : { userId, readAt: null }

  const lastReaderSessionStartedAt = prefs.lastReaderSessionStartedAt
    ? new Date(prefs.lastReaderSessionStartedAt)
    : null
  const newSinceLastReaderSessionWhere: Prisma.UserTimelineItemWhereInput = {
    userId,
    ...(lastReaderSessionStartedAt && Number.isFinite(lastReaderSessionStartedAt.getTime())
      ? { insertedAt: { gt: lastReaderSessionStartedAt } }
      : {}),
  }

  const [totalCount, unreadCount, newSinceLastReaderSession, anyScored] = await Promise.all([
    prisma.userTimelineItem.count({ where: { userId } }),
    prisma.userTimelineItem.count({ where: { userId, readAt: null } }),
    prisma.userTimelineItem.count({ where: newSinceLastReaderSessionWhere }),
    prisma.userTimelineItem.findFirst({
      where: { ...listWhere, rankScore: { not: null } },
      select: { id: true },
    }),
  ])

  const orderBy: Prisma.UserTimelineItemOrderByWithRelationInput[] = anyScored
    ? [
        { rankScore: { sort: 'desc', nulls: 'last' } },
        { article: { publishedAt: 'desc' } },
        { article: { id: 'desc' } },
      ]
    : [{ article: { publishedAt: 'desc' } }, { article: { id: 'desc' } }]

  const rows = await prisma.userTimelineItem.findMany({
    where: listWhere,
    orderBy,
    skip: offset,
    take: limit + 1,
    include: {
      article: { include: { enrichment: true } },
    },
  })

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const articleItems = page.map((row) => mapTimelineItem(row))

  // Onboarding cards always sit at the very top of the first page.
  // They never appear on subsequent pages: callers paginate the article
  // list, not the synthetic onboarding prefix.
  const items: InflowItem[] = offset === 0 ? [...onboardingItems, ...articleItems] : articleItems

  return {
    items,
    hasMore,
    stats: { total: totalCount, unread: unreadCount, newSinceLastReaderSession },
  }
}

/** Common entry point used by both `/api/inflow.get.ts` and the legacy alias. */
export async function handleInflowRequest(event: H3Event): Promise<InflowResponse> {
  const userId = await getSessionUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const q = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number(q.limit) || 20))
  const offset = Math.max(0, Math.min(50_000, Number(q.offset) || 0))
  const showRead = queryShowRead(q as Record<string, unknown>)

  return loadInflowPage({ userId, limit, offset, showRead })
}
