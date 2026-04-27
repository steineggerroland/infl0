// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'

/**
 * `/settings/privacy` is now an INFORMATIONAL page. It explains the
 * storage philosophy and routes the user to `/settings#tracking` for the
 * actual consent toggle.
 *
 * This test locks the two contracts the Privacy page carries on its own:
 *   1. it does NOT render an engagement-tracking control (the control
 *      moved to /settings; duplicating it here would break "one setting,
 *      one place")
 *   2. it provides a visible CTA link to `/settings#tracking` so the
 *      referenced setting is always one click away
 */

vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsPrivacy = (await import('../../pages/settings/privacy.vue')).default

function makeI18n() {
  const messages = {
    settingsCommon: { footerNav: 'Page shortcuts' },
    settingsPrivacy: {
      title: 'Privacy',
      intro: 'What we store about you and why.',
      philosophyHeading: 'Storage philosophy',
      philosophyBody: 'We only store what is needed.',
      controlHeading: 'Control the analysis yourself',
      controlBody: 'Change the setting anytime.',
      controlCta: 'Open Settings',
    },
    menu: { timeline: 'Timeline', help: 'Help' },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountPage() {
  return mount(SettingsPrivacy, {
    global: {
      plugins: [makeI18n()],
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to" :data-to="to"><slot /></a>',
        },
      },
    },
  })
}

describe('SettingsPrivacy page (info-only)', () => {
  it('renders the privacy title as the single <h1>', () => {
    const wrapper = mountPage()
    const h1s = wrapper.findAll('h1')
    expect(h1s).toHaveLength(1)
    expect(h1s[0]!.text()).toBe('Privacy')
  })

  it('does not render an engagement-tracking toggle — that control lives on /settings', () => {
    const wrapper = mountPage()
    // No checkbox at all. A plain CSS selector is enough; the page has no
    // other `<input>` elements, so this is specific without being brittle.
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.exists()).toBe(false)
    expect(wrapper.find('[data-testid="tracking-toggle"]').exists()).toBe(false)
  })

  it('links to /settings#tracking so users reach the actual control in one click', () => {
    const wrapper = mountPage()
    const cta = wrapper.find('[data-testid="privacy-cta-to-settings"]')
    expect(cta.exists()).toBe(true)
    expect(cta.attributes('data-to') ?? cta.attributes('href')).toBe('/settings#tracking')
  })
})
