// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'

import enMessages from '../../i18n/locales/en.json'
import deMessages from '../../i18n/locales/de.json'
import {
    SHORTCUT_GROUPS,
    tokenizeShortcutKey,
} from '../../utils/app-shortcuts'

/**
 * `pages/help.vue` carries the **central shortcuts reference**
 * (archived spec: `docs/archive/26-04-27-shortcuts-help.md`). These
 * tests protect the *user-visible* behaviour of that surface:
 *
 *   - The reference is reachable at a stable anchor
 *     (`#shortcuts-reference`) so deep links stay valid.
 *   - For every catalog entry the user sees a row that contains the
 *     plain-language label, the description, and a recognisable
 *     visible name for every key combo (`R`, `Shift … L`, `↑`, `Esc`).
 *   - The scope rules ("no shortcut while typing", "no chords", …)
 *     are listed in the same surface, in both EN and DE.
 *
 * Anything more specific is implementation:
 *
 *   - We do **not** pin the element used to render a key
 *     (`<kbd>` vs. `<span role="img">` vs. anything else); a refactor
 *     that keeps the visible labels intact must keep this test green.
 *   - We do **not** pin CSS classes, Tailwind tokens, or the order of
 *     ancestor wrappers around a row.
 *
 * The `data-testid` hooks (`help-shortcuts-reference`,
 * `help-shortcut-<entry>`) are explicit contracts the page exposes
 * for tests and other deep-linkers; they survive layout/styling
 * changes as long as the behavioural promise above holds.
 */

vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('useI18n', () => vueUseI18n())
vi.stubGlobal('useRoute', () => ({ hash: '' }))

const HelpPage = (await import('../../pages/help.vue')).default

function makeI18n(locale: 'en' | 'de') {
    return createI18n({
        legacy: false,
        locale,
        fallbackLocale: 'en',
        messages: { en: enMessages, de: deMessages },
    })
}

function mountHelp(locale: 'en' | 'de' = 'en') {
    return mount(HelpPage, {
        global: {
            plugins: [makeI18n(locale)],
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

describe('help page · shortcuts reference', () => {
    it('exposes the reference at the documented anchor with one accessible heading', () => {
        const wrapper = mountHelp()
        const section = wrapper.get('[data-testid="help-shortcuts-reference"]')

        expect(section.attributes('id')).toBe('shortcuts-reference')

        const headingId = section.attributes('aria-labelledby')
        expect(headingId).toBe('shortcuts-reference-heading')

        const heading = section.get(`#${headingId}`)
        expect(heading.text()).toMatch(/keyboard shortcuts/i)

        wrapper.unmount()
    })

    it('renders every catalog group, with every entry in it', () => {
        const wrapper = mountHelp()

        for (const group of SHORTCUT_GROUPS) {
            // `wrapper.get` throws if the selector matches nothing, so
            // simply calling it asserts the group renders.
            wrapper.get(`[data-testid="help-shortcut-group-${group.id}"]`)

            for (const entry of group.entries) {
                const row = wrapper.get(
                    `[data-testid="help-shortcut-${entry.id}"]`,
                )
                // Plain-language label + description must both render.
                // Using i18n messages directly keeps the test honest:
                // a missing translation key would surface here as the
                // raw `help.shortcutsReference.*` path in `row.text()`.
                const entries = enMessages.help.shortcutsReference.entries as Record<
                    string,
                    { label: string; description: string }
                >
                const enLabel = entries[entry.id]
                expect(enLabel, `missing en i18n for ${entry.id}`).toBeDefined()
                if (!enLabel) continue
                expect(row.text()).toContain(enLabel.label)
                expect(row.text()).toContain(enLabel.description)
            }
        }

        wrapper.unmount()
    })

    it('shows a recognisable visible label for every key in every combo', () => {
        // Behaviour: in the keys cluster of the row for "previous
        // article", the user must see "W" and "↑". How those labels
        // are rendered (`<kbd>`, `<span>` with kbd-like styling, an
        // inline image, …) is implementation — the test reads only
        // the visible text of the keys cluster (`*-keys` testid) and
        // does not pin a specific element.
        const wrapper = mountHelp()

        for (const group of SHORTCUT_GROUPS) {
            for (const entry of group.entries) {
                const keysText = wrapper
                    .get(`[data-testid="help-shortcut-${entry.id}-keys"]`)
                    .text()

                for (const combo of entry.keys) {
                    for (const token of tokenizeShortcutKey(combo)) {
                        expect(
                            keysText,
                            `row "${entry.id}" should show visible label "${token.label}" for combo "${combo}"`,
                        ).toContain(token.label)
                    }
                }
            }
        }

        wrapper.unmount()
    })

    it('lists the four scope rules so users know when a shortcut is silent', () => {
        const wrapper = mountHelp()
        const section = wrapper.get('[data-testid="help-shortcuts-reference"]')
        const rules = enMessages.help.shortcutsReference.scopeRules

        for (const rule of Object.values(rules)) {
            expect(section.text()).toContain(rule)
        }

        wrapper.unmount()
    })

    it('keeps the table of contents pointing at the reference anchor', () => {
        const wrapper = mountHelp()
        const tocLink = wrapper.find('a[href="#shortcuts-reference"]')

        expect(tocLink.exists()).toBe(true)
        expect(tocLink.text()).toBe(
            enMessages.help.shortcutsReference.tocLabel,
        )

        wrapper.unmount()
    })

    it('also renders in German with the same structure', () => {
        const wrapper = mountHelp('de')
        const section = wrapper.get('[data-testid="help-shortcuts-reference"]')

        expect(section.text()).toContain(
            deMessages.help.shortcutsReference.title,
        )
        const groups = deMessages.help.shortcutsReference.groups as Record<
            string,
            { title: string; summary: string }
        >
        for (const group of SHORTCUT_GROUPS) {
            const groupTitle = groups[group.id]?.title
            expect(groupTitle, `missing de i18n for group ${group.id}`).toBeDefined()
            if (groupTitle) expect(section.text()).toContain(groupTitle)
        }

        wrapper.unmount()
    })
})
