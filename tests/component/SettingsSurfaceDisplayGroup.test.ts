// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { UiPrefs, UiPrefsPatch } from '../../utils/ui-prefs'
import { defaultSurfacePrefs, defaultUiPrefs } from '../../utils/ui-prefs'

const updateSpy = vi.fn<(patch: UiPrefsPatch) => void>()
const sharedPrefs = ref<UiPrefs>(defaultUiPrefs())

vi.stubGlobal('useUiPrefs', () => ({
  prefs: sharedPrefs,
  update: updateSpy,
  reset: vi.fn(),
  markAnnouncementSeen: vi.fn(),
}))
vi.stubGlobal('useI18n', () => vueUseI18n())
vi.stubGlobal('useContainedFocusActive', () => {
  const active = ref(true)
  return {
    active,
    onFocusIn: vi.fn(),
    onFocusOut: vi.fn(),
    reveal: vi.fn(),
  }
})

const SettingsSurfaceDisplayGroup = (await import('../../components/SettingsSurfaceDisplayGroup.vue'))
  .default
const SettingsSurfacePreviewOne = (await import('../../components/SettingsSurfacePreviewOne.vue'))
  .default

function makeI18n() {
  const messages = {
    settingsDisplay: {
      fontFamilyLabel: 'Font',
      fontSizeLabel: 'Size',
      fontSizeUnit: 'px',
      fontSizeRangeAria: 'Size {surface}',
      surfaces: {
        cardFront: { heading: 'Card front', typographyHint: 'H', colorHint: 'C', areaLabel: 'front' },
        cardBack: { heading: 'Card back', typographyHint: 'H', colorHint: 'C', areaLabel: 'back' },
        reader: { heading: 'Reader', typographyHint: 'H', colorHint: 'C', areaLabel: 'reader' },
      },
      fontFamilyOptions: {
        'system-sans': 'SysS',
        'system-serif': 'SysSerif',
        'system-mono': 'SysM',
        inter: 'Inter',
        'source-sans-3': 'S3',
        'source-serif-4': 'S4',
        atkinson: 'A',
        lexend: 'L',
        opendyslexic: 'O',
        'ibm-plex': 'Ibm',
        fraunces: 'F',
      },
      customColors: {
        perSurfaceTitle: 'Colours',
        pickerGroupAria: 'Pickers {surface}',
        background: 'Bg',
        text: 'Fg',
        colorBackgroundAria: 'Bg {surface}',
        colorTextAria: 'Fg {surface}',
      },
      resetSurfaceAll: 'All',
      resetSurfaceAllAria: 'All {surface}',
      preview: { forThisSurface: 'Prev' },
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountGroup(surfaceId: 'card-front' | 'card-back' | 'reader' = 'card-front') {
  return mount(SettingsSurfaceDisplayGroup, {
    props: { surfaceId, showTopBorder: false },
    global: {
      plugins: [makeI18n()],
      stubs: { SettingsSurfacePreviewOne: { template: '<div data-testid="surface-preview-stub" />' } },
    },
  })
}

describe('SettingsSurfaceDisplayGroup', () => {
  afterEach(() => {
    updateSpy.mockReset()
    sharedPrefs.value = defaultUiPrefs()
  })

  it('reflects font family and size for the surface', () => {
    sharedPrefs.value = {
      ...defaultUiPrefs(),
      surfaces: {
        ...defaultUiPrefs().surfaces,
        'card-front': { ...defaultUiPrefs().surfaces['card-front'], fontSize: 42, fontFamily: 'lexend' },
      },
    }
    const w = mountGroup('card-front')
    expect((w.get('[data-testid="font-family-card-front"]').element as HTMLSelectElement).value).toBe('lexend')
    expect((w.get('[data-testid="font-size-num-card-front"]').element as HTMLInputElement).value).toBe('42')
  })

  it('patches font size from the range', () => {
    const w = mountGroup('card-back')
    const r = w.get('[data-testid="font-size-range-card-back"]')
    r.setValue(24)
    r.trigger('input')
    expect(updateSpy).toHaveBeenCalledWith({ surfaces: { 'card-back': { fontSize: 24 } } })
  })

  it('shows colour pickers when theme is custom', () => {
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'custom' }
    const w = mountGroup('reader')
    expect(w.find('[data-testid="custom-colors-reader"]').exists()).toBe(true)
  })

  it('patches background and text colour for this surface from the pickers', () => {
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'custom' }
    const w = mountGroup('card-back')
    const bg = w.get('[data-testid="custom-color-bg-card-back"]')
    const fg = w.get('[data-testid="custom-color-text-card-back"]')
    const bgEl = bg.element as HTMLInputElement
    const fgEl = fg.element as HTMLInputElement
    bgEl.value = '#ff0000'
    bg.trigger('input')
    expect(updateSpy).toHaveBeenLastCalledWith({
      surfaces: { 'card-back': { backgroundColor: '#ff0000' } },
    })
    updateSpy.mockClear()
    fgEl.value = '#00ff00'
    fg.trigger('input')
    expect(updateSpy).toHaveBeenLastCalledWith({
      surfaces: { 'card-back': { textColor: '#00ff00' } },
    })
  })

  it('resets the entire surface to app defaults (font, size, line height, colours inherit)', () => {
    const base = defaultUiPrefs()
    sharedPrefs.value = {
      ...base,
      theme: 'custom',
      surfaces: {
        ...base.surfaces,
        'card-back': {
          backgroundColor: '#000000',
          textColor: '#000001',
          fontFamily: 'lexend',
          fontSize: 18,
          lineHeight: 'tight',
        },
      },
    }
    const w = mountGroup('card-back')
    w.get('[data-testid="surface-reset-all-card-back"]').trigger('click')
    expect(updateSpy).toHaveBeenCalledWith({
      surfaces: { 'card-back': { ...defaultSurfacePrefs('card-back') } },
    })
  })
})
