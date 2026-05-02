// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { defineComponent, h, ref } from 'vue'

/**
 * Behaviour test for the user menu's navigation section.
 *
 * The product decision is flat navigation with a dedicated "Settings"
 * entry for direct-access preferences, alongside "Why at the top?" (an
 * explanatory read) and "Privacy" (storage philosophy / legal page).
 * The settings toggles themselves live inside /settings; /settings is NOT
 * a hub of links. "Adjust sorting" deliberately has no menu entry:
 * it lives as a section inside /settings, reached by the Settings
 * link (old deep-links to /settings/timeline-score are kept alive via a
 * 308 redirect configured in `nuxt.config.ts`).
 *
 * This test locks the *link set* a user sees, not the exact markup.
 */

// Nuxt auto-imports the menu component reaches for. We stub them at the
// global scope before the component module is pulled in via mount.
const routeRef = { value: { path: '/' } as { path: string } }
vi.stubGlobal(
  'useRoute',
  () => routeRef.value,
)
vi.stubGlobal(
  'useAuthLogout',
  () => ({ logout: vi.fn().mockResolvedValue(undefined) }),
)
vi.stubGlobal(
  'useTimelinePreferences',
  () => ({ showRead: ref(false), toggleShowRead: vi.fn() }),
)
// Nuxt normally auto-imports useI18n; under Vitest we delegate to the real
// vue-i18n useI18n which reads the installed plugin.
vi.stubGlobal('useI18n', () => vueUseI18n())

function makeI18n() {
  const messages = {
    menu: {
      navLandmark: 'App navigation',
      open: 'Menu',
      close: 'Close menu',
      timeline: 'Timeline',
      feeds: 'Manage sources',
      settings: 'Settings',
      personalization: 'Why at the top?',
      privacy: 'Privacy',
      help: 'Help',
      view: 'View',
      language: 'Language',
      logOut: 'Log out',
    },
    index: { showReadLabel: 'Show read' },
  }
  return createI18n({ legacy: false, locale: 'en', messages: { en: messages, de: messages } })
}

async function mountMenu(path: string) {
  routeRef.value = { path }
  const { default: AppUserMenu } = await import('../../components/AppUserMenu.vue')
  const LocaleSwitcherStub = defineComponent({
    render: () => h('div', { 'data-testid': 'locale-switcher-stub' }),
  })
  return mount(AppUserMenu, {
    global: {
      plugins: [makeI18n()],
      components: { LocaleSwitcher: LocaleSwitcherStub },
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('AppUserMenu navigation', () => {
  beforeEach(() => {
    routeRef.value = { path: '/' }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('surfaces Settings, "Why at the top?" and Privacy as flat anchor links into /settings', async () => {
    const wrapper = await mountMenu('/')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/settings',
        '/settings#personalization',
        '/settings#privacy',
      ]),
    )
  })

  it('uses DaisyUI menu and swap primitives for the navigation surface', async () => {
    const wrapper = await mountMenu('/foo')
    expect(wrapper.get('summary').classes()).toEqual(
      expect.arrayContaining(['btn', 'swap', 'swap-rotate']),
    )
    const menus = wrapper.findAll('ul.menu')
    expect(menus.length).toBeGreaterThanOrEqual(2)
  })

  it('updates the menu button label when the dropdown opens', async () => {
    const wrapper = await mountMenu('/foo')
    const details = wrapper.get('details')
    const summary = wrapper.get('summary')

    expect(summary.attributes('aria-label')).toBe('Menu')

    ;(details.element as HTMLDetailsElement).open = true
    await details.trigger('toggle')

    expect(summary.attributes('aria-label')).toBe('Close menu')
    expect(summary.classes()).toContain('swap-active')
  })

  it('no longer exposes "Adjust sorting" as a separate menu entry — it is a section inside /settings', async () => {
    // Keeping this as its own link would reintroduce a two-entry "settings
    // group" for the same page and contradict the "one click to the
    // setting" product rule. The 308 redirect for old bookmarks lives in
    // `nuxt.config.ts`, not in the menu.
    const wrapper = await mountMenu('/')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).not.toContain('/settings/timeline-score')
  })

  it('keeps Timeline, Manage sources and Help reachable alongside the settings entries', async () => {
    const wrapper = await mountMenu('/foo')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/feeds', '/help', '/settings']))
  })

  it('while on /settings, hides duplicate settings entries (sidebar + scrollspy)', async () => {
    const wrapper = await mountMenu('/settings')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href')).filter(Boolean) as string[]
    expect(hrefs.filter((h) => h.startsWith('/settings'))).toHaveLength(0)
    expect(hrefs).toContain('/help')
    expect(hrefs).toContain('/feeds')
  })
})
