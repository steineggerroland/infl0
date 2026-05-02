import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/**
 * Sections on **`/settings`** only (appearance, onboarding, sorting, tracking).
 * “Why at the top?” and Privacy stay separate routes with their own menu entries.
 */
export const SETTINGS_HUB_SECTION_IDS = [
    'display',
    'onboarding',
    'sorting',
    'tracking',
] as const

export type SettingsHubSectionId = (typeof SETTINGS_HUB_SECTION_IDS)[number]

/**
 * Highlights the hub section overlapping the viewport “reading band”.
 * Idle on other settings routes (`/settings/personalization`, `/settings/privacy`).
 */
export function useSettingsNavSectionSpy(sectionIds: readonly string[]): {
    activeSectionId: Ref<string>
} {
    const route = useRoute()
    const activeSectionId = ref(sectionIds[0] ?? '')
    let observer: IntersectionObserver | null = null

    function syncHashToActive(): void {
        if (route.path !== '/settings') return
        const id = route.hash.replace(/^#/, '')
        if (id && sectionIds.includes(id)) activeSectionId.value = id
    }

    watch(() => route.hash, syncHashToActive, { immediate: true })

    watch(
        () => route.path,
        () => {
            syncHashToActive()
            bindObserver()
        },
    )

    function bindObserver(): void {
        observer?.disconnect()
        observer = null
        if (!import.meta.client || route.path !== '/settings') return

        observer = new IntersectionObserver(
            (entries) => {
                let bestIdx = Infinity
                for (const e of entries) {
                    if (!e.isIntersecting) continue
                    const sid = (e.target as HTMLElement).id
                    const idx = sectionIds.indexOf(sid)
                    if (idx !== -1 && idx < bestIdx) bestIdx = idx
                }
                if (bestIdx !== Infinity) {
                    activeSectionId.value = sectionIds[bestIdx]!
                }
            },
            {
                root: null,
                rootMargin: '-42% 0px -42% 0px',
                threshold: 0,
            },
        )

        for (const sid of sectionIds) {
            const el = document.getElementById(sid)
            if (el) observer.observe(el)
        }

        queueMicrotask(syncHashToActive)
    }

    onMounted(() => bindObserver())

    onBeforeUnmount(() => {
        observer?.disconnect()
        observer = null
    })

    return { activeSectionId }
}
