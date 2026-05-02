// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'

/**
 * Privacy *section* embedded in `/settings#privacy`: storage philosophy plus
 * a CTA to `/settings#tracking` (single place for the consent toggle).
 */

vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())

const SettingsPrivacySection = (
    await import('../../components/settings/SettingsPrivacySection.vue')
).default

function makeI18n() {
    const messages = {
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

function mountSection() {
    return mount(SettingsPrivacySection, {
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

describe('SettingsPrivacy section (embedded in settings hub)', () => {
    it('renders Privacy as one section title `<h2>` (no duplicate page `<h1>`)', () => {
        const wrapper = mountSection()
        expect(wrapper.findAll('h1')).toHaveLength(0)
        const h2Title = wrapper.get('#settings-privacy-title')
        expect(h2Title.element.tagName.toLowerCase()).toBe('h2')
        expect(h2Title.text()).toBe('Privacy')
    })

    it('does not render an engagement-tracking toggle — that control lives under #tracking', () => {
        const wrapper = mountSection()
        const checkbox = wrapper.find('input[type="checkbox"]')
        expect(checkbox.exists()).toBe(false)
        expect(wrapper.find('[data-testid="tracking-toggle"]').exists()).toBe(false)
    })

    it('links to /settings#tracking so users reach the actual control in one click', () => {
        const wrapper = mountSection()
        const cta = wrapper.find('[data-testid="privacy-cta-to-settings"]')
        expect(cta.exists()).toBe(true)
        expect(cta.attributes('data-to') ?? cta.attributes('href')).toBe('/settings#tracking')
    })
})
