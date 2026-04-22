// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'

// `definePageMeta` is a Nuxt compiler macro; under Vitest we stub it to a
// no-op before importing the page. `useI18n` is an auto-import in Nuxt;
// we delegate to the real vue-i18n entry that reads the installed plugin.
vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsIndex = (await import('../../pages/settings/index.vue')).default

function makeI18n() {
  const messages = {
    settingsCommon: { footerNav: 'Page shortcuts' },
    settingsIndex: {
      title: 'Settings',
      intro: 'Change how infl0 looks and sorts.',
      placeholder: 'Work in progress.',
    },
    menu: { timeline: 'Timeline', help: 'Help' },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

function mountPage() {
  return mount(SettingsIndex, {
    global: {
      plugins: [makeI18n()],
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('SettingsIndex page (stub)', () => {
  it('renders a single page heading from i18n', () => {
    const wrapper = mountPage()
    const h1 = wrapper.get('h1')
    expect(h1.text()).toBe('Settings')
  })

  it('announces the placeholder section politely so screen readers pick up later live updates', () => {
    // The stub will grow into a real settings surface where save-feedback
    // is announced in the same region. `aria-live=polite` today is what
    // keeps that contract stable while the UI is being built.
    const wrapper = mountPage()
    const liveRegion = wrapper.find('[aria-live="polite"]')
    expect(liveRegion.exists()).toBe(true)
    expect(liveRegion.text()).toContain('Work in progress.')
  })

  it('does not render its own footer — the "Timeline/Hilfe" shortcuts come from the layout via definePageMeta({ appFooter })', () => {
    // The page only declares its intent in page meta. The `<footer>` is
    // rendered by `layouts/app.vue` as a sibling of `<main>`, so it stays
    // a `contentinfo` landmark AND SSR places it after the page content
    // (unlike the previous `<Teleport to="body">` approach).
    const wrapper = mountPage()
    expect(wrapper.find('footer').exists()).toBe(false)
  })
})
