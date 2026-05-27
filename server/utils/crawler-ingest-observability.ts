import { Prisma } from '~/generated/prisma/client'
import type { PrismaClient } from '~/generated/prisma/client'
import { crawlKeyFromIngestBody, parseIngestBody, type IngestBodyResult } from './crawler-ingest'

type Db = Pick<PrismaClient, 'crawlerIngestRequest'>

const MAX_STRING_LENGTH = 800
const MAX_ARRAY_ITEMS = 20
const MAX_OBJECT_KEYS = 60
const MAX_DEPTH = 4

function redactKey(key: string, value: unknown): unknown {
  return /authorization|crawler[-_]?key|api[-_]?key|token|secret|password/iu.test(key)
    ? '[redacted]'
    : value
}

function boundedPreview(value: unknown, depth = 0): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value == null) return Prisma.JsonNull
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (depth >= MAX_DEPTH) return '[truncated]'
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => boundedPreview(item, depth + 1)) as Prisma.InputJsonArray
  }
  if (typeof value === 'object') {
    const out: Record<string, Prisma.InputJsonValue | typeof Prisma.JsonNull> = {}
    for (const [key, raw] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
      out[key] = boundedPreview(redactKey(key, raw), depth + 1)
    }
    return out
  }
  return String(value)
}

function categorizeFailure(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('unauthorized')) return 'auth_failed'
  if (lower.includes('not configured')) return 'auth_not_configured'
  if (lower.includes('section') || lower.includes('not supported')) return 'unsupported_content'
  if (lower.includes('missing') || lower.includes('expected json')) return 'invalid_structure'
  return 'processing_failed'
}

function readParsedBody(body: Record<string, unknown>): {
  crawlKey: string | null
  itemKind: string | null
  contentId: string | null
} {
  try {
    const parsed = parseIngestBody(body)
    return {
      crawlKey: parsed.crawlKey,
      itemKind: parsed.itemKind,
      contentId: parsed.common.id,
    }
  } catch {
    return {
      crawlKey: crawlKeyFromIngestBody(body),
      itemKind: typeof body.item_kind === 'string' ? body.item_kind : null,
      contentId: typeof body.id === 'string' ? body.id : null,
    }
  }
}

export async function recordCrawlerIngestSuccess(
  db: Db,
  body: Record<string, unknown>,
  result: IngestBodyResult,
): Promise<void> {
  const parsed = readParsedBody(body)
  await db.crawlerIngestRequest.create({
    data: {
      status: 'success',
      httpStatus: 200,
      crawlKey: parsed.crawlKey,
      itemKind: result.itemKind,
      contentId: result.contentId,
      articlesAccepted: result.itemKind === 'article' ? 1 : 0,
      episodesAccepted: result.itemKind === 'episode' ? 1 : 0,
      timelineInserted: result.timelineInserted,
      subscribersAffected: result.subscriberCount,
      requestPreview: boundedPreview(body),
    },
  })
}

export async function recordCrawlerIngestRejection(
  db: Db,
  body: unknown,
  message: string,
  httpStatus: number,
): Promise<void> {
  const recordBody = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const parsed = readParsedBody(recordBody)
  await db.crawlerIngestRequest.create({
    data: {
      status: 'rejected',
      httpStatus,
      failureCategory: categorizeFailure(message),
      failureMessage: message,
      crawlKey: parsed.crawlKey,
      itemKind: parsed.itemKind,
      contentId: parsed.contentId,
      requestPreview: boundedPreview(body),
    },
  })
}
