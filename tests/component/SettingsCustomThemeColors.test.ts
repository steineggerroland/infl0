// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { UiPrefs, UiPrefsPatch } from '../../utils/ui-prefs'
import { defaultUiPrefs } from '../../utils/ui-prefs'

const updateSpy = vi.fn<(patch: UiPrefsPatch) => void>()
const sharedPrefs = ref<UiPrefs>({ ...defaultUiPrefs(), theme: 'custom' })

vi.stubGlobal('useUiPrefs', () => ({
  prefs: sharedPrefs,
  update: updateSpy,
  reset: vi.fn(),
  markAnnouncementSeen: vi.fn(),
}))
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsCustomThemeColors = (await import('../../components/SettingsCustomThemeColors.vue'))
  .default

const customMessages = {
  settingsDisplay: {
    customColors: {
      background: 'Background',
      text: 'Text',
      resetSurface: 'Reset',
      surfaces: {
        'card-front': { label: 'Primary' },
        'card-back': { label: 'Secondary' },
        reader: { label: 'Reader' },
      },
    },
  },
}

function mountWithI18n() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: customMessages, de: customMessages },
  })
  return mount(SettingsCustomThemeColors, { global: { plugins: [i18n] } })
}

describe('SettingsCustomThemeColors', () => {
  afterEach(() => {
    updateSpy.mockReset()
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'custom' }
  })

  it('is hidden when theme is not custom', () => {
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'pastel:blue' }
    const w = mountWithI18n()
    expect(w.find('[data-testid="custom-theme-colors"]').exists()).toBe(false)
  })

  it('shows one color pair per surface when theme is custom', () => {
    const w = mountWithI18n()
    expect(w.get('[data-testid="custom-theme-colors"]').isVisible()).toBe(true)
    expect(w.findAll('[data-testid^="custom-color-bg-"]')).toHaveLength(3)
    expect(w.findAll('[data-testid^="custom-color-text-"]')).toHaveLength(3)
  })

  it('persists a background change via useUiPrefs().update', async () => {
    const w = mountWithI18n()
    const el = w.get('[data-testid="custom-color-bg-card-front"]').element as HTMLInputElement
    el.value = '#aabbcc'
    await w.get('[data-testid="custom-color-bg-card-front"]').trigger('input')
    expect(updateSpy).toHaveBeenCalledWith({
      surfaces: { 'card-front': { backgroundColor: '#aabbcc' } },
    })
  })

  it('resets a surface to inherited defaults', async () => {
    const w = mountWithI18n()
    await w.get('[data-testid="custom-color-reset-reader"]').trigger('click')
    expect(updateSpy).toHaveBeenCalledWith({
      surfaces: { reader: { backgroundColor: null, textColor: null } },
    })
  })
})
