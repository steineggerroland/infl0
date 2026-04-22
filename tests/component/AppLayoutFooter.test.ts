// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { h } from 'vue'

/**
 * The `app` layout owns the page-level footer — rendered OUTSIDE `<main>`
 * so it is a `contentinfo` landmark, and rendered WITHOUT `<Teleport>`
 * so Vue 3 SSR places it after the page content (the old teleport-to-body
 * path serialised the footer above `<main>` on reload).
 *
 * This test locks the *behavior* pages depend on:
 *   - no `appFooter` meta ⇒ no footer
 *   - `appFooter: true` ⇒ footer rendered with default container/testid
 *   - `appFooter: { containerMax, testId }` ⇒ those overrides reach the footer
 *   - the `<footer>` element is a SIBLING of `<main>`, never a descendant
 */

type RouteMeta = { appFooter?: true | { containerMax?: 'lg' | '4xl'; testId?: string } }

function installRoute(meta: RouteMeta) {
  const route = { meta, path: '/test', fullPath: '/test' }
  vi.stubGlobal('useRoute', () => route)
}

vi.stubGlobal('useI18n', () => vueUseI18n())

async function mountLayout(meta: RouteMeta) {
  installRoute(meta)
  const AppLayout = (await import('../../layouts/app.vue')).default
  const AppFooterShortcuts = (await import('../../components/AppFooterShortcuts.vue')).default
  const messages = {
    common: { skipToMain: 'Skip to content' },
    settingsCommon: { footerNav: 'Page shortcuts' },
    menu: { timeline: 'Timeline', help: 'Help' },
  }
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: messages, de: messages },
  })

  return mount(AppLayout, {
    slots: {
      default: () => h('p', { 'data-testid': 'page-content' }, 'hello'),
    },
    global: {
      plugins: [i18n],
      // Nuxt auto-imports `components/*` at runtime; vitest does not,
      // so we wire them up explicitly. AppUserMenu pulls in auth + route
      // + shortcuts and is out of scope here, so we stub it.
      components: { AppFooterShortcuts },
      stubs: {
        AppUserMenu: { template: '<div data-testid="user-menu-stub" />' },
        // Avoid real teleports so we can assert DOM order plainly.
        Teleport: { template: '<div data-testid="teleport-stub"><slot /></div>' },
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('app layout — footer rendering', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('useI18n', () => vueUseI18n())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders no footer when the route did not opt in', async () => {
    const wrapper = await mountLayout({})
    expect(wrapper.find('footer').exists()).toBe(false)
  })

  it('renders the default footer when appFooter is truthy', async () => {
    const wrapper = await mountLayout({ appFooter: true })
    const footer = wrapper.find('footer')
    expect(footer.exists()).toBe(true)
    expect(footer.attributes('data-testid')).toBe('app-footer-shortcuts')
    expect(footer.find('.max-w-lg').exists()).toBe(true)
  })

  it('honours a custom testId and containerMax from page meta', async () => {
    const wrapper = await mountLayout({
      appFooter: { containerMax: '4xl', testId: 'feeds-page-footer' },
    })
    const footer = wrapper.get('footer')
    expect(footer.attributes('data-testid')).toBe('feeds-page-footer')
    expect(footer.find('.max-w-4xl').exists()).toBe(true)
  })

  it('places `<footer>` as a sibling of `<main>`, never nested inside it (contentinfo landmark contract)', async () => {
    const wrapper = await mountLayout({ appFooter: true })
    const main = wrapper.get('main')
    const footer = wrapper.get('footer')
    expect(main.element.contains(footer.element)).toBe(false)
  })
})
