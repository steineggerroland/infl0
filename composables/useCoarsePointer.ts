import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Reactive answer to "is this user on a touch / coarse-pointer device?"
 *
 * Onboarding card copy differs on the `intro` card between desktop
 * (keyboard navigation) and mobile (button-driven flip / read-original).
 * The signal is read at render time inside `OnboardingCardView`.
 *
 * Three states:
 * - `null` — unknown yet (SSR, or `matchMedia` has not resolved).
 *   Callers MUST render a placeholder for variant-bearing content
 *   instead of guessing, otherwise the wrong copy flickers in for one
 *   tick and is visually noisy.
 * - `true` — `pointer: coarse` matches (touchscreen, stylus).
 * - `false` — `pointer: coarse` does not match (mouse / trackpad).
 *
 * The choice not to default to `false` is deliberate: a smartphone
 * user briefly seeing the desktop body and then swapping is uglier
 * than briefly seeing a calm DaisyUI skeleton.
 */
export function useCoarsePointer(): Ref<boolean | null> {
    const isCoarse = ref<boolean | null>(null)

    function pickMatchMedia(): MediaQueryList | null {
        if (typeof window === 'undefined') return null
        if (typeof window.matchMedia !== 'function') return null
        return window.matchMedia('(pointer: coarse)')
    }

    let mql: MediaQueryList | null = null
    function onChange(ev: MediaQueryListEvent) {
        isCoarse.value = ev.matches
    }

    onMounted(() => {
        mql = pickMatchMedia()
        if (!mql) {
            isCoarse.value = false
            return
        }
        isCoarse.value = mql.matches
        mql.addEventListener('change', onChange)
    })

    onBeforeUnmount(() => {
        if (mql) {
            mql.removeEventListener('change', onChange)
            mql = null
        }
    })

    return isCoarse
}
