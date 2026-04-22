import { describe, expect, it } from 'vitest'
import {
  buildThemeHtmlStyle,
  CALM_LIGHT_PICKER_DEFAULTS,
  deriveInfl0TokensFromSource,
  mixHex,
  PRESET_SOURCE,
  resolveThemeSource,
  relativeLuminance,
} from '../../utils/infl0-theme-derive'
import { applyUiPrefsPatch, defaultUiPrefs, type UiPrefs } from '../../utils/ui-prefs'

describe('buildThemeHtmlStyle', () => {
  it('always emits a non-empty style string with core tokens for calm-light', () => {
    const p = defaultUiPrefs()
    const s = buildThemeHtmlStyle(p)
    expect(s.length).toBeGreaterThan(80)
    expect(s).toContain('--infl0-app-bg:')
    expect(s).toContain('--infl0-chrome-surface:')
    expect(s).toContain('--infl0-panel-bg:')
    expect(s).toContain('--infl0-delta-positive-fg:')
    expect(s).toContain('--infl0-reader-link:')
  })

  it('differs between warm-dark and calm-light', () => {
    const calm = buildThemeHtmlStyle({ ...defaultUiPrefs(), theme: 'calm-light' })
    const warm = buildThemeHtmlStyle({ ...defaultUiPrefs(), theme: 'warm-dark' })
    expect(calm).not.toEqual(warm)
    expect(warm).toContain('--infl0-app-bg: #')
  })

  it('for custom, uses stored surface colors in the pipeline', () => {
    const base = { ...defaultUiPrefs(), theme: 'custom' as const }
    const p = applyUiPrefsPatch(base, {
      surfaces: { 'card-front': { backgroundColor: '#112233' } },
    })
    const s = buildThemeHtmlStyle(p)
    expect(s).toContain('#112233')
  })
})

describe('resolveThemeSource', () => {
  it('uses preset palettes for built-in themes', () => {
    const p = { ...defaultUiPrefs(), theme: 'high-contrast' as const }
    expect(resolveThemeSource(p)).toEqual(PRESET_SOURCE['high-contrast'])
  })

  it('custom theme tolerates missing surfaces bag (runtime legacy)', () => {
    const legacy = { theme: 'custom' } as UiPrefs
    const expected = resolveThemeSource({ ...defaultUiPrefs(), theme: 'custom' })
    expect(resolveThemeSource(legacy)).toEqual(expected)
  })

  it('custom theme tolerates surfaces with only some keys (runtime partial JSON)', () => {
    const partial = {
      theme: 'custom' as const,
      surfaces: {
        'card-front': {
          backgroundColor: '#aabbcc',
          textColor: null,
          fontFamily: 'system-sans' as const,
          fontSize: 16,
          lineHeight: 'normal' as const,
        },
      },
    } as unknown as UiPrefs
    const src = resolveThemeSource(partial)
    expect(src.cardFront.bg).toBe('#aabbcc')
    expect(src.cardBack.bg).toBe(CALM_LIGHT_PICKER_DEFAULTS['card-back'].bg)
    expect(src.reader.bg).toBe(CALM_LIGHT_PICKER_DEFAULTS.reader.bg)
  })

  it('custom theme treats array surfaces as empty patch', () => {
    const corrupted = {
      ...defaultUiPrefs(),
      theme: 'custom' as const,
      surfaces: [] as unknown,
    } as UiPrefs
    expect(resolveThemeSource(corrupted)).toEqual(
      resolveThemeSource({ ...defaultUiPrefs(), theme: 'custom' }),
    )
  })
})

describe('deriveInfl0TokensFromSource', () => {
  it('dark primary shifts app background darker than a light primary', () => {
    const darkPrimary = deriveInfl0TokensFromSource({
      cardFront: { bg: '#0f172a', text: '#f3f4f6' },
      cardBack: { bg: '#1a202c', text: '#d1d5db' },
      reader: { bg: '#1a202c', text: '#d1d5db' },
    })
    const lightPrimary = deriveInfl0TokensFromSource(PRESET_SOURCE['calm-light'])
    expect(relativeLuminance(darkPrimary['--infl0-app-bg'])).toBeLessThan(
      relativeLuminance(lightPrimary['--infl0-app-bg']!),
    )
  })

  it('chrome surface matches the same mix as derive (white + primary)', () => {
    const t = deriveInfl0TokensFromSource(PRESET_SOURCE['calm-light'])
    const pbg = PRESET_SOURCE['calm-light'].cardFront.bg
    const mixHint = mixHex('#ffffff', pbg, 0.04)
    expect(t['--infl0-chrome-surface']).toBe(mixHint)
  })
})
