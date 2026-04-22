// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { UiPrefs, UiPrefsPatch } from '../../utils/ui-prefs'
import { defaultUiPrefs } from '../../utils/ui-prefs'

const updateSpy = vi.fn<(patch: UiPrefsPatch) => void>()
const sharedPrefs = ref<UiPrefs>(defaultUiPrefs())

vi.stubGlobal('useUiPrefs', () => ({
  prefs: sharedPrefs,
  update: updateSpy,
  reset: vi.fn(),
  markAnnouncementSeen: vi.fn(),
}))
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsAppearanceControl = (await import('../../components/SettingsAppearanceControl.vue'))
  .default

function makeI18n() {
  const messages = {
    settingsDisplay: {
      appearanceLabel: 'Appearance',
      appearanceHint: 'Chrome only.',
      appearanceOptions: {
        auto: { label: 'System', hint: 'Follow OS.' },
        light: { label: 'Light', hint: 'Lock light.' },
        dark: { label: 'Dark', hint: 'Lock dark.' },
      },
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountControl() {
  return mount(SettingsAppearanceControl, {
    global: { plugins: [makeI18n()] },
  })
}

describe('SettingsAppearanceControl', () => {
  afterEach(() => {
    updateSpy.mockReset()
    sharedPrefs.value = defaultUiPrefs()
  })

  it('marks the current appearance as checked', () => {
    sharedPrefs.value = { ...defaultUiPrefs(), appearance: 'dark' }
    const wrapper = mountControl()
    const dark = wrapper.get('[data-testid="appearance-option-dark"]').element as HTMLInputElement
    const auto = wrapper.get('[data-testid="appearance-option-auto"]').element as HTMLInputElement
    expect(dark.checked).toBe(true)
    expect(auto.checked).toBe(false)
  })

  it('sends { appearance } when the user picks a new mode', async () => {
    const wrapper = mountControl()
    await wrapper.get('[data-testid="appearance-option-light"]').setValue(true)
    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).toHaveBeenCalledWith({ appearance: 'light' })
  })

  it('does not call update when re-selecting the active mode', async () => {
    sharedPrefs.value = { ...defaultUiPrefs(), appearance: 'light' }
    const wrapper = mountControl()
    await wrapper.get('[data-testid="appearance-option-light"]').setValue(true)
    expect(updateSpy).not.toHaveBeenCalled()
  })
})
