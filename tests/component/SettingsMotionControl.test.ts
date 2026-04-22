// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { MotionMode, UiPrefs, UiPrefsPatch } from '../../utils/ui-prefs'
import { defaultUiPrefs } from '../../utils/ui-prefs'

/**
 * Behavioural test for the Motion picker on `/settings`.
 *
 * The contract we protect here is "picking an option sends a patch with
 * the new motion mode via useUiPrefs().update(...) exactly once". We do
 * NOT assert on CSS classes, colors, or the shape of the inner markup —
 * those can be refactored freely. The one data-testid we lock down is
 * `motion-control` so Playwright can find the group in an e2e smoke.
 */

const updateSpy = vi.fn<(patch: UiPrefsPatch) => void>()
// The state is a single shared ref across all `useUiPrefs()` calls in
// the tree, mirroring the singleton behaviour of the real composable.
const sharedPrefs = ref<UiPrefs>(defaultUiPrefs())

vi.stubGlobal('useUiPrefs', () => ({
  prefs: sharedPrefs,
  update: updateSpy,
  reset: vi.fn(),
  markAnnouncementSeen: vi.fn(),
}))
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsMotionControl = (await import('../../components/SettingsMotionControl.vue')).default

function makeI18n() {
  const messages = {
    settingsDisplay: {
      motionLabel: 'Motion and animation',
      motionHint: 'Reducing motion helps if transitions feel distracting.',
      motionOptions: {
        system: { label: 'Match my device', hint: 'Follows OS setting.' },
        reduced: { label: 'Reduced', hint: 'Short, calm transitions.' },
        standard: { label: 'Standard', hint: 'Full animations.' },
      },
    },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountControl() {
  return mount(SettingsMotionControl, {
    global: { plugins: [makeI18n()] },
  })
}

describe('SettingsMotionControl', () => {
  afterEach(() => {
    updateSpy.mockReset()
    sharedPrefs.value = defaultUiPrefs()
  })

  it('marks the current motion mode as checked', () => {
    sharedPrefs.value = { ...defaultUiPrefs(), motion: 'reduced' }
    const wrapper = mountControl()
    const reduced = wrapper.get('[data-testid="motion-option-reduced"]')
      .element as HTMLInputElement
    const system = wrapper.get('[data-testid="motion-option-system"]')
      .element as HTMLInputElement
    expect(reduced.checked).toBe(true)
    expect(system.checked).toBe(false)
  })

  it('sends a single patch { motion } when the user picks a new option', async () => {
    const wrapper = mountControl()

    await wrapper
      .get('[data-testid="motion-option-reduced"]')
      .setValue(true)

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy.mock.calls[0][0]).toEqual({ motion: 'reduced' satisfies MotionMode })
  })

  it('does not re-send a patch when the user re-selects the already-active option', async () => {
    // A pointless PATCH burns a server round-trip and can lose the
    // debounce / optimistic-update contract if the backend rewrites the
    // returned state. We short-circuit in the component instead.
    sharedPrefs.value = { ...defaultUiPrefs(), motion: 'standard' }
    const wrapper = mountControl()

    const standard = wrapper.get('[data-testid="motion-option-standard"]')
    await standard.trigger('change')

    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('renders exactly the three motion modes declared in MOTION_MODES', () => {
    // Having more or fewer options would mean the types drifted away
    // from the UI. Testing the intent (three distinct options, each
    // wired to a distinct testid) keeps us independent of markup
    // details.
    const wrapper = mountControl()
    const ids = wrapper
      .findAll('input[name="ui-motion"]')
      .map((n) => (n.element as HTMLInputElement).value)
    expect(ids).toEqual(['system', 'reduced', 'standard'])
  })
})
