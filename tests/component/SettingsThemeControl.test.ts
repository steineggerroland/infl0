// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { ThemeChoice, UiPrefs, UiPrefsPatch } from '../../utils/ui-prefs'
import { defaultUiPrefs, THEME_PRESET_IDS } from '../../utils/ui-prefs'

/**
 * Behavioural test for the theme picker on `/settings`.
 *
 * The contract: selecting a preset (or `custom`) calls
 * `useUiPrefs().update({ theme })` exactly once with the new value;
 * re-selecting the active option is a no-op. We do NOT assert color
 * values or CSS class lists — those are token / preview concerns and
 * live in `assets/css/tailwind.css` + `SettingsThemePreview.vue`.
 */

const updateSpy = vi.fn<(patch: UiPrefsPatch) => void>()
const sharedPrefs = ref<UiPrefs>(defaultUiPrefs())

vi.stubGlobal('useUiPrefs', () => ({
  prefs: sharedPrefs,
  update: updateSpy,
  reset: vi.fn(),
  markAnnouncementSeen: vi.fn(),
}))
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsThemeControl = (await import('../../components/SettingsThemeControl.vue'))
  .default

function makeI18n() {
  const messages = {
    settingsDisplay: {
      themeLabel: 'Theme',
      themeHint: 'Preview updates live.',
      themeOptions: {
        'calm-light': { label: 'Calm & light', hint: 'Default.' },
        'warm-dark': { label: 'Warm & dark', hint: 'Low glare.' },
        'high-contrast': { label: 'High contrast', hint: 'Max. readability.' },
        custom: { label: 'Custom colors', hint: 'Placeholder.' },
      },
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountControl() {
  return mount(SettingsThemeControl, {
    global: { plugins: [makeI18n()] },
  })
}

describe('SettingsThemeControl', () => {
  afterEach(() => {
    updateSpy.mockReset()
    sharedPrefs.value = defaultUiPrefs()
  })

  it('marks the current theme choice as checked', () => {
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'warm-dark' }
    const wrapper = mountControl()
    const warmDark = wrapper.get('[data-testid="theme-option-warm-dark"]')
      .element as HTMLInputElement
    const calm = wrapper.get('[data-testid="theme-option-calm-light"]')
      .element as HTMLInputElement
    expect(warmDark.checked).toBe(true)
    expect(calm.checked).toBe(false)
  })

  it('sends { theme } when the user picks a new preset', async () => {
    const wrapper = mountControl()
    await wrapper
      .get('[data-testid="theme-option-high-contrast"]')
      .setValue(true)
    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy.mock.calls[0][0]).toEqual({
      theme: 'high-contrast' satisfies ThemeChoice,
    })
  })

  it('sends { theme: "custom" } even though the color pickers are not wired yet', async () => {
    // This is the product call: committing to the intent survives the
    // UI gap. When the color-picker UI lands it inherits the stored
    // value and the user does not have to "re-choose custom".
    const wrapper = mountControl()
    await wrapper.get('[data-testid="theme-option-custom"]').setValue(true)
    expect(updateSpy).toHaveBeenCalledWith({ theme: 'custom' })
  })

  it('does not re-send a patch when the user re-selects the active option', async () => {
    sharedPrefs.value = { ...defaultUiPrefs(), theme: 'warm-dark' }
    const wrapper = mountControl()
    await wrapper.get('[data-testid="theme-option-warm-dark"]').trigger('change')
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('surfaces every preset plus the custom option, in a stable order', () => {
    // If the preset list ever grows, the order we show users must match
    // `THEME_PRESET_IDS` + custom, so the UI stays predictable and
    // translators can trust the display sequence.
    const wrapper = mountControl()
    const values = wrapper
      .findAll('input[name="ui-theme"]')
      .map((n) => (n.element as HTMLInputElement).value)
    expect(values).toEqual([...THEME_PRESET_IDS, 'custom'])
  })
})
