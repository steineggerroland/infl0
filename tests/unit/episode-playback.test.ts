import { describe, expect, it } from 'vitest'
import {
  chapterJumpHref,
  formatChapterTimestamp,
  isLikelyPlayableAudioUrl,
} from '../../utils/episode-playback'

describe('episode-playback', () => {
  it('detects playable audio from media type', () => {
    expect(isLikelyPlayableAudioUrl('https://cdn.example.com/a.bin', 'audio/mpeg')).toBe(true)
  })

  it('detects playable audio from .mp3 extension without media type', () => {
    expect(isLikelyPlayableAudioUrl('https://cdn.example.com/ep.mp3')).toBe(true)
    expect(isLikelyPlayableAudioUrl('https://cdn.example.com/page')).toBe(false)
  })

  it('formats chapter timestamps', () => {
    expect(formatChapterTimestamp(65)).toBe('1:05')
    expect(formatChapterTimestamp(3723)).toBe('1:02:03')
  })

  it('builds chapter jump href preferring chapter url', () => {
    expect(
      chapterJumpHref(
        { start_seconds: 10, url: 'https://example.com/ep#t=10' },
        'https://example.com/ep',
        'https://cdn.example.com/a.mp3',
      ),
    ).toBe('https://example.com/ep#t=10')
  })
})
