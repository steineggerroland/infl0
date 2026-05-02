// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { reactive } from 'vue'

vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsLayout = (await import('../../layouts/settings.vue')).default

function makeI18n() {
    const messages = {
        common: { skipToMain: 'Skip' },
        settingsNav: {
            landmark: 'Settings sections',
            openSections: 'Sections',
            closeDrawer: 'Close navigation',
        },
        settingsDisplay: { heading: 'Display' },
        settingsIndex: {
            onboardingHeading: 'Welcome cards',
            trackingHeading: 'Reading-behaviour analysis',
        },
        settingsTimeline: { title: 'Adjust sorting' },
        menu: { timeline: '', help: '', open: '', close: '', feeds: '', settings: '' },
    }
    return createI18n({
        legacy: false,
        locale: 'en',
        messages: { en: messages, de: messages },
    })
}

function mountLayout(routeOverrides: Partial<{ path: string; hash: string; fullPath: string }>) {
    const route = reactive({
        path: '/settings',
        hash: '',
        fullPath: '/settings',
        meta: { appFooter: true as const },
        ...routeOverrides,
    })
    vi.stubGlobal('useRoute', () => route)

    return mount(SettingsLayout, {
        slots: { default: '<div data-testid="settings-slot">Content</div>' },
        global: {
            plugins: [makeI18n()],
            stubs: {
                NuxtLink: {
                    props: ['to'],
                    inheritAttrs: false,
                    template: '<a :href="to" v-bind="$attrs"><slot /></a>',
                },
                AppFooterShortcuts: true,
                AppUserMenu: true,
                Teleport: true,
            },
        },
    })
}

describe('Settings layout (drawer nav)', () => {
    it('exposes hub landmark navigation with four stable /settings hash links', () => {
        const wrapper = mountLayout({})
        const nav = wrapper.find('[data-testid="settings-nav-sidebar"]')
        expect(nav.attributes('aria-label')).toBe('Settings sections')

        expect(wrapper.find('[data-testid="settings-nav-link-display"]').attributes('href')).toBe('/settings#display')
        expect(wrapper.find('[data-testid="settings-nav-link-onboarding"]').attributes('href')).toBe(
            '/settings#onboarding',
        )
        expect(wrapper.find('[data-testid="settings-nav-link-sorting"]').attributes('href')).toBe('/settings#sorting')
        expect(wrapper.find('[data-testid="settings-nav-link-tracking"]').attributes('href')).toBe('/settings#tracking')
        expect(wrapper.findAll('[data-testid^="settings-nav-link-"]')).toHaveLength(4)
    })

    it('marks the tracking anchor row when the route hash targets that section', () => {
        const wrapper = mountLayout({
            path: '/settings',
            hash: '#tracking',
            fullPath: '/settings#tracking',
        })
        const link = wrapper.find('[data-testid="settings-nav-link-tracking"]')
        expect(link.attributes('aria-current')).toBe('location')
        expect(wrapper.find('[data-testid="settings-nav-link-display"]').attributes('aria-current')).toBeUndefined()
    })

    it('omits hub drawer sidebar on personalization and privacy routes', () => {
        const p = mountLayout({
            path: '/settings/personalization',
            hash: '',
            fullPath: '/settings/personalization',
        })
        expect(p.find('[data-testid="settings-nav-sidebar"]').exists()).toBe(false)
        expect(p.find('[data-testid="settings-nav-drawer-toggle"]').exists()).toBe(false)
        p.unmount()

        const pr = mountLayout({
            path: '/settings/privacy',
            hash: '',
            fullPath: '/settings/privacy',
        })
        expect(pr.find('[data-testid="settings-nav-sidebar"]').exists()).toBe(false)
        pr.unmount()
    })

    it('renders mobile sections toggle alongside main slot', () => {
        const wrapper = mountLayout({})
        expect(wrapper.find('[data-testid="settings-nav-drawer-toggle"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="settings-slot"]').exists()).toBe(true)
    })
})
