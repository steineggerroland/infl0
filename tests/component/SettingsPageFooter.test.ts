// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'
import SettingsPageFooter from '../../components/SettingsPageFooter.vue'

function makeI18n() {
  const messages = {
    settingsCommon: { footerNav: 'Page shortcuts' },
    menu: { timeline: 'Timeline', help: 'Help' },
  }
  return createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      en: messages,
      de: messages,
    },
  })
}

describe('SettingsPageFooter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="main"><div id="attach"></div></main>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('teleports the footer out of <main> so it can act as a page-level landmark', async () => {
    const i18n = makeI18n()
    mount(SettingsPageFooter, {
      attachTo: '#attach',
      global: {
        plugins: [i18n],
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    await flushPromises()
    await nextTick()

    const footer = document.querySelector('[data-testid="settings-page-footer"]')
    expect(footer).not.toBeNull()

    const main = document.getElementById('main')
    expect(main).not.toBeNull()
    expect(main!.contains(footer)).toBe(false)
    expect(document.body.contains(footer!)).toBe(true)

    const nav = footer!.querySelector('nav')
    expect(nav?.getAttribute('aria-label')).toBe('Page shortcuts')
  })

  it('honours containerMax=4xl on the inner wrapper', async () => {
    const i18n = makeI18n()
    mount(SettingsPageFooter, {
      props: { containerMax: '4xl' },
      attachTo: '#attach',
      global: {
        plugins: [i18n],
        stubs: {
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    await flushPromises()
    await nextTick()

    const inner = document.querySelector('[data-testid="settings-page-footer"] .max-w-4xl')
    expect(inner).not.toBeNull()
  })
})
