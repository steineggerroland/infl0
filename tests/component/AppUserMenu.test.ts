// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { defineComponent, h, ref } from 'vue'

/**
 * Behaviour test for the user menu's navigation section.
 *
 * The product decision is flat navigation with a dedicated "Einstellungen"
 * entry for direct-access preferences, alongside "Warum oben?" (an
 * explanatory read) and "Privatsphäre" (storage philosophy / legal page).
 * The settings toggles themselves live inside /settings; /settings is NOT
 * a hub of links. This test locks the *link set* a user sees, not the
 * exact markup.
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
      timeline: 'Timeline',
      feeds: 'Manage sources',
      settings: 'Settings',
      timelineScore: 'Adjust sorting',
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

  it('surfaces Einstellungen, Warum oben?, Privatsphäre and Sortierung as flat menu entries', async () => {
    const wrapper = await mountMenu('/')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/settings',
        '/settings/timeline-score',
        '/settings/personalization',
        '/settings/privacy',
      ]),
    )
  })

  it('keeps Timeline, Manage sources and Help reachable alongside the settings entries', async () => {
    const wrapper = await mountMenu('/foo')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/feeds', '/help', '/settings']))
  })

  it('hides only the current-route entry so the rest of the menu stays navigable', async () => {
    // On /settings the Einstellungen link is hidden, but Warum oben? /
    // Privatsphäre / Sortierung stay reachable — they are siblings, not
    // children of Einstellungen.
    const wrapper = await mountMenu('/settings')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).not.toContain('/settings')
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/settings/timeline-score',
        '/settings/personalization',
        '/settings/privacy',
      ]),
    )
  })

  it('hides Privatsphäre when the user is already on the Privatsphäre page', async () => {
    const wrapper = await mountMenu('/settings/privacy')
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).not.toContain('/settings/privacy')
    expect(hrefs).toContain('/settings')
  })
})
