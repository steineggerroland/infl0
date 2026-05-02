// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'

import enMessages from '../../i18n/locales/en.json'

vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())
vi.stubGlobal('useRoute', () => ({ hash: '' }))

const HelpPage = (await import('../../pages/help.vue')).default

const makeI18n = () =>
    createI18n({
        legacy: false,
        locale: 'en',
        fallbackLocale: 'en',
        messages: { en: enMessages },
    })

function mountHelp() {
    return mount(HelpPage, {
        global: {
            plugins: [makeI18n()],
            stubs: {
                NuxtLink: {
                    props: ['to'],
                    template: '<a :href="to"><slot /></a>',
                },
                LocaleSwitcher: { template: '<div data-testid="locale-switcher-stub" />' },
            },
        },
    })
}

describe('help page · FAQ DaisyUI collapse', () => {
    it('renders expandable details with collapse-arrow and stable test ids', async () => {
        const wrapper = mountHelp()
        const el = wrapper.get(
            '[data-testid="help-faq-details-passwordSafety"]',
        ).element as HTMLDetailsElement

        expect(el.className).toMatch(/\bcollapse\b/)
        expect(el.className).toMatch(/\bcollapse-arrow\b/)

        wrapper.unmount()
    })
})
