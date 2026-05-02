import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

import { SETTINGS_HUB_DISPLAY_SURFACE_SCROLL_IDS } from '~/utils/settings-hub-display'
import { TIMELINE_SCORE_GROUP_ORDER } from '~/utils/timeline-score-factors'

/** DOM ids used for `/settings` scroll position (coarse ids first; later ids win — see composable loop). */
export const SETTINGS_HUB_SCROLL_SPY_IDS = [
    'display',
    'display-appearance',
    'display-palette',
    'display-typography',
    ...SETTINGS_HUB_DISPLAY_SURFACE_SCROLL_IDS,
    'display-motion',
    'onboarding',
    'sorting',
    ...TIMELINE_SCORE_GROUP_ORDER.map((g) => `sorting-group-${g}`),
    'sorting-formula',
    'tracking',
] as const

/**
 * Picks which settings hub block is “current”: last section whose top edge has
 * passed a band under the sticky bars. Hash links do **not** pin the highlight,
 * otherwise the sidebar stops updating while the fragment stays stale.
 *
 * Idle on `/settings/personalization` and `/settings/privacy`.
 */
export function useSettingsNavSectionSpy(scrollIds: readonly string[]): {
    activeSectionId: Ref<string>
} {
    const route = useRoute()
    const activeSectionId = ref(scrollIds[0] ?? 'display')
    let raf = 0

    function scrollBiasPx(): number {
        if (typeof document === 'undefined') return 104
        try {
            const sticky = document.querySelector(
                '.drawer-content .sticky.top-0',
            ) as HTMLElement | null
            const h = sticky?.getBoundingClientRect().height ?? 0
            return Math.min(160, Math.max(80, Math.round(h + 56)))
        } catch {
            return 104
        }
    }

    function computeActiveFromDocument(): string {
        if (route.path !== '/settings') return scrollIds[0] ?? 'display'
        const bias = scrollBiasPx()
        let active = scrollIds[0] ?? 'display'
        let foundAny = false
        for (const sid of scrollIds) {
            const el = document.getElementById(sid)
            if (!el) continue
            foundAny = true
            if (el.getBoundingClientRect().top <= bias) active = sid
        }
        if (!foundAny) {
            const hid = route.hash.replace(/^#/, '')
            if (hid && scrollIds.includes(hid)) return hid
        }
        return active
    }

    function scheduleUpdate(): void {
        if (typeof window === 'undefined' || route.path !== '/settings') return
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
            raf = 0
            activeSectionId.value = computeActiveFromDocument()
        })
    }

    function onScrollOrResize(): void {
        scheduleUpdate()
    }

    watch(
        () => route.path,
        () => {
            if (route.path === '/settings') scheduleUpdate()
            else activeSectionId.value = scrollIds[0] ?? 'display'
        },
    )

    watch(
        () => route.hash,
        () => {
            if (route.path !== '/settings') return
            void nextTick(() => {
                scheduleUpdate()
            })
        },
    )

    onMounted(() => {
        if (typeof window === 'undefined') return
        window.addEventListener('scroll', onScrollOrResize, { passive: true })
        window.addEventListener('resize', onScrollOrResize, { passive: true })
        if (route.path === '/settings') scheduleUpdate()
    })

    onBeforeUnmount(() => {
        if (typeof window === 'undefined') return
        window.removeEventListener('scroll', onScrollOrResize)
        window.removeEventListener('resize', onScrollOrResize)
        if (raf) cancelAnimationFrame(raf)
        raf = 0
    })

    return { activeSectionId }
}
