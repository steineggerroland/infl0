import { describe, expect, it } from 'vitest'
import {
  parseIngestCommon,
  parseIngestEpisodeExtras,
  parseIngestExplicit,
  parseIngestItemKind,
} from '../../utils/ingest-item'
import { tkcArticleExample, tkcEpisodeExample } from '../fixtures/tkc-ingest'

describe('ingest-item parsers', () => {
  it('parses item_kind episode', () => {
    expect(parseIngestItemKind('episode')).toBe('episode')
    expect(parseIngestItemKind('section')).toBe('section')
  })

  it('parses updatedAt from the TKC article example', () => {
    const example = tkcArticleExample()
    const common = parseIngestCommon(example)
    expect(common?.updatedAt).toEqual(new Date(String(example.updatedAt)))
  })

  it('parses common fields from the TKC episode example', () => {
    const example = tkcEpisodeExample()
    const common = parseIngestCommon(example)
    expect(common?.id).toBe('episode-01hxyz')
    expect(common?.summaryLong).toBe(example.summary_long)
    expect(common?.enrichCategory).toEqual(['expert opinions', 'debates and discussions'])
  })

  it('parses all episode extras from the TKC episode example', () => {
    const example = tkcEpisodeExample()
    const extras = parseIngestEpisodeExtras(example)
    expect(extras.mediaUrl).toBe('https://cdn.example.com/podcast/episode-42.mp3')
    expect(extras.durationSeconds).toBe(3723)
    expect(extras.chaptersUrl).toBe('https://example.com/podcast/episode-42.chapters.json')
    expect(extras.chaptersType).toBe('application/json+chapters')
    expect(extras.chapters).toEqual(example.chapters)
    expect(extras.chaptersFetchError).toBeNull()
    expect(extras.transcriptUrl).toBe('https://example.com/podcast/episode-42.transcript.txt')
    expect(extras.transcriptType).toBe('text/plain')
    expect(extras.transcriptMd).toContain('bounded contexts in practice')
    expect(extras.transcriptFetchError).toBeNull()
    expect(extras.explicit).toBe(false)
  })

  it('maps ingest explicit values to boolean', () => {
    expect(parseIngestExplicit('no')).toBe(false)
    expect(parseIngestExplicit('yes')).toBe(true)
    expect(parseIngestExplicit(true)).toBe(true)
    expect(parseIngestExplicit(false)).toBe(false)
    expect(parseIngestExplicit(null)).toBeUndefined()
    expect(parseIngestExplicit('maybe')).toBeUndefined()
  })
})
