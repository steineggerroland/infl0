import { describe, expect, it } from 'vitest'
import {
  FONT_FAMILY_IDS,
  UI_PREFS_VERSION,
  applyUiPrefsPatch,
  clampFontSizePx,
  clampFontSizePxForSurface,
  cycleFontFamilyId,
  defaultUiPrefs,
  fontSizeBoundsForSurface,
  isHexColor,
  parseUiPrefsFromJson,
  resolveUiPrefs,
  toStoredUiPrefs,
  uiPrefsEffectiveCustomization,
} from '../../utils/ui-prefs'

describe('ui-prefs data layer', () => {
  describe('cycleFontFamilyId', () => {
    it('steps along FONT_FAMILY_IDS with wrap', () => {
      expect(cycleFontFamilyId('inter', 1)).toBe('source-sans-3')
      expect(cycleFontFamilyId('inter', -1)).toBe('system-mono')
      const first = FONT_FAMILY_IDS[0]!
      const last = FONT_FAMILY_IDS[FONT_FAMILY_IDS.length - 1]!
      expect(cycleFontFamilyId(first, -1)).toBe(last)
      expect(cycleFontFamilyId(last, 1)).toBe(first)
    })
  })

  describe('defaults', () => {
    it('ships a stable shape for card-front, card-back and reader', () => {
      const d = defaultUiPrefs()
      expect(d.version).toBe(UI_PREFS_VERSION)
      expect(d.theme).toBe('pastel:blue')
      expect(d.motion).toBe('system')
      expect(d.appearance).toBe('auto')
      expect(Object.keys(d.surfaces).sort()).toEqual(['card-back', 'card-front', 'reader'])
      expect(d.seenFeatureAnnouncements).toEqual([])
      expect(d.onboardingHidden).toBe(false)
    })

    it('gives the reader surface a longer-read default (serif, relaxed line height)', () => {
      const d = defaultUiPrefs()
      expect(d.surfaces['card-front'].fontFamily).toBe('inter')
      expect(d.surfaces['card-back'].fontFamily).toBe('source-sans-3')
      expect(d.surfaces.reader.fontFamily).toBe('source-serif-4')
      expect(d.surfaces.reader.lineHeight).toBe('relaxed')
    })

    it('defaults per-surface text sizes to product defaults (independent uppers)', () => {
      const d = defaultUiPrefs()
      expect(d.surfaces['card-front'].fontSize).toBe(45)
      expect(d.surfaces['card-back'].fontSize).toBe(22)
      expect(d.surfaces.reader.fontSize).toBe(20)
    })
  })

  describe('uiPrefsEffectiveCustomization', () => {
    it('is false for defaultUiPrefs', () => {
      expect(uiPrefsEffectiveCustomization(defaultUiPrefs())).toBe(false)
    })

    it('is true when a surface font size differs from defaults', () => {
      const p = defaultUiPrefs()
      p.surfaces['card-front'].fontSize = 38
      expect(uiPrefsEffectiveCustomization(p)).toBe(true)
    })

    it('is true when theme differs from defaults', () => {
      const p = defaultUiPrefs()
      p.theme = 'warm:yellow'
      expect(uiPrefsEffectiveCustomization(p)).toBe(true)
    })

    it('is true when onboarding has been hidden', () => {
      const p = defaultUiPrefs()
      p.onboardingHidden = true
      expect(uiPrefsEffectiveCustomization(p)).toBe(true)
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
        theme: 'warm:blue',
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
      expect(parsed?.theme).toBe('warm:blue')
      expect(parsed?.motion).toBe('reduced')
      expect(parsed?.appearance).toBe('light')
      expect(parsed?.surfaces['card-front'].backgroundColor).toBe('#112233')
      expect(parsed?.surfaces['card-front'].fontSize).toBe(27)
      expect(parsed?.surfaces['card-front'].fontFamily).toBe('inter')
      expect(parsed?.seenFeatureAnnouncements).toEqual(['reader-colors', 'new-surface'])
    })

    it('defaults appearance to light when the stored blob omits it (legacy)', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'pastel:green',
        motion: 'system',
        surfaces: defaultUiPrefs().surfaces,
        seenFeatureAnnouncements: [],
      })
      expect(parsed?.appearance).toBe('light')
    })

    it('keeps a valid appearance field when present', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'pastel:green',
        motion: 'system',
        appearance: 'dark',
        surfaces: defaultUiPrefs().surfaces,
        seenFeatureAnnouncements: [],
      })
      expect(parsed?.appearance).toBe('dark')
    })

    it('migrates legacy warm-dark to warm:blue and dark when appearance omitted', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'warm-dark',
        motion: 'system',
        surfaces: defaultUiPrefs().surfaces,
        seenFeatureAnnouncements: [],
      })
      expect(parsed?.theme).toBe('warm:blue')
      expect(parsed?.appearance).toBe('dark')
    })

    it('migrates legacy calm-light to pastel:blue', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'calm-light',
        motion: 'system',
        surfaces: defaultUiPrefs().surfaces,
        seenFeatureAnnouncements: [],
      })
      expect(parsed?.theme).toBe('pastel:blue')
      expect(parsed?.appearance).toBe('light')
    })

    it('migrates the old 16/16/18 default font triplet to the new defaults', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'pastel:blue',
        motion: 'system',
        surfaces: {
          'card-front': { fontSize: 16, fontFamily: 'system-sans', lineHeight: 'normal' },
          'card-back': { fontSize: 16, fontFamily: 'system-sans', lineHeight: 'normal' },
          reader: { fontSize: 18, fontFamily: 'system-serif', lineHeight: 'relaxed' },
        },
        seenFeatureAnnouncements: [],
      })
      expect(parsed?.surfaces['card-front'].fontSize).toBe(45)
      expect(parsed?.surfaces['card-back'].fontSize).toBe(22)
      expect(parsed?.surfaces.reader.fontSize).toBe(20)
      expect(parsed?.surfaces['card-front'].fontFamily).toBe('inter')
      expect(parsed?.surfaces['card-back'].fontFamily).toBe('source-sans-3')
      expect(parsed?.surfaces.reader.fontFamily).toBe('source-serif-4')
    })

    it('migrates legacy system-mono to system-mono (not a proportional font)', () => {
      const parsed = parseUiPrefsFromJson({
        v: 1,
        theme: 'pastel:blue',
        motion: 'system',
        surfaces: {
          'card-front': { fontSize: 40, fontFamily: 'system-mono', lineHeight: 'normal' },
          'card-back': defaultUiPrefs().surfaces['card-back'],
          reader: defaultUiPrefs().surfaces.reader,
        },
        seenFeatureAnnouncements: [],
      })
      expect(parsed?.surfaces['card-front'].fontFamily).toBe('system-mono')
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
      expect(parsed?.appearance).toBe('light')
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
        appearance: 'dark',
        surfaces: {
          'card-front': { backgroundColor: '#abcdef', fontSize: 40 },
          reader: { lineHeight: 'tight' },
        },
      })
      expect(next.motion).toBe('reduced')
      expect(next.appearance).toBe('dark')
      expect(next.surfaces['card-front'].backgroundColor).toBe('#abcdef')
      expect(next.surfaces['card-front'].fontSize).toBe(40)
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

    it('round-trips onboardingHidden through patch + parse + stored shape', () => {
      const base = defaultUiPrefs()
      expect(base.onboardingHidden).toBe(false)
      const flipped = applyUiPrefsPatch(base, { onboardingHidden: true })
      expect(flipped.onboardingHidden).toBe(true)
      const reparsed = parseUiPrefsFromJson(toStoredUiPrefs(flipped))
      expect(reparsed?.onboardingHidden).toBe(true)
      const rolledBack = applyUiPrefsPatch(flipped, { onboardingHidden: false })
      expect(rolledBack.onboardingHidden).toBe(false)
    })

    it('ignores non-boolean onboardingHidden patches', () => {
      const base = defaultUiPrefs()
      const next = applyUiPrefsPatch(
        base,
        { onboardingHidden: 'yes' as unknown as boolean },
      )
      expect(next.onboardingHidden).toBe(false)
    })
  })

  describe('clampFontSizePxForSurface', () => {
    it('rounds fractional pixels to the nearest integer within the surface range', () => {
      expect(clampFontSizePxForSurface(45.4, 'card-front')).toBe(45)
      expect(clampFontSizePxForSurface(16.2, 'card-back')).toBe(16)
    })

    it('applies per-surface bands (tight front, moderate back, wide reader)', () => {
      const f = fontSizeBoundsForSurface('card-front')
      const b = fontSizeBoundsForSurface('card-back')
      const r = fontSizeBoundsForSurface('reader')
      expect(f).toEqual({ min: 27, max: 47 })
      expect(b).toEqual({ min: 11, max: 33 })
      expect(r).toEqual({ min: 10, max: 36 })
      expect(clampFontSizePxForSurface(0, 'card-front')).toBe(27)
      expect(clampFontSizePxForSurface(999, 'card-front')).toBe(47)
      expect(clampFontSizePxForSurface(999, 'card-back')).toBe(33)
      expect(clampFontSizePxForSurface(5, 'reader')).toBe(10)
    })

    it('returns null for non-numeric / non-finite input so callers can fall back', () => {
      expect(clampFontSizePxForSurface('18' as unknown, 'reader')).toBeNull()
      expect(clampFontSizePxForSurface('lg' as unknown, 'reader')).toBeNull()
      expect(clampFontSizePxForSurface(Number.NaN, 'reader')).toBeNull()
      expect(clampFontSizePxForSurface(Number.POSITIVE_INFINITY, 'reader')).toBeNull()
      expect(clampFontSizePxForSurface(undefined, 'reader')).toBeNull()
    })

    it('deprecated clampFontSizePx delegates to the card front band', () => {
      expect(clampFontSizePx(999)).toBe(47)
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
