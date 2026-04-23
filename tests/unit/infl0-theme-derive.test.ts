import { describe, expect, it } from 'vitest'
import {
  buildThemeHtmlStyle,
  CALM_LIGHT_PICKER_DEFAULTS,
  deriveInfl0TokensFromSource,
  hexHueDegrees,
  mixHex,
  PRESET_HIGH_CONTRAST,
  resolveThemeSource,
  relativeLuminance,
} from '../../utils/infl0-theme-derive'
import { applyUiPrefsPatch, defaultUiPrefs, type UiPrefs } from '../../utils/ui-prefs'

describe('buildThemeHtmlStyle', () => {
  it('always emits a non-empty style string with core tokens for default pastel', () => {
    const p = defaultUiPrefs()
    const s = buildThemeHtmlStyle(p)
    expect(s.length).toBeGreaterThan(80)
    expect(s).toContain('color-scheme: light')
    expect(s).toContain('--infl0-app-bg:')
    expect(s).toContain('--infl0-chrome-surface:')
    expect(s).toContain('--infl0-panel-bg:')
    expect(s).toContain('--infl0-delta-positive-fg:')
    expect(s).toContain('--infl0-reader-link:')
    expect(s).toContain('--infl0-font-front-family:')
    expect(s).toContain('--infl0-font-back-family:')
    expect(s).toContain('--infl0-font-reader-family:')
    expect(s).toContain('--infl0-font-front-size: 45px')
    expect(s).toContain('--infl0-font-reader-size: 20px')
    expect(s).toContain('--infl0-line-height-front:')
  })

  it('differs between light and dark pair for the same preset id', () => {
    const p = { ...defaultUiPrefs(), theme: 'pastel:blue' as const }
    const light = buildThemeHtmlStyle(p, { effectiveAppearance: 'light' })
    const dark = buildThemeHtmlStyle(p, { effectiveAppearance: 'dark' })
    expect(light).not.toEqual(dark)
    expect(dark).toContain('color-scheme: dark')
  })

  it('for custom, uses stored surface colors in the pipeline', () => {
    const base = { ...defaultUiPrefs(), theme: 'custom' as const }
    const p = applyUiPrefsPatch(base, {
      surfaces: { 'card-front': { backgroundColor: '#112233' } },
    })
    const s = buildThemeHtmlStyle(p)
    expect(s).toContain('#112233')
  })

  it('sets color-scheme from effectiveAppearance for UA chrome', () => {
    const p = defaultUiPrefs()
    expect(buildThemeHtmlStyle(p, { effectiveAppearance: 'dark' })).toContain('color-scheme: dark')
    expect(buildThemeHtmlStyle(p, { effectiveAppearance: 'light' })).toContain('color-scheme: light')
  })
})

describe('resolveThemeSource', () => {
  it('uses high-contrast palette', () => {
    const p = { ...defaultUiPrefs(), theme: 'high-contrast' as const }
    expect(resolveThemeSource(p, 'light')).toEqual(PRESET_HIGH_CONTRAST)
    expect(resolveThemeSource(p, 'dark')).toEqual(PRESET_HIGH_CONTRAST)
  })

  it('custom theme tolerates missing surfaces bag (runtime legacy)', () => {
    const legacy = { theme: 'custom' } as UiPrefs
    const expected = resolveThemeSource({ ...defaultUiPrefs(), theme: 'custom' }, 'light')
    expect(resolveThemeSource(legacy, 'light')).toEqual(expected)
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
    const src = resolveThemeSource(partial, 'light')
    expect(src.cardFront.bg).toBe('#aabbcc')
    expect(src.cardBack.bg).toBe(CALM_LIGHT_PICKER_DEFAULTS['card-back'].bg)
    expect(src.reader.bg).toBe(CALM_LIGHT_PICKER_DEFAULTS.reader.bg)
  })

  it('pastel yellow light keeps a yellow-tinted card front (hue naming)', () => {
    const src = resolveThemeSource({ ...defaultUiPrefs(), theme: 'pastel:yellow' }, 'light')
    const hue = hexHueDegrees(src.cardFront.bg)
    expect(hue).toBeGreaterThan(38)
    expect(hue).toBeLessThan(78)
  })

  it('warm blue light keeps a blue-tinted card front', () => {
    const src = resolveThemeSource({ ...defaultUiPrefs(), theme: 'warm:blue' }, 'light')
    const hue = hexHueDegrees(src.cardFront.bg)
    expect(hue).toBeGreaterThan(185)
    expect(hue).toBeLessThan(235)
  })

  it('warm yellow dark still reads warm on card front', () => {
    const src = resolveThemeSource({ ...defaultUiPrefs(), theme: 'warm:yellow' }, 'dark')
    const hue = hexHueDegrees(src.cardFront.bg)
    expect(hue).toBeGreaterThan(38)
    expect(hue).toBeLessThan(85)
  })

  it('custom theme treats array surfaces as empty patch', () => {
    const corrupted = {
      ...defaultUiPrefs(),
      theme: 'custom' as const,
      surfaces: [] as unknown,
    } as UiPrefs
    expect(resolveThemeSource(corrupted, 'light')).toEqual(
      resolveThemeSource({ ...defaultUiPrefs(), theme: 'custom' }, 'light'),
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
    const pastelBlueLight = resolveThemeSource(
      { ...defaultUiPrefs(), theme: 'pastel:blue' },
      'light',
    )
    const lightPrimary = deriveInfl0TokensFromSource(pastelBlueLight)
    expect(relativeLuminance(darkPrimary['--infl0-app-bg'])).toBeLessThan(
      relativeLuminance(lightPrimary['--infl0-app-bg']!),
    )
  })

  it('chrome surface matches the same mix as derive (white + primary)', () => {
    const pastelBlueLight = resolveThemeSource(
      { ...defaultUiPrefs(), theme: 'pastel:blue' },
      'light',
    )
    const t = deriveInfl0TokensFromSource(pastelBlueLight)
    const pbg = pastelBlueLight.cardFront.bg
    const mixHint = mixHex('#ffffff', pbg, 0.04)
    expect(t['--infl0-chrome-surface']).toBe(mixHint)
  })
})
