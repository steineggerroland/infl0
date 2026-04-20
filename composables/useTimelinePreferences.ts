import {
    TIMELINE_SHOW_READ_STORAGE_KEY,
    parseStoredShowRead,
    serializeShowRead,
} from '~/utils/timeline-preferences'

/**
 * User preferences that change how the timeline is rendered.
 *
 * Shared across the timeline page and the app-level menu so both the
 * main view and the "View" section in `AppUserMenu` stay in sync. The
 * value is persisted to `localStorage` so the preference survives
 * reloads (SSR-safe: hydration happens once on the client).
 *
 * The pure read/write helpers live in `utils/timeline-preferences.ts`
 * and are unit-tested there; this composable is the thin Nuxt wrapper.
 *
 * Lifecycle note: persistence is implemented with a writable `computed`
 * setter, **not** with `watch()`. A `watch()` inside a composable
 * inherits the current effect scope, which is the calling component's
 * – meaning it gets torn down on unmount and never re-registers because
 * the `hydrated` guard stays set. A writable computed is independent of
 * any component's lifecycle and keeps writing to `localStorage` for the
 * lifetime of the app. Covered by the mount/unmount/remount regression
 * test in `tests/component/useTimelinePreferences.test.ts`.
 */
export function useTimelinePreferences() {
    const internal = useState<boolean>('timeline.showRead', () => false)
    const hydrated = useState<boolean>('timeline.showRead.hydrated', () => false)

    // SSR-safe: only run on the client. A plain `typeof window` check
    // keeps the composable framework-neutral (works under Nuxt, Vitest
    // + happy-dom, and pure Node).
    const isClient = typeof window !== 'undefined'

    if (isClient && !hydrated.value) {
        hydrated.value = true
        try {
            const stored = parseStoredShowRead(
                window.localStorage.getItem(TIMELINE_SHOW_READ_STORAGE_KEY),
            )
            if (stored !== null) internal.value = stored
        } catch {
            // Private mode or a host without `localStorage` — fall back to
            // the in-memory default silently.
        }
    }

    function persist(value: boolean): void {
        if (!isClient) return
        try {
            window.localStorage.setItem(
                TIMELINE_SHOW_READ_STORAGE_KEY,
                serializeShowRead(value),
            )
        } catch {
            /* see above */
        }
    }

    const showRead = computed<boolean>({
        get: () => internal.value,
        set: (next) => {
            if (internal.value === next) return
            internal.value = next
            persist(next)
        },
    })

    function toggleShowRead(): void {
        showRead.value = !showRead.value
    }

    return { showRead, toggleShowRead }
}
