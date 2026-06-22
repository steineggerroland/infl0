import { describe, expect, it } from 'vitest'
import { normalizeReadingNoteTags } from '../../utils/reading-note-tags'

describe('normalizeReadingNoteTags', () => {
  it('trims, lowercases, removes empty values, and deduplicates', () => {
    expect(normalizeReadingNoteTags([' AI ', 'Research', '', 'ai', ' research ']))
      .toEqual(['ai', 'research'])
  })

  it('ignores non-string input', () => {
    expect(normalizeReadingNoteTags(['valid', null, 42])).toEqual(['valid'])
    expect(normalizeReadingNoteTags(null)).toEqual([])
  })
})
