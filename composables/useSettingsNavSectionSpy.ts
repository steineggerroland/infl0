import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/** Sidebar targets on `/settings` (DOM section `id`s). */
export const SETTINGS_NAV_SECTION_IDS = [
    'display',
    'onboarding',
    'sorting',
    'tracking',
    'personalization',
    'privacy',
] as const

export type SettingsNavSectionId = (typeof SETTINGS_NAV_SECTION_IDS)[number]

/**
 * Highlights the nearest settings section overlapping the viewport “reading
 * band”. Hash navigation updates the highlight immediately when the sidebar
 * is used; scrolling then keeps the Daisy `menu active` marker in sync.
 */
export function useSettingsNavSectionSpy(sectionIds: readonly string[]): {
    activeSectionId: Ref<string>
} {
    const route = useRoute()
    const activeSectionId = ref(sectionIds[0] ?? '')
    let observer: IntersectionObserver | null = null

    watch(
        () => route.hash,
        (hash) => {
            const id = hash.replace(/^#/, '')
            if (id && sectionIds.includes(id)) activeSectionId.value = id
        },
        { immediate: true },
    )

    onMounted(() => {
        if (!import.meta.client) return

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

        queueMicrotask(() => {
            const h = route.hash.replace(/^#/, '')
            if (h && sectionIds.includes(h)) activeSectionId.value = h
        })
    })

    onBeforeUnmount(() => {
        observer?.disconnect()
        observer = null
    })

    return { activeSectionId }
}
