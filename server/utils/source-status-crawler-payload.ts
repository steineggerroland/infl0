import { Prisma } from '~/generated/prisma/client'
import { normalizeFeedUrl } from './feed-url'

export class SourceStatusPayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SourceStatusPayloadError'
  }
}

function asRecord(body: unknown): Record<string, unknown> {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    throw new SourceStatusPayloadError('Expected JSON object body')
  }
  return body as Record<string, unknown>
}

/** Whether camel or snake key appears on the object (distinguishes absent vs explicit null). */
function pickRaw(
  obj: Record<string, unknown>,
  camel: string,
  snake: string,
): { present: boolean; value: unknown } {
  if (Object.prototype.hasOwnProperty.call(obj, camel)) {
    return { present: true, value: obj[camel] }
  }
  if (Object.prototype.hasOwnProperty.call(obj, snake)) {
    return { present: true, value: obj[snake] }
  }
  return { present: false, value: undefined }
}

function parseStrField(
  obj: Record<string, unknown>,
  camel: string,
  snake: string,
): string | null | undefined {
  const { present, value: v } = pickRaw(obj, camel, snake)
  if (!present) return undefined
  if (v === null) return null
  if (typeof v !== 'string') throw new SourceStatusPayloadError(`${camel} must be a string`)
  const t = v.trim()
  return t === '' ? null : t
}

function parseIntField(
  obj: Record<string, unknown>,
  camel: string,
  snake: string,
): number | null | undefined {
  const { present, value: v } = pickRaw(obj, camel, snake)
  if (!present) return undefined
  if (v === null) return null
  if (typeof v === 'number' && Number.isInteger(v)) return v
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v)
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number.parseInt(v, 10)
    if (Number.isFinite(n)) return n
  }
  throw new SourceStatusPayloadError(`${camel} must be an integer`)
}

function parseDateField(
  obj: Record<string, unknown>,
  camel: string,
  snake: string,
): Date | null | undefined {
  const { present, value: v } = pickRaw(obj, camel, snake)
  if (!present) return undefined
  if (v === null) return null
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const d = new Date(v)
    if (!Number.isNaN(d.getTime())) return d
  }
  throw new SourceStatusPayloadError(`${camel} must be a valid ISO date-time`)
}

function parseBoolField(
  obj: Record<string, unknown>,
  camel: string,
  snake: string,
): boolean | undefined {
  const { present, value: v } = pickRaw(obj, camel, snake)
  if (!present) return undefined
  if (typeof v !== 'boolean') throw new SourceStatusPayloadError(`${camel} must be a boolean`)
  return v
}

function parseJsonField(
  obj: Record<string, unknown>,
  camel: string,
  snake: string,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  const { present, value: v } = pickRaw(obj, camel, snake)
  if (!present) return undefined
  if (v === null) return Prisma.JsonNull
  if (typeof v === 'object' && !Array.isArray(v)) return v as Prisma.InputJsonValue
  if (Array.isArray(v)) return v as Prisma.InputJsonValue
  throw new SourceStatusPayloadError(`${camel} must be a JSON object or array`)
}

export type ParsedSourceStatusUpsert = {
  crawlKey: string
  create: Prisma.SourceStatusCreateInput
  update: Prisma.SourceStatusUpdateInput
}

function assignScalar<K extends keyof Prisma.SourceStatusCreateInput & keyof Prisma.SourceStatusUpdateInput>(
  create: Prisma.SourceStatusCreateInput,
  update: Prisma.SourceStatusUpdateInput,
  key: K,
  value: Prisma.SourceStatusCreateInput[K] | undefined,
): void {
  if (value === undefined) return
  ;(create as Record<string, unknown>)[key as string] = value
  ;(update as Record<string, unknown>)[key as string] = value
}

/**
 * Parse crawler POST body (camelCase or snake_case keys). Normalizes `crawlKey`
 * the same way as feed URLs / ingest.
 *
 * **Merge semantics:** Only keys **present** on the JSON object are included in `update`
 * (and the same fields on `create`). Omitted keys are not written on update — existing
 * values stay. On first **create**, omitted nullable columns are left unset (null);
 * `operatorAttention` uses the DB default when omitted. Send explicit `null` on a nullable
 * scalar to clear it. JSON fields: omit both aliases to leave unchanged; include `null`
 * to clear stored JSON (`Prisma.JsonNull`).
 */
export function parseSourceStatusUpsertBody(body: unknown): ParsedSourceStatusUpsert {
  const obj = asRecord(body)
  const crawlRaw = pickRaw(obj, 'crawlKey', 'crawl_key')
  if (!crawlRaw.present || crawlRaw.value === undefined || crawlRaw.value === null) {
    throw new SourceStatusPayloadError('crawlKey is required')
  }
  if (typeof crawlRaw.value !== 'string' || crawlRaw.value.trim() === '') {
    throw new SourceStatusPayloadError('crawlKey must be a non-empty string')
  }
  let crawlKey: string
  try {
    crawlKey = normalizeFeedUrl(crawlRaw.value)
  } catch {
    throw new SourceStatusPayloadError('Invalid crawlKey URL')
  }

  const create: Prisma.SourceStatusCreateInput = { crawlKey }
  const update: Prisma.SourceStatusUpdateInput = {}

  const sourceHealthJson = parseJsonField(obj, 'sourceHealthJson', 'source_health_json')
  if (sourceHealthJson !== undefined) {
    create.sourceHealthJson = sourceHealthJson
    update.sourceHealthJson = sourceHealthJson
  }

  const detectedPolicy = parseJsonField(obj, 'detectedPolicy', 'detected_policy')
  if (detectedPolicy !== undefined) {
    create.detectedPolicy = detectedPolicy
    update.detectedPolicy = detectedPolicy
  }

  const effectivePolicy = parseJsonField(obj, 'effectivePolicy', 'effective_policy')
  if (effectivePolicy !== undefined) {
    create.effectivePolicy = effectivePolicy
    update.effectivePolicy = effectivePolicy
  }

  assignScalar(create, update, 'sourceStatus', parseStrField(obj, 'sourceStatus', 'source_status'))
  assignScalar(
    create,
    update,
    'sourceHealthStatus',
    parseStrField(obj, 'sourceHealthStatus', 'source_health_status'),
  )
  assignScalar(
    create,
    update,
    'sourceHealthReason',
    parseStrField(obj, 'sourceHealthReason', 'source_health_reason'),
  )
  assignScalar(
    create,
    update,
    'operatorAttention',
    parseBoolField(obj, 'operatorAttention', 'operator_attention'),
  )
  assignScalar(
    create,
    update,
    'operatorAttentionReason',
    parseStrField(obj, 'operatorAttentionReason', 'operator_attention_reason'),
  )
  assignScalar(
    create,
    update,
    'lastCrawlStatus',
    parseStrField(obj, 'lastCrawlStatus', 'last_crawl_status'),
  )
  assignScalar(
    create,
    update,
    'lastCrawlStartedAt',
    parseDateField(obj, 'lastCrawlStartedAt', 'last_crawl_started_at'),
  )
  assignScalar(
    create,
    update,
    'lastCrawlFinishedAt',
    parseDateField(obj, 'lastCrawlFinishedAt', 'last_crawl_finished_at'),
  )
  assignScalar(
    create,
    update,
    'nextAllowedCrawlAt',
    parseDateField(obj, 'nextAllowedCrawlAt', 'next_allowed_crawl_at'),
  )
  assignScalar(
    create,
    update,
    'lastSuccessfulCrawlAt',
    parseDateField(obj, 'lastSuccessfulCrawlAt', 'last_successful_crawl_at'),
  )
  assignScalar(create, update, 'lastCrawlError', parseStrField(obj, 'lastCrawlError', 'last_crawl_error'))
  assignScalar(
    create,
    update,
    'crawlCandidateCount',
    parseIntField(obj, 'crawlCandidateCount', 'crawl_candidate_count'),
  )
  assignScalar(
    create,
    update,
    'crawlSkippedCount',
    parseIntField(obj, 'crawlSkippedCount', 'crawl_skipped_count'),
  )
  assignScalar(
    create,
    update,
    'crawlProcessedCount',
    parseIntField(obj, 'crawlProcessedCount', 'crawl_processed_count'),
  )
  assignScalar(
    create,
    update,
    'crawlUnchangedCount',
    parseIntField(obj, 'crawlUnchangedCount', 'crawl_unchanged_count'),
  )
  assignScalar(
    create,
    update,
    'crawlFetchErrorCount',
    parseIntField(obj, 'crawlFetchErrorCount', 'crawl_fetch_error_count'),
  )
  assignScalar(
    create,
    update,
    'crawlLlmFailedCount',
    parseIntField(obj, 'crawlLlmFailedCount', 'crawl_llm_failed_count'),
  )
  assignScalar(
    create,
    update,
    'consecutiveErrorCount',
    parseIntField(obj, 'consecutiveErrorCount', 'consecutive_error_count'),
  )

  return { crawlKey, create, update }
}
