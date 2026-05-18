import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  crawlKeyFromIngestBody,
  ingestArticleItem,
  ingestEpisodeItem,
  parseIngestBody,
  persistCrawlerIngestFailure,
} from '../../server/utils/crawler-ingest'
import {
  tkcArticleExample,
  tkcEpisodeExample,
  tkcSectionExample,
} from '../fixtures/tkc-ingest'

const tx = {
  article: { upsert: vi.fn() },
  articleEnrichment: { upsert: vi.fn() },
  episode: { upsert: vi.fn() },
  episodeEnrichment: { upsert: vi.fn() },
  userFeed: { findMany: vi.fn() },
  userTimelineItem: { createMany: vi.fn() },
  sourceStatus: { upsert: vi.fn() },
}

beforeEach(() => {
  vi.clearAllMocks()
  tx.userFeed.findMany.mockResolvedValue([{ userId: 'u1' }])
  tx.userTimelineItem.createMany.mockResolvedValue({ count: 1 })
})

describe('parseIngestBody', () => {
  it('rejects section items until supported', () => {
    expect(() => parseIngestBody(tkcSectionExample())).toThrow(/section is not supported/)
  })

  it('routes the TKC article example as article', () => {
    const example = tkcArticleExample()
    const parsed = parseIngestBody(example)
    expect(parsed.itemKind).toBe('article')
    expect(parsed.common.id).toBe(example.id)
  })

  it('routes the TKC episode example by item_kind', () => {
    const example = tkcEpisodeExample()
    const parsed = parseIngestBody(example)
    expect(parsed.itemKind).toBe('episode')
    expect(parsed.episode?.mediaUrl).toBe(example.media_url)
    expect(parsed.episode?.chaptersUrl).toBe(example.chapters_url)
    expect(parsed.episode?.chaptersType).toBe(example.chapters_type)
    expect(parsed.episode?.chaptersFetchError).toBeNull()
    expect(parsed.episode?.transcriptFetchError).toBeNull()
    expect(parsed.episode?.explicit).toBe(false)
  })

  it('keeps the intentional fallback to article for unknown item_kind', () => {
    const example = tkcArticleExample()
    const parsed = parseIngestBody({
      ...example,
      item_kind: 'future-kind',
    })
    expect(parsed.itemKind).toBe('article')
  })
})

describe('ingestArticleItem', () => {
  it('stores all currently known TKC article fields', async () => {
    const example = tkcArticleExample()
    const parsed = parseIngestBody(example)
    await ingestArticleItem(tx as never, parsed.crawlKey, parsed.common)

    expect(tx.article.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: example.id },
        create: expect.objectContaining({
          id: example.id,
          crawlKey: example.crawlKey,
          link: example.link,
          title: example.title,
          author: example.author,
          publishedAt: new Date(String(example.publishedAt)),
          updatedAt: new Date(String(example.updatedAt)),
          contentHash: example.content_hash,
          contentMd: example.content_md,
          sourceType: example.source_type,
          tld: example.tld,
        }),
        update: expect.objectContaining({
          updatedAt: new Date(String(example.updatedAt)),
        }),
      }),
    )
    expect(tx.articleEnrichment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { articleId: example.id },
        create: expect.objectContaining({
          teaser: example.teaser,
          summaryLong: example.summary_long,
          category: example.category,
          tags: example.tags,
          seriousnessRating: example.seriousness_rating,
        }),
      }),
    )
    expect(tx.userTimelineItem.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ userId: 'u1', contentKind: 'article', articleId: example.id }],
        skipDuplicates: true,
      }),
    )
  })
})

describe('ingestEpisodeItem', () => {
  it('stores all currently known TKC episode fields', async () => {
    const example = tkcEpisodeExample()
    const parsed = parseIngestBody(example)
    await ingestEpisodeItem(tx as never, parsed.crawlKey, parsed.common, parsed.episode!)

    expect(tx.episode.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: example.id },
        create: expect.objectContaining({
          id: example.id,
          mediaUrl: example.media_url,
          mediaType: example.media_type,
          mediaLengthBytes: example.media_length_bytes,
          durationSeconds: example.duration_seconds,
          episodeNumber: example.episode_number,
          seasonNumber: example.season_number,
          episodeType: example.episode_type,
          explicit: false,
          subtitle: example.subtitle,
          imageUrl: example.image_url,
          shownotesMd: example.shownotes_md,
          chaptersUrl: example.chapters_url,
          chaptersType: example.chapters_type,
          chapters: example.chapters,
          chaptersFetchError: null,
          transcriptUrl: example.transcript_url,
          transcriptType: example.transcript_type,
          transcriptMd: example.transcript_md,
          transcriptFetchError: null,
        }),
        update: expect.objectContaining({
          chaptersFetchError: null,
          transcriptFetchError: null,
        }),
      }),
    )
    expect(tx.userTimelineItem.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ userId: 'u1', contentKind: 'episode', episodeId: example.id }],
        skipDuplicates: true,
      }),
    )
  })
})

describe('persistCrawlerIngestFailure', () => {
  it('extracts and normalizes crawlKey from an ingest body', () => {
    expect(crawlKeyFromIngestBody({ ...tkcEpisodeExample(), crawlKey: 'HTTPS://Example.com/feed/' })).toBe(
      'https://example.com/feed',
    )
  })

  it('persists ingest failures for the operator view when crawlKey is available', async () => {
    const example = tkcEpisodeExample()
    await persistCrawlerIngestFailure(tx as never, example, 'item_kind section is not supported yet')

    expect(tx.sourceStatus.upsert).toHaveBeenCalledWith({
      where: { crawlKey: example.crawlKey },
      create: expect.objectContaining({
        crawlKey: example.crawlKey,
        sourceHealthStatus: 'failing',
        operatorAttention: true,
        lastCrawlStatus: 'failed',
        lastCrawlError: 'item_kind section is not supported yet',
      }),
      update: expect.objectContaining({
        sourceHealthStatus: 'failing',
        operatorAttention: true,
        lastCrawlStatus: 'failed',
        lastCrawlError: 'item_kind section is not supported yet',
      }),
    })
  })
})
