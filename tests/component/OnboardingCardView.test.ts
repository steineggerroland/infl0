// @vitest-environment happy-dom
import { resetNuxtTestState } from '../_helpers/nuxt-globals'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'

import enLocale from '../../i18n/locales/en.json'
import deLocale from '../../i18n/locales/de.json'
import { useCoarsePointer } from '../../composables/useCoarsePointer'
import { defineShortcuts } from '../../composables/useShortcuts'

// In production these are auto-imported by Nuxt. The `OnboardingCardView`
// component reads them via the auto-import alias; tests inject the real
// composables onto `globalThis` so the same source compiles against
// happy-dom + Vitest.
vi.stubGlobal('useI18n', () => vueUseI18n())
vi.stubGlobal('useCoarsePointer', useCoarsePointer)
vi.stubGlobal('defineShortcuts', defineShortcuts)
vi.stubGlobal('useUiPrefs', () => ({
    prefs: ref({
        surfaces: {
            'card-front': { fontSize: 21, fontFamily: 'system-sans' },
            'card-back': { fontSize: 19, fontFamily: 'system-sans' },
            reader: { fontSize: 18, fontFamily: 'system-sans' },
        },
    }),
    update: vi.fn(),
}))

const NuxtLinkStub = {
    name: 'NuxtLink',
    props: ['to'],
    emits: ['click'],
    template:
        '<a :href="typeof to === \'string\' ? to : \'#\'" :data-stub-to="typeof to === \'string\' ? to : \'\'" @click.prevent="$emit(\'click\', $event)"><slot /></a>',
}

function makeI18n(locale: 'en' | 'de' = 'en') {
    return createI18n({
        legacy: false,
        locale,
        fallbackLocale: 'en',
        messages: { en: enLocale, de: deLocale },
    })
}

type MediaQueryStub = {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
}

function stubMatchMedia(matches: boolean): MediaQueryStub {
    const stub: MediaQueryStub = {
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: vi.fn((_query: string) => stub as unknown as MediaQueryList),
    })
    return stub
}

async function loadComponent() {
    const mod = await import('../../components/OnboardingCardView.vue')
    return mod.default
}

describe('OnboardingCardView', () => {
    beforeEach(() => {
        resetNuxtTestState()
        document.body.innerHTML = ''
        // matchMedia is per-test; keep useI18n / useCoarsePointer stubs alive.
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            writable: true,
            value: undefined,
        })
    })
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('renders the desktop front copy for the intro card on a fine pointer', async () => {
        stubMatchMedia(false)
        const i18n = makeI18n('en')
        const OnboardingCardView = await loadComponent()
        const wrapper = mount(OnboardingCardView, {
            props: { topic: 'intro', hasDeviceVariants: true },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        expect(wrapper.find('[data-testid="onboarding-card"]').exists()).toBe(true)
        expect(wrapper.attributes('data-onboarding-topic')).toBe('intro')
        const front = wrapper.find('[data-onboarding-front="intro"]')
        expect(front.exists()).toBe(true)
        expect(front.text()).toContain('click the card or use the "E" keyboard shortcut')
        expect(wrapper.find('[data-testid="onboarding-card-body-skeleton"]').exists()).toBe(false)
    })

    it('renders the mobile front copy for the intro card on a coarse pointer', async () => {
        stubMatchMedia(true)
        const i18n = makeI18n('en')
        const OnboardingCardView = await loadComponent()
        const wrapper = mount(OnboardingCardView, {
            props: { topic: 'intro', hasDeviceVariants: true },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        const front = wrapper.find('[data-onboarding-front="intro"]')
        expect(front.exists()).toBe(true)
        expect(front.text()).toContain('flip this card once')
    })

    it('shows the skeleton until matchMedia resolves for variant cards', async () => {
        // No matchMedia set in beforeEach -> useCoarsePointer falls back to
        // a deterministic value once mounted. To exercise the unresolved
        // path, mount without attachTo so onMounted does not run.
        const i18n = makeI18n('en')
        const OnboardingCardView = await loadComponent()
        const wrapper = mount(OnboardingCardView, {
            props: { topic: 'intro', hasDeviceVariants: true },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
        })
        const skeleton = wrapper.find('[data-testid="onboarding-card-body-skeleton"]')
        expect(skeleton.exists()).toBe(true)
        expect(wrapper.find('[data-onboarding-front="intro"]').exists()).toBe(false)
    })

    it('renders a single front copy for variant-less cards regardless of pointer', async () => {
        stubMatchMedia(true)
        const i18n = makeI18n('en')
        const OnboardingCardView = await loadComponent()
        const wrapper = mount(OnboardingCardView, {
            props: {
                topic: 'sources',
                hasDeviceVariants: false,
                cta: { labelKey: 'onboarding.sources.cta', href: '/feeds' },
            },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        expect(wrapper.find('[data-onboarding-front="sources"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="onboarding-card-body-skeleton"]').exists()).toBe(false)
    })

    it('exposes the CTA as an internal-only NuxtLink and ignores external hrefs', async () => {
        stubMatchMedia(false)
        const i18n = makeI18n('en')
        const OnboardingCardView = await loadComponent()
        const wrapperOk = mount(OnboardingCardView, {
            props: {
                topic: 'sources',
                hasDeviceVariants: false,
                cta: { labelKey: 'onboarding.sources.cta', href: '/feeds' },
            },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        const cta = wrapperOk.find('[data-onboarding-cta="sources"]')
        expect(cta.exists()).toBe(true)
        expect(cta.attributes('data-stub-to')).toBe('/feeds')

        const wrapperEvil = mount(OnboardingCardView, {
            props: {
                topic: 'sources',
                hasDeviceVariants: false,
                cta: { labelKey: 'onboarding.sources.cta', href: 'https://evil.example/' },
            },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        expect(wrapperEvil.find('[data-onboarding-cta="sources"]').exists()).toBe(false)
    })

    it('shows the skip-introduction button only on the intro card and emits skip', async () => {
        stubMatchMedia(false)
        const i18n = makeI18n('en')
        const OnboardingCardView = await loadComponent()

        const intro = mount(OnboardingCardView, {
            props: { topic: 'intro', hasDeviceVariants: true },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        const skip = intro.find('[data-onboarding-skip]')
        expect(skip.exists()).toBe(true)
        await skip.trigger('click')
        expect(intro.emitted('skip')).toBeTruthy()

        const sources = mount(OnboardingCardView, {
            props: { topic: 'sources', hasDeviceVariants: false },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        expect(sources.find('[data-onboarding-skip]').exists()).toBe(false)
    })

    it('renders DE copy when the locale is de (drift guard sanity)', async () => {
        stubMatchMedia(false)
        const i18n = makeI18n('de')
        const OnboardingCardView = await loadComponent()
        const wrapper = mount(OnboardingCardView, {
            props: { topic: 'intro', hasDeviceVariants: true },
            global: { plugins: [i18n], stubs: { NuxtLink: NuxtLinkStub } },
            attachTo: document.body,
        })
        await flushPromises()
        const title = wrapper.find('[data-onboarding-title="intro"]')
        expect(title.text()).toMatch(/Willkommen/u)
        const skip = wrapper.find('[data-onboarding-skip]')
        expect(skip.text()).toMatch(/überspringen/u)
    })
})

// Avoid unused-import lint when ref is not directly used in this file.
void ref
