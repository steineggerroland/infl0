import { describe, expect, it } from 'vitest'
import {
  MAX_FONT_SIZE_PX,
  MIN_FONT_SIZE_PX,
  UI_PREFS_VERSION,
  applyUiPrefsPatch,
  clampFontSizePx,
  defaultUiPrefs,
  isHexColor,
  parseUiPrefsFromJson,
  resolveUiPrefs,
  toStoredUiPrefs,
} from '../../utils/ui-prefs'

describe('ui-prefs data layer', () => {
  describe('defaults', () => {
    it('ships a stable shape for card-front, card-back and reader', () => {
      const d = defaultUiPrefs()
      expect(d.version).toBe(UI_PREFS_VERSION)
      expect(d.theme).toBe('calm-light')
      expect(d.motion).toBe('system')
      expect(Object.keys(d.surfaces).sort()).toEqual(['card-back', 'card-front', 'reader'])
      expect(d.seenFeatureAnnouncements).toEqual([])
    })

    it('gives the reader surface a longer-read default (serif, larger, relaxed)', () => {
      const d = defaultUiPrefs()
      expect(d.surfaces.reader.fontFamily).toBe('system-serif')
      expect(d.surfaces.reader.fontSize).toBeGreaterThan(d.surfaces['card-front'].fontSize)
      expect(d.surfaces.reader.lineHeight).toBe('relaxed')
    })

    it('defaults card and reader sizes to sensible pixel values', () => {
      const d = defaultUiPrefs()
      expect(d.surfaces['card-front'].fontSize).toBe(16)
      expect(d.surfaces['card-back'].fontSize).toBe(16)
      expect(d.surfaces.reader.fontSize).toBe(18)
    })
  })

  describe('parseUiPrefsFromJson', () => {
    it('returns null for non-objects and arrays', () => {
      expect(parseUiPrefsFromJson(null)).toBeNull()
      expect(parseUiPrefsFromJson('x')).toBeNull()
      expect(parseUiPrefsFromJson([])).toBeNull()
      expect(parseUiPrefsFromJson(42)).toBeNull()
    })

    it('returns null when version is missing or not a number', () => {
      expect(parseUiPrefsFromJson({})).toBeNull()
      expect(parseUiPrefsFromJson({ v: '1' })).toBeNull()
      expect(parseUiPrefsFromJson({ v: 0 })).toBeNull()
    })

    it('keeps known fields and drops unknown ones', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'warm-dark',
        motion: 'reduced',
        unknownTopLevel: 'ignored',
        surfaces: {
          'card-front': {
            backgroundColor: '#112233',
            textColor: '#eeeeee',
            fontFamily: 'system-sans',
            fontSize: 20,
            lineHeight: 'tight',
            rogue: 'dropped',
          },
          'unknown-surface': { backgroundColor: '#000000' },
        },
        seenFeatureAnnouncements: ['reader-colors', '   ', 42, 'reader-colors', 'new-surface'],
      })
      expect(parsed).not.toBeNull()
      expect(parsed?.theme).toBe('warm-dark')
      expect(parsed?.motion).toBe('reduced')
      expect(parsed?.surfaces['card-front'].backgroundColor).toBe('#112233')
      expect(parsed?.surfaces['card-front'].fontSize).toBe(20)
      expect(parsed?.seenFeatureAnnouncements).toEqual(['reader-colors', 'new-surface'])
    })

    it('falls back to defaults for invalid enum values and malformed colors', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'not-a-preset',
        motion: 'turbo',
        surfaces: {
          reader: {
            backgroundColor: 'red',
            textColor: '#xyzxyz',
            fontFamily: 'comic-sans',
            fontSize: 'huge',
            lineHeight: 'loose',
          },
        },
      })
      const d = defaultUiPrefs()
      expect(parsed?.theme).toBe(d.theme)
      expect(parsed?.motion).toBe(d.motion)
      expect(parsed?.surfaces.reader).toEqual(d.surfaces.reader)
    })
  })

  describe('resolveUiPrefs', () => {
    it('returns defaults for unset / invalid storage', () => {
      expect(resolveUiPrefs(null)).toEqual(defaultUiPrefs())
      expect(resolveUiPrefs(undefined)).toEqual(defaultUiPrefs())
      expect(resolveUiPrefs('garbage')).toEqual(defaultUiPrefs())
    })

    it('round-trips through toStoredUiPrefs', () => {
      const original = defaultUiPrefs()
      original.surfaces['card-front'].backgroundColor = '#123456'
      original.motion = 'reduced'
      const stored = toStoredUiPrefs(original)
      const roundTripped = resolveUiPrefs(stored)
      expect(roundTripped).toEqual(original)
    })
  })

  describe('applyUiPrefsPatch', () => {
    it('merges partial top-level and surface fields', () => {
      const base = defaultUiPrefs()
      const next = applyUiPrefsPatch(base, {
        motion: 'reduced',
        surfaces: {
          'card-front': { backgroundColor: '#abcdef', fontSize: 22 },
          reader: { lineHeight: 'tight' },
        },
      })
      expect(next.motion).toBe('reduced')
      expect(next.surfaces['card-front'].backgroundColor).toBe('#abcdef')
      expect(next.surfaces['card-front'].fontSize).toBe(22)
      expect(next.surfaces['card-front'].textColor).toBe(base.surfaces['card-front'].textColor)
      expect(next.surfaces.reader.lineHeight).toBe('tight')
    })

    it('does not mutate the base object', () => {
      const base = defaultUiPrefs()
      const snapshot = JSON.parse(JSON.stringify(base))
      applyUiPrefsPatch(base, { surfaces: { 'card-front': { backgroundColor: '#111111' } } })
      expect(base).toEqual(snapshot)
    })

    it('ignores unknown surfaces and invalid values (forward-compat)', () => {
      const base = defaultUiPrefs()
      // Cast through unknown: a newer release that invents a surface id or
      // enum value must not crash the merge. The test intentionally sends
      // shapes the current type system rejects.
      const next = applyUiPrefsPatch(
        base,
        {
          motion: 'turbo',
          surfaces: {
            'ghost-surface': { backgroundColor: '#000000' },
            'card-back': { backgroundColor: 'not-a-color', fontSize: 'huge' },
            reader: { fontSize: Number.NaN },
          },
        } as unknown as Parameters<typeof applyUiPrefsPatch>[1],
      )
      expect(next.motion).toBe(base.motion)
      expect(next.surfaces['card-back']).toEqual(base.surfaces['card-back'])
      expect(next.surfaces.reader.fontSize).toBe(base.surfaces.reader.fontSize)
      expect('ghost-surface' in next.surfaces).toBe(false)
    })

    it('accepts explicit null to clear a surface color back to "inherit"', () => {
      const base = applyUiPrefsPatch(defaultUiPrefs(), {
        surfaces: { 'card-front': { backgroundColor: '#112233' } },
      })
      expect(base.surfaces['card-front'].backgroundColor).toBe('#112233')
      const cleared = applyUiPrefsPatch(base, {
        surfaces: { 'card-front': { backgroundColor: null } },
      })
      expect(cleared.surfaces['card-front'].backgroundColor).toBeNull()
    })

    it('de-duplicates announcement ids and trims/rejects bad ones', () => {
      const base = defaultUiPrefs()
      const next = applyUiPrefsPatch(base, {
        seenFeatureAnnouncements: ['a', 'a', '', '   ', 'b', 'c', 42 as never, 'c'],
      })
      expect(next.seenFeatureAnnouncements).toEqual(['a', 'b', 'c'])
    })
  })

  describe('clampFontSizePx', () => {
    it('rounds fractional pixels to the nearest integer', () => {
      expect(clampFontSizePx(16.4)).toBe(16)
      expect(clampFontSizePx(16.6)).toBe(17)
    })

    it('clamps values outside the safe range', () => {
      expect(clampFontSizePx(0)).toBe(MIN_FONT_SIZE_PX)
      expect(clampFontSizePx(-10)).toBe(MIN_FONT_SIZE_PX)
      expect(clampFontSizePx(999)).toBe(MAX_FONT_SIZE_PX)
    })

    it('returns null for non-numeric / non-finite input so callers can fall back', () => {
      expect(clampFontSizePx('18' as unknown)).toBeNull()
      expect(clampFontSizePx('lg' as unknown)).toBeNull()
      expect(clampFontSizePx(Number.NaN)).toBeNull()
      expect(clampFontSizePx(Number.POSITIVE_INFINITY)).toBeNull()
      expect(clampFontSizePx(undefined)).toBeNull()
    })
  })

  describe('isHexColor', () => {
    it('accepts #rgb and #rrggbb in any case', () => {
      expect(isHexColor('#fff')).toBe(true)
      expect(isHexColor('#FFFFFF')).toBe(true)
      expect(isHexColor('#0a1B2c')).toBe(true)
    })

    it('rejects non-hex strings, wrong lengths and non-strings', () => {
      expect(isHexColor('fff')).toBe(false)
      expect(isHexColor('#fffg')).toBe(false)
      expect(isHexColor('#fffff')).toBe(false)
      expect(isHexColor('#fffffff')).toBe(false)
      expect(isHexColor(null as unknown)).toBe(false)
      expect(isHexColor(123 as unknown)).toBe(false)
    })
  })
})
