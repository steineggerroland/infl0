/**
 * Pure helpers for the timeline-related user preferences.
 *
 * The Nuxt composable `useTimelinePreferences` wraps these with
 * reactive state and the browser `localStorage` side-effects. Keeping
 * the parse / serialize logic here means we can unit-test the
 * on-disk format without booting Nuxt or a DOM.
 */

/** localStorage key used by the Nuxt composable. Exported so tests can
 * assert that the value on disk stays stable across releases. */
export const TIMELINE_SHOW_READ_STORAGE_KEY = 'infl0.timeline.showRead'

/**
 * Decode the raw value that was written to `localStorage`.
 *
 * Returns `null` when the stored value is missing or in an unexpected
 * shape so callers can fall back to their default — this is safer than
 * silently coercing "true"/"false" strings to booleans.
 */
export function parseStoredShowRead(raw: string | null): boolean | null {
    if (raw === '1') return true
    if (raw === '0') return false
    return null
}

/** Encode the preference for `localStorage`. Mirrors `parseStoredShowRead`. */
export function serializeShowRead(value: boolean): '1' | '0' {
    return value ? '1' : '0'
}
