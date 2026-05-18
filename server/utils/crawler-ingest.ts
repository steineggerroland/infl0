import { Prisma } from '~/generated/prisma/client'
import type { PrismaClient } from '~/generated/prisma/client'
import {
  parseIngestCommon,
  parseIngestEpisodeExtras,
  parseIngestItemKind,
  resolveIngestSource,
  type IngestCommonFields,
  type IngestEpisodeFields,
} from '../../utils/ingest-item'
import { normalizeFeedUrl } from './feed-url'

type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>

function asJson(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (v === undefined) return undefined
  if (v === null) return Prisma.JsonNull
  return v as Prisma.InputJsonValue
}

function hasEnrichment(common: IngestCommonFields): boolean {
  return (
    common.teaser !== undefined ||
    common.summaryLong !== undefined ||
    common.enrichCategory.length > 0 ||
    common.tags.length > 0 ||
    common.seriousnessRating !== undefined
  )
}

async function upsertEnrichment(
  tx: Tx,
  articleId: string,
  common: IngestCommonFields,
): Promise<void> {
  if (!hasEnrichment(common)) return
  await tx.articleEnrichment.upsert({
    where: { articleId },
    create: {
      articleId,
      teaser: common.teaser,
      summaryLong: common.summaryLong,
      category: common.enrichCategory,
      tags: common.tags,
      seriousnessRating: common.seriousnessRating,
    },
    update: {
      teaser: common.teaser,
      summaryLong: common.summaryLong,
      category: common.enrichCategory,
      tags: common.tags,
      seriousnessRating: common.seriousnessRating,
      lastUpdated: new Date(),
    },
  })
}

async function upsertEpisodeEnrichment(
  tx: Tx,
  episodeId: string,
  common: IngestCommonFields,
): Promise<void> {
  if (!hasEnrichment(common)) return
  await tx.episodeEnrichment.upsert({
    where: { episodeId },
    create: {
      episodeId,
      teaser: common.teaser,
      summaryLong: common.summaryLong,
      category: common.enrichCategory,
      tags: common.tags,
      seriousnessRating: common.seriousnessRating,
    },
    update: {
      teaser: common.teaser,
      summaryLong: common.summaryLong,
      category: common.enrichCategory,
      tags: common.tags,
      seriousnessRating: common.seriousnessRating,
      lastUpdated: new Date(),
    },
  })
}

async function fanOutArticleTimeline(
  tx: Tx,
  crawlKey: string,
  articleId: string,
): Promise<{ timelineInserted: number; subscriberCount: number }> {
  const subscribers = await tx.userFeed.findMany({
    where: { crawlKey, active: true },
    distinct: ['userId'],
    select: { userId: true },
  })
  let timelineInserted = 0
  if (subscribers.length > 0) {
    const res = await tx.userTimelineItem.createMany({
      data: subscribers.map((s) => ({
        userId: s.userId,
        contentKind: 'article' as const,
        articleId,
      })),
      skipDuplicates: true,
    })
    timelineInserted = res.count
  }
  return { timelineInserted, subscriberCount: subscribers.length }
}

async function fanOutEpisodeTimeline(
  tx: Tx,
  crawlKey: string,
  episodeId: string,
): Promise<{ timelineInserted: number; subscriberCount: number }> {
  const subscribers = await tx.userFeed.findMany({
    where: { crawlKey, active: true },
    distinct: ['userId'],
    select: { userId: true },
  })
  let timelineInserted = 0
  if (subscribers.length > 0) {
    const res = await tx.userTimelineItem.createMany({
      data: subscribers.map((s) => ({
        userId: s.userId,
        contentKind: 'episode' as const,
        episodeId,
      })),
      skipDuplicates: true,
    })
    timelineInserted = res.count
  }
  return { timelineInserted, subscriberCount: subscribers.length }
}

export async function ingestArticleItem(
  tx: Tx,
  crawlKey: string,
  common: IngestCommonFields,
): Promise<{ timelineInserted: number; subscriberCount: number }> {
  const categories = asJson(common.categories)
  await tx.article.upsert({
    where: { id: common.id },
    create: {
      id: common.id,
      crawlKey,
      link: common.link,
      title: common.title,
      author: common.author,
      publishedAt: common.publishedAt,
      updatedAt: common.updatedAt,
      contentHash: common.contentHash,
      contentMd: common.contentMd,
      sourceType: common.sourceType,
      tld: common.tld,
      categories: categories === undefined ? undefined : categories,
    },
    update: {
      crawlKey,
      link: common.link,
      title: common.title,
      author: common.author,
      publishedAt: common.publishedAt,
      updatedAt: common.updatedAt,
      contentHash: common.contentHash,
      contentMd: common.contentMd,
      sourceType: common.sourceType,
      tld: common.tld,
      ...(categories !== undefined ? { categories } : {}),
      fetchedAt: new Date(),
    },
  })
  await upsertEnrichment(tx, common.id, common)
  return fanOutArticleTimeline(tx, crawlKey, common.id)
}

export async function ingestEpisodeItem(
  tx: Tx,
  crawlKey: string,
  common: IngestCommonFields,
  episode: IngestEpisodeFields,
): Promise<{ timelineInserted: number; subscriberCount: number }> {
  const categories = asJson(common.categories)
  const chapters = asJson(episode.chapters)
  await tx.episode.upsert({
    where: { id: common.id },
    create: {
      id: common.id,
      crawlKey,
      link: common.link,
      title: common.title,
      author: common.author,
      publishedAt: common.publishedAt,
      updatedAt: common.updatedAt,
      contentHash: common.contentHash,
      contentMd: common.contentMd,
      sourceType: common.sourceType,
      tld: common.tld,
      categories: categories === undefined ? undefined : categories,
      summary: common.summary,
      shownotesMd: episode.shownotesMd,
      transcriptMd: episode.transcriptMd,
      mediaUrl: episode.mediaUrl,
      mediaType: episode.mediaType,
      mediaLengthBytes: episode.mediaLengthBytes,
      durationSeconds: episode.durationSeconds,
      episodeNumber: episode.episodeNumber,
      seasonNumber: episode.seasonNumber,
      episodeType: episode.episodeType,
      explicit: episode.explicit,
      subtitle: episode.subtitle,
      imageUrl: episode.imageUrl,
      chaptersUrl: episode.chaptersUrl,
      chaptersType: episode.chaptersType,
      chapters: chapters === undefined ? undefined : chapters,
      chaptersFetchError: episode.chaptersFetchError,
      transcriptUrl: episode.transcriptUrl,
      transcriptType: episode.transcriptType,
      transcriptFetchError: episode.transcriptFetchError,
    },
    update: {
      crawlKey,
      link: common.link,
      title: common.title,
      author: common.author,
      publishedAt: common.publishedAt,
      updatedAt: common.updatedAt,
      contentHash: common.contentHash,
      contentMd: common.contentMd,
      sourceType: common.sourceType,
      tld: common.tld,
      ...(categories !== undefined ? { categories } : {}),
      summary: common.summary,
      shownotesMd: episode.shownotesMd,
      transcriptMd: episode.transcriptMd,
      mediaUrl: episode.mediaUrl,
      mediaType: episode.mediaType,
      mediaLengthBytes: episode.mediaLengthBytes,
      durationSeconds: episode.durationSeconds,
      episodeNumber: episode.episodeNumber,
      seasonNumber: episode.seasonNumber,
      episodeType: episode.episodeType,
      explicit: episode.explicit,
      subtitle: episode.subtitle,
      imageUrl: episode.imageUrl,
      chaptersUrl: episode.chaptersUrl,
      chaptersType: episode.chaptersType,
      ...(chapters !== undefined ? { chapters } : {}),
      chaptersFetchError: episode.chaptersFetchError,
      transcriptUrl: episode.transcriptUrl,
      transcriptType: episode.transcriptType,
      transcriptFetchError: episode.transcriptFetchError,
      fetchedAt: new Date(),
    },
  })
  await upsertEpisodeEnrichment(tx, common.id, common)
  return fanOutEpisodeTimeline(tx, crawlKey, common.id)
}

export type IngestBodyResult = {
  contentId: string
  itemKind: 'article' | 'episode'
  timelineInserted: number
  subscriberCount: number
}

export function parseIngestBody(body: Record<string, unknown>): {
  crawlKey: string
  itemKind: 'article' | 'episode'
  common: IngestCommonFields
  episode?: IngestEpisodeFields
} {
  const src = resolveIngestSource(body)
  const crawlKey =
    (typeof body.crawlKey === 'string' && body.crawlKey.trim()) ||
    (typeof src.crawlKey === 'string' && src.crawlKey.trim()) ||
    ''
  if (!crawlKey) {
    throw new Error('Missing crawlKey')
  }

  const itemKind = parseIngestItemKind(src.item_kind) ?? 'article'
  if (itemKind === 'section') {
    throw new Error('item_kind section is not supported yet')
  }

  const common = parseIngestCommon(src)
  if (!common) {
    throw new Error('Missing required fields: id, title, link')
  }

  return {
    crawlKey: crawlKey.trim(),
    itemKind,
    common,
    ...(itemKind === 'episode' ? { episode: parseIngestEpisodeExtras(src) } : {}),
  }
}

export async function ingestFromBody(
  tx: Tx,
  body: Record<string, unknown>,
): Promise<IngestBodyResult> {
  const parsed = parseIngestBody(body)
  if (parsed.itemKind === 'episode') {
    const result = await ingestEpisodeItem(tx, parsed.crawlKey, parsed.common, parsed.episode!)
    return { contentId: parsed.common.id, itemKind: 'episode', ...result }
  }
  const result = await ingestArticleItem(tx, parsed.crawlKey, parsed.common)
  return { contentId: parsed.common.id, itemKind: 'article', ...result }
}

export function crawlKeyFromIngestBody(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const obj = body as Record<string, unknown>
  const src = resolveIngestSource(obj)
  const raw =
    (typeof obj.crawlKey === 'string' && obj.crawlKey.trim()) ||
    (typeof src.crawlKey === 'string' && src.crawlKey.trim()) ||
    ''
  if (!raw) return null
  try {
    return normalizeFeedUrl(raw)
  } catch {
    return raw.trim()
  }
}

export async function persistCrawlerIngestFailure(
  db: Pick<PrismaClient, 'sourceStatus'>,
  body: unknown,
  message: string,
): Promise<void> {
  const crawlKey = crawlKeyFromIngestBody(body)
  if (!crawlKey) return
  const reason = `Crawler ingest failed: ${message}`
  await db.sourceStatus.upsert({
    where: { crawlKey },
    create: {
      crawlKey,
      sourceHealthStatus: 'failing',
      sourceHealthReason: reason,
      operatorAttention: true,
      operatorAttentionReason: reason,
      lastCrawlStatus: 'failed',
      lastCrawlFinishedAt: new Date(),
      lastCrawlError: message,
    },
    update: {
      sourceHealthStatus: 'failing',
      sourceHealthReason: reason,
      operatorAttention: true,
      operatorAttentionReason: reason,
      lastCrawlStatus: 'failed',
      lastCrawlFinishedAt: new Date(),
      lastCrawlError: message,
    },
  })
}
