import type { Prisma, PrismaClient } from '~/generated/prisma/client'
import { isArticleEngagementSegment } from '../../../utils/article-engagement'
import { pointsForEngagementEvent } from './engagement-points'

const EVENT_BATCH_SIZE = 1000
const INSERT_CHUNK_SIZE = 1000

type Counter = { posPoints: number; negPoints: number }

function normalizeKeys(values: string[] | null | undefined): string[] {
  if (!values || values.length === 0) return []
  const out = new Set<string>()
  for (const raw of values) {
    const v = raw.trim().toLowerCase()
    if (v) out.add(v)
  }
  return [...out]
}

function addCounter(map: Map<string, Counter>, key: string, pos: number, neg: number) {
  const prev = map.get(key)
  if (prev) {
    prev.posPoints += pos
    prev.negPoints += neg
    return
  }
  map.set(key, { posPoints: pos, negPoints: neg })
}

function key(userId: string, value: string): string {
  return `${userId}::${value}`
}

async function createManyInChunks<T>(
  rows: T[],
  fn: (chunk: T[]) => Prisma.PrismaPromise<{ count: number }>,
) {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + INSERT_CHUNK_SIZE)
    await fn(chunk)
  }
}

export async function rebuildEngagementAggregates(db: PrismaClient): Promise<{
  events: number
  feedRows: number
  categoryRows: number
  tagRows: number
}> {
  const feedAgg = new Map<string, Counter>()
  const categoryAgg = new Map<string, Counter>()
  const tagAgg = new Map<string, Counter>()
  let events = 0

  let cursorId: string | null = null
  for (;;) {
    const batch: Array<{
      id: string
      userId: string
      articleId: string
      segment: string
      durationSec: number
    }> = await db.articleEngagementEvent.findMany({
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      take: EVENT_BATCH_SIZE,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        userId: true,
        articleId: true,
        segment: true,
        durationSec: true,
      },
    })
    if (batch.length === 0) break
    const lastEvent = batch[batch.length - 1]
    if (!lastEvent) break
    cursorId = lastEvent.id
    events += batch.length

    const articleIds = [...new Set(batch.map((e) => e.articleId))] as string[]
    const articles: Array<{
      id: string
      crawlKey: string
      enrichment: { category: string[]; tags: string[] } | null
    }> = await db.article.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        crawlKey: true,
        enrichment: { select: { category: true, tags: true } },
      },
    })
    const articleMap = new Map(articles.map((a) => [a.id, a] as const))

    for (const e of batch) {
      const article = articleMap.get(e.articleId)
      if (!article) continue
      if (!isArticleEngagementSegment(e.segment)) continue
      const delta = pointsForEngagementEvent(e.segment, e.durationSec)
      if (delta.positive <= 0 && delta.negative <= 0) continue

      addCounter(feedAgg, key(e.userId, article.crawlKey), delta.positive, delta.negative)
      for (const c of normalizeKeys(article.enrichment?.category)) {
        addCounter(categoryAgg, key(e.userId, c), delta.positive, delta.negative)
      }
      for (const t of normalizeKeys(article.enrichment?.tags)) {
        addCounter(tagAgg, key(e.userId, t), delta.positive, delta.negative)
      }
    }
  }

  const splitAggKey = (k: string): [string, string] => {
    const sep = k.indexOf('::')
    if (sep === -1) throw new Error(`invalid aggregate key: ${k}`)
    return [k.slice(0, sep), k.slice(sep + 2)]
  }

  const feedRows: Prisma.UserFeedEngagementCreateManyInput[] = []
  for (const [k, v] of feedAgg.entries()) {
    const [userId, crawlKey] = splitAggKey(k)
    feedRows.push({ userId, crawlKey, posPoints: v.posPoints, negPoints: v.negPoints })
  }
  const categoryRows: Prisma.UserCategoryEngagementCreateManyInput[] = []
  for (const [k, v] of categoryAgg.entries()) {
    const [userId, category] = splitAggKey(k)
    categoryRows.push({ userId, category, posPoints: v.posPoints, negPoints: v.negPoints })
  }
  const tagRows: Prisma.UserTagEngagementCreateManyInput[] = []
  for (const [k, v] of tagAgg.entries()) {
    const [userId, tag] = splitAggKey(k)
    tagRows.push({ userId, tag, posPoints: v.posPoints, negPoints: v.negPoints })
  }

  await db.$transaction([
    db.userFeedEngagement.deleteMany({}),
    db.userCategoryEngagement.deleteMany({}),
    db.userTagEngagement.deleteMany({}),
  ])

  await createManyInChunks(feedRows, (chunk) => db.userFeedEngagement.createMany({ data: chunk }))
  await createManyInChunks(categoryRows, (chunk) =>
    db.userCategoryEngagement.createMany({ data: chunk }),
  )
  await createManyInChunks(tagRows, (chunk) => db.userTagEngagement.createMany({ data: chunk }))

  return {
    events,
    feedRows: feedRows.length,
    categoryRows: categoryRows.length,
    tagRows: tagRows.length,
  }
}

