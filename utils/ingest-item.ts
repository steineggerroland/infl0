/**
 * Shared ingest payload shapes (TopicKnowledgeCrawler → infl0).
 * Flat JSON per item; see TKC `docs/schemas/ingest-item.schema.json`.
 */

export type IngestItemKind = 'article' | 'episode' | 'section'

export type IngestChapter = {
  start_seconds: number
  title: string
  url?: string
  image_url?: string
}

export type IngestCommonFields = {
  id: string
  title: string
  link: string
  crawlKey?: string
  author?: string
  publishedAt?: Date | null
  updatedAt?: Date | null
  contentMd?: string
  contentHash?: string
  sourceType?: string
  tld?: string
  categories?: unknown
  summary?: string
  teaser?: string
  summaryLong?: string
  enrichCategory: string[]
  tags: string[]
  seriousnessRating?: string
}

export type IngestEpisodeFields = {
  mediaUrl?: string
  mediaType?: string
  mediaLengthBytes?: number | null
  durationSeconds?: number | null
  episodeNumber?: number | null
  seasonNumber?: number | null
  episodeType?: string
  explicit?: boolean
  subtitle?: string
  imageUrl?: string
  chaptersUrl?: string
  chaptersType?: string
  shownotesMd?: string
  chapters?: IngestChapter[]
  chaptersFetchError?: string | null
  transcriptUrl?: string
  transcriptType?: string
  transcriptMd?: string
  transcriptFetchError?: string | null
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

function nullableStr(obj: Record<string, unknown>, snake: string, camel: string): string | null | undefined {
  if (Object.prototype.hasOwnProperty.call(obj, snake)) {
    if (obj[snake] === null) return null
    return str(obj[snake])
  }
  if (Object.prototype.hasOwnProperty.call(obj, camel)) {
    if (obj[camel] === null) return null
    return str(obj[camel])
  }
  return undefined
}

function parsePublishedAt(v: unknown): Date | null {
  if (v == null) return null
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

function asInt(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v)
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  return null
}

function parseChapters(v: unknown): IngestChapter[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out: IngestChapter[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const title = str(row.title)
    const start = asInt(row.start_seconds)
    if (!title || start == null || start < 0) continue
    out.push({
      start_seconds: start,
      title,
      ...(str(row.url) ? { url: str(row.url) } : {}),
      ...(str(row.image_url) ? { image_url: str(row.image_url) } : {}),
    })
  }
  return out.length > 0 ? out : undefined
}

/** Map TKC ingest `explicit` (string, boolean, or null) to an internal boolean. */
export function parseIngestExplicit(v: unknown): boolean | undefined {
  if (v === null || v === undefined) return undefined
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') {
    if (v === 1) return true
    if (v === 0) return false
    return undefined
  }
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'yes' || s === 'true' || s === '1') return true
    if (s === 'no' || s === 'false' || s === '0') return false
  }
  return undefined
}

export function parseIngestItemKind(v: unknown): IngestItemKind | undefined {
  const k = str(v)
  if (k === 'article' || k === 'episode' || k === 'section') return k
  return undefined
}

/** Resolve nested `{ article: { ... } }` or flat body. */
export function resolveIngestSource(body: Record<string, unknown>): Record<string, unknown> {
  const nested = body.article
  if (nested !== null && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>
  }
  return body
}

export function parseIngestCommon(src: Record<string, unknown>): IngestCommonFields | null {
  const id = str(src.id)
  const title = str(src.title)
  const link = str(src.link)
  if (!id || !title || !link) return null

  return {
    id,
    title,
    link,
    crawlKey: str(src.crawlKey),
    author: str(src.author),
    publishedAt: parsePublishedAt(src.publishedAt),
    updatedAt: parsePublishedAt(src.updatedAt),
    contentMd: str(src.content_md) ?? str(src.contentMd),
    contentHash: str(src.content_hash) ?? str(src.contentHash) ?? str(src.hash),
    sourceType: str(src.source_type) ?? str(src.sourceType),
    tld: str(src.tld),
    categories: src.categories,
    summary: str(src.summary),
    teaser: str(src.teaser),
    summaryLong: str(src.summary_long) ?? str(src.summaryLong),
    enrichCategory: asStringArray(src.category),
    tags: asStringArray(src.tags),
    seriousnessRating: str(src.seriousness_rating) ?? str(src.seriousnessRating),
  }
}

export function parseIngestEpisodeExtras(src: Record<string, unknown>): IngestEpisodeFields {
  return {
    mediaUrl: str(src.media_url) ?? str(src.mediaUrl),
    mediaType: str(src.media_type) ?? str(src.mediaType),
    mediaLengthBytes: asInt(src.media_length_bytes),
    durationSeconds: asInt(src.duration_seconds),
    episodeNumber: asInt(src.episode_number),
    seasonNumber: asInt(src.season_number),
    episodeType: str(src.episode_type) ?? str(src.episodeType),
    explicit: parseIngestExplicit(src.explicit),
    subtitle: str(src.subtitle),
    imageUrl: str(src.image_url) ?? str(src.imageUrl),
    chaptersUrl: str(src.chapters_url) ?? str(src.chaptersUrl),
    chaptersType: str(src.chapters_type) ?? str(src.chaptersType),
    shownotesMd: str(src.shownotes_md) ?? str(src.shownotesMd),
    chapters: parseChapters(src.chapters),
    chaptersFetchError: nullableStr(src, 'chapters_fetch_error', 'chaptersFetchError'),
    transcriptUrl: str(src.transcript_url) ?? str(src.transcriptUrl),
    transcriptType: str(src.transcript_type) ?? str(src.transcriptType),
    transcriptMd: str(src.transcript_md) ?? str(src.transcriptMd),
    transcriptFetchError: nullableStr(src, 'transcript_fetch_error', 'transcriptFetchError'),
  }
}
