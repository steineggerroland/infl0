// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { ThemeChoice, UiPrefs, UiPrefsPatch } from '../../utils/ui-prefs'
import { defaultUiPrefs, THEME_HUE_IDS, THEME_PRESET_IDS } from '../../utils/ui-prefs'

/**
 * Behavioural test for the theme picker on `/settings`.
 *
 * The contract: choosing a preset (or `custom`) calls
 * `useUiPrefs().update({ theme })` exactly once with the new value;
 * re-selecting the active option is a no-op.
 */

const updateSpy = vi.fn<(patch: UiPrefsPatch) => void>()
const sharedPrefs = ref<UiPrefs>(defaultUiPrefs())

vi.stubGlobal('useUiPrefs', () => ({
  prefs: sharedPrefs,
  update: updateSpy,
  reset: vi.fn(),
  markAnnouncementSeen: vi.fn(),
}))
vi.stubGlobal('useEffectiveAppearance', () => ({
  effectiveAppearance: ref<'light' | 'dark'>('light'),
}))
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsThemeControl = (await import('../../components/SettingsThemeControl.vue'))
  .default

function themeOptionKey(choice: ThemeChoice): string {
  if (choice === 'custom') return 'custom'
  if (choice === 'high-contrast') return 'highContrast'
  return choice.replace(':', '_')
}

function makeI18n() {
  const themeOptions: Record<string, { label: string; hint: string }> = {}
  for (const id of THEME_PRESET_IDS) {
    themeOptions[themeOptionKey(id)] = { label: String(id), hint: '' }
  }
  themeOptions.custom = { label: 'custom', hint: '' }
  themeOptions.highContrast = { label: 'hc', hint: '' }
  const messages = {
    settingsDisplay: {
      themeLabel: 'Palette',
      themeHint: 'Pick one.',
      themePastelGroup: 'Pastel',
      themeWarmGroup: 'Warm',
      themeOptions,
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountControl() {
  return mount(SettingsThemeControl, {
    global: {
      plugins: [makeI18n()],
    },
  })
}

describe('SettingsThemeControl', () => {
  afterEach(() => {
    updateSpy.mockReset()
    sharedPrefs.value = defaultUiPrefs()
  })

  it('marks the current warm preset swatch (aria-checked)', () => {
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'warm:blue' }
    const wrapper = mountControl()
    const warmBlue = wrapper.get('[data-testid="theme-swatch-warm-blue"]').element as HTMLButtonElement
    const pastelBlue = wrapper.get('[data-testid="theme-swatch-pastel-blue"]').element as HTMLButtonElement
    expect(warmBlue.getAttribute('aria-checked')).toBe('true')
    expect(pastelBlue.getAttribute('aria-checked')).toBe('false')
  })

  it('sends { theme } when the user picks a pastel swatch', async () => {
    const wrapper = mountControl()
    await wrapper.get('[data-testid="theme-swatch-pastel-green"]').trigger('click')
    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy.mock.calls[0][0]).toEqual({ theme: 'pastel:green' })
  })

  it('sends { theme } when the user picks a warm swatch', async () => {
    const wrapper = mountControl()
    await wrapper.get('[data-testid="theme-swatch-warm-red"]').trigger('click')
    expect(updateSpy).toHaveBeenCalledWith({ theme: 'warm:red' })
  })

  it('sends { theme: "high-contrast" } from the extra radio row', async () => {
    const wrapper = mountControl()
    await wrapper.get('[data-testid="theme-option-high-contrast"]').setValue(true)
    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy.mock.calls[0][0]).toEqual({ theme: 'high-contrast' })
  })

  it('sends { theme: "custom" } when the user picks own colors', async () => {
    const wrapper = mountControl()
    await wrapper.get('[data-testid="theme-option-custom"]').setValue(true)
    expect(updateSpy).toHaveBeenCalledWith({ theme: 'custom' })
  })

  it('does not re-send a patch when the user re-selects the active swatch', async () => {
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'warm:blue' }
    const wrapper = mountControl()
    await wrapper.get('[data-testid="theme-swatch-warm-blue"]').trigger('click')
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('exposes five pastel and five warm swatches plus high-contrast and custom', () => {
    const wrapper = mountControl()
    for (const hue of THEME_HUE_IDS) {
      expect(wrapper.find(`[data-testid="theme-swatch-pastel-${hue}"]`).exists()).toBe(true)
      expect(wrapper.find(`[data-testid="theme-swatch-warm-${hue}"]`).exists()).toBe(true)
    }
    expect(wrapper.find('[data-testid="theme-option-high-contrast"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-option-custom"]').exists()).toBe(true)
  })
})
