/**
 * Shared handler for `/api/inflow` (the canonical endpoint) and the
 * deprecated `/api/timeline` alias kept around for one release.
 *
 * The response is a discriminated union of card types: `article` and
 * `episode` rows come from the database (per-user `UserTimelineItem` +
 * global content tables), and `onboarding` cards are produced server-side
 * from `utils/onboarding-cards.ts` when `User.uiPrefs.onboardingHidden === false`.
 *
 * Onboarding cards do NOT participate in show-read, engagement
 * tracking, or rank scoring — they are always prepended to the first
 * page (`offset === 0`) and never appear on subsequent pages.
 */
import type { Article, ArticleEnrichment, Episode, EpisodeEnrichment, Prisma } from '~/generated/prisma/client'
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
import { parseEpisodeChapters, type InflowEpisodeChapter } from '../../utils/inflow-episode'

type ArticleWithEnrichment = Article & { enrichment: ArticleEnrichment | null }
type EpisodeWithEnrichment = Episode & { enrichment: EpisodeEnrichment | null }

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

/** Episode-shaped row for `EpisodeCard` (UI lands in a follow-up PR). */
export interface InflowEpisodeItem {
  type: 'episode'
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
  shownotes_md?: string
  media_url?: string
  media_type?: string
  duration_seconds?: number
  episode_number?: number | null
  season_number?: number | null
  episode_type?: string
  explicit?: boolean
  subtitle?: string
  image_url?: string
  chapters?: InflowEpisodeChapter[]
  crawl_key: string
  transcript_md?: string
  transcript_url?: string
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

export type InflowContentItem = InflowArticleItem | InflowEpisodeItem
export type InflowItem = InflowContentItem | InflowOnboardingItem

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

function mapEpisode(e: EpisodeWithEnrichment): Omit<InflowEpisodeItem, 'type' | 'insertedAt' | 'readAt'> {
  const enrich = e.enrichment
  const chapters = parseEpisodeChapters(e.chapters)
  return {
    id: e.id,
    title: e.title,
    link: e.link,
    author: e.author ?? '',
    publishedAt: (e.publishedAt ?? e.fetchedAt).toISOString(),
    fetchedAt: e.fetchedAt.toISOString(),
    source_type: e.sourceType ?? 'rss+podcast',
    tld: e.tld ?? '',
    teaser: enrich?.teaser ?? '',
    summary_long: enrich?.summaryLong ?? '',
    category: enrich?.category?.length ? enrich.category : undefined,
    tags: enrich?.tags ?? [],
    rawMarkdown: e.contentMd ?? undefined,
    ...(e.shownotesMd ? { shownotes_md: e.shownotesMd } : {}),
    ...(e.mediaUrl ? { media_url: e.mediaUrl } : {}),
    ...(e.mediaType ? { media_type: e.mediaType } : {}),
    ...(e.durationSeconds != null ? { duration_seconds: e.durationSeconds } : {}),
    ...(e.episodeNumber != null ? { episode_number: e.episodeNumber } : {}),
    ...(e.seasonNumber != null ? { season_number: e.seasonNumber } : {}),
    ...(e.episodeType ? { episode_type: e.episodeType } : {}),
    ...(e.explicit != null ? { explicit: e.explicit } : {}),
    ...(e.subtitle ? { subtitle: e.subtitle } : {}),
    ...(e.imageUrl ? { image_url: e.imageUrl } : {}),
    ...(chapters ? { chapters } : {}),
    crawl_key: e.crawlKey,
    ...(e.transcriptMd ? { transcript_md: e.transcriptMd } : {}),
    ...(e.transcriptUrl ? { transcript_url: e.transcriptUrl } : {}),
  }
}

type TimelineRow = {
  insertedAt: Date
  readAt: Date | null
  rankScore: number | null
  contentKind: 'article' | 'episode'
  article: ArticleWithEnrichment | null
  episode: EpisodeWithEnrichment | null
}

function mapTimelineRow(row: TimelineRow): InflowContentItem {
  if (row.contentKind === 'episode' && row.episode) {
    return {
      type: 'episode',
      ...mapEpisode(row.episode),
      insertedAt: row.insertedAt.toISOString(),
      readAt: row.readAt?.toISOString() ?? null,
    }
  }
  if (row.article) {
    return {
      type: 'article',
      ...mapArticle(row.article),
      insertedAt: row.insertedAt.toISOString(),
      readAt: row.readAt?.toISOString() ?? null,
    }
  }
  throw new Error('Timeline row missing article or episode payload')
}

function publishedAtMs(row: TimelineRow): number {
  const d =
    row.contentKind === 'episode'
      ? (row.episode?.publishedAt ?? row.episode?.fetchedAt)
      : (row.article?.publishedAt ?? row.article?.fetchedAt)
  return d ? d.getTime() : row.insertedAt.getTime()
}

function sortTimelineRows(rows: TimelineRow[]): TimelineRow[] {
  return [...rows].sort((a, b) => {
    const rankA = a.rankScore ?? Number.NEGATIVE_INFINITY
    const rankB = b.rankScore ?? Number.NEGATIVE_INFINITY
    if (rankA !== rankB) return rankB - rankA
    return publishedAtMs(b) - publishedAtMs(a)
  })
}

export function queryShowRead(q: Record<string, unknown>): boolean {
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

  const [totalCount, unreadCount, newSinceLastReaderSession] = await Promise.all([
    prisma.userTimelineItem.count({ where: { userId } }),
    prisma.userTimelineItem.count({ where: { userId, readAt: null } }),
    prisma.userTimelineItem.count({ where: newSinceLastReaderSessionWhere }),
  ])

  // Fetch a window sorted by rank + recency, then refine order in memory for mixed article/episode rows.
  const fetchTake = Math.min(500, offset + limit + 1 + 40)
  const rows = await prisma.userTimelineItem.findMany({
    where: listWhere,
    orderBy: [{ rankScore: { sort: 'desc', nulls: 'last' } }, { insertedAt: 'desc' }],
    take: fetchTake,
    include: {
      article: { include: { enrichment: true } },
      episode: { include: { enrichment: true } },
    },
  })

  const sorted = sortTimelineRows(rows as TimelineRow[])
  const sliced = sorted.slice(offset, offset + limit + 1)
  const hasMore = sliced.length > limit
  const page = hasMore ? sliced.slice(0, limit) : sliced
  const contentItems = page.map((row) => mapTimelineRow(row))

  const items: InflowItem[] =
    offset === 0 ? [...onboardingItems, ...contentItems] : contentItems

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
