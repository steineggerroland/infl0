<script setup lang="ts">
/**
 * Settings layout: DaisyUI drawer + scrollspy **only on `/settings`** (the long
 * hub). `/settings/personalization` and `/settings/privacy` render full-width
 * content without section anchor navigation.
 */
import { TIMELINE_SCORE_GROUP_ORDER } from '~/utils/timeline-score-factors'

import {
    SETTINGS_HUB_SCROLL_SPY_IDS,
    useSettingsNavSectionSpy,
} from '~/composables/useSettingsNavSectionSpy'

const { t } = useI18n()
const route = useRoute()

const isSettingsHubPage = computed(() => route.path === '/settings')

type HubNavEntry = {
    hash: string
    testId: string
    labelKey: string
    nested?: boolean
}

type FooterMeta = true | { containerMax?: 'lg' | '4xl'; testId?: string }

const footerMeta = computed<FooterMeta | undefined>(() => {
    const raw = route.meta.appFooter as unknown
    if (raw === true) return true
    if (raw && typeof raw === 'object') return raw as FooterMeta
    return undefined
})

const footerContainerMax = computed<'lg' | '4xl'>(() => {
    const m = footerMeta.value
    if (m && typeof m === 'object' && m.containerMax) return m.containerMax
    return 'lg'
})

const footerTestId = computed<string>(() => {
    const m = footerMeta.value
    if (m && typeof m === 'object' && m.testId) return m.testId
    return 'app-footer-shortcuts'
})

const { activeSectionId } = useSettingsNavSectionSpy([...SETTINGS_HUB_SCROLL_SPY_IDS])

const hubNavEntries = computed<HubNavEntry[]>(() => {
    const rows: HubNavEntry[] = [
        {
            hash: 'display',
            testId: 'settings-nav-link-display',
            labelKey: 'settingsDisplay.heading',
        },
        {
            hash: 'onboarding',
            testId: 'settings-nav-link-onboarding',
            labelKey: 'settingsIndex.onboardingHeading',
        },
        {
            hash: 'sorting',
            testId: 'settings-nav-link-sorting',
            labelKey: 'settingsTimeline.title',
        },
    ]
    for (const g of TIMELINE_SCORE_GROUP_ORDER) {
        rows.push({
            hash: `sorting-group-${g}`,
            testId: `settings-nav-link-sort-group-${g}`,
            labelKey: `settingsTimeline.groups.${g}`,
            nested: true,
        })
    }
    rows.push({
        hash: 'sorting-formula',
        testId: 'settings-nav-link-sort-formula',
        labelKey: 'settingsTimeline.formulaTitle',
        nested: true,
    })
    rows.push({
        hash: 'tracking',
        testId: 'settings-nav-link-tracking',
        labelKey: 'settingsIndex.trackingHeading',
    })
    return rows
})

function navLiActive(item: HubNavEntry): boolean {
    if (route.path !== '/settings') return false
    const cur = activeSectionId.value
    if (item.hash === 'sorting') return cur === 'sorting'
    return cur === item.hash
}

function navAriaCurrent(item: HubNavEntry): 'location' | undefined {
    if (route.path !== '/settings') return undefined
    const cur = activeSectionId.value
    if (item.hash === 'sorting') return cur === 'sorting' ? 'location' : undefined
    return cur === item.hash ? 'location' : undefined
}

function closeDrawerOnNarrow() {
    if (!import.meta.client) return
    if (window.matchMedia('(min-width: 1024px)').matches) return
    const el = document.getElementById('settings-nav-drawer') as HTMLInputElement | null
    if (el) el.checked = false
}

watch(
    () => route.fullPath,
    () => closeDrawerOnNarrow(),
)

</script>

<template>
    <div class="relative min-h-dvh infl0-page-shell">
        <a
            href="#main"
            class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900 focus:shadow"
        >
            {{ t('common.skipToMain') }}
        </a>

        <main id="main" tabindex="-1" class="outline-none">
            <div v-if="isSettingsHubPage" class="drawer lg:drawer-open">
                <input id="settings-nav-drawer" type="checkbox" class="drawer-toggle" >
                <div class="drawer-content min-w-0 bg-[var(--infl0-app-bg)]">
                    <div
                        class="sticky top-0 z-40 flex justify-end border-b border-[var(--infl0-panel-border)] bg-[var(--infl0-app-bg)]/95 px-3 py-2 backdrop-blur lg:hidden"
                    >
                        <label
                            for="settings-nav-drawer"
                            class="btn btn-sm btn-outline border-[var(--infl0-field-border)]"
                            data-testid="settings-nav-drawer-toggle"
                        >
                            {{ t('settingsNav.openSections') }}
                        </label>
                    </div>
                    <slot />
                </div>
                <div class="drawer-side z-50 border-[var(--infl0-panel-border)] lg:border-e">
                    <label
                        for="settings-nav-drawer"
                        :aria-label="t('settingsNav.closeDrawer')"
                        class="drawer-overlay lg:hidden"
                    />
                    <nav
                        class="min-h-full w-72 max-w-[85vw] gap-2 bg-[var(--infl0-panel-bg)] px-3 py-4 lg:bg-[var(--infl0-app-bg)]"
                        :aria-label="t('settingsNav.landmark')"
                        data-testid="settings-nav-sidebar"
                    >
                        <ul class="settings-hub-sidebar-menu menu menu-sm w-full gap-0 rounded-box p-0">
                            <li
                                v-for="item in hubNavEntries"
                                :key="item.hash"
                                :class="[
                                    { active: navLiActive(item) },
                                    item.nested
                                        ? 'ms-0.5 border-s border-[var(--infl0-panel-border)] ps-2.5'
                                        : '',
                                ]"
                            >
                                <NuxtLink
                                    :to="`/settings#${item.hash}`"
                                    :data-testid="item.testId"
                                    :aria-current="navAriaCurrent(item)"
                                    exact-active-class=""
                                    active-class=""
                                    :class="[
                                        'no-underline',
                                        item.nested ? 'text-[0.8125rem] leading-snug' : '',
                                    ]"
                                    @click="closeDrawerOnNarrow"
                                >
                                    {{ t(item.labelKey) }}
                                </NuxtLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
            <div
                v-else
                class="min-w-0 bg-[var(--infl0-app-bg)]"
            >
                <slot />
            </div>
        </main>

        <AppFooterShortcuts
            v-if="footerMeta"
            :container-max="footerContainerMax"
            :test-id="footerTestId"
        />

        <Teleport to="body">
            <header class="pointer-events-none fixed end-3 top-3 z-[500] flex justify-end">
                <div class="pointer-events-auto">
                    <AppUserMenu />
                </div>
            </header>
        </Teleport>
    </div>
</template>
