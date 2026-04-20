import { computed, onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * Global "is any dismissable overlay currently open?" counter.
 *
 * Why this exists: background keyboard shortcuts (timeline `w`/`s`
 * navigation, global `r` toggle) must yield control to any modal-like
 * surface – otherwise pressing navigation keys while a full-text
 * article or an `InfoPopover` is open silently changes the content
 * underneath. The surface no longer matches what the user is reading
 * and the interaction feels broken.
 *
 * A plain counter (rather than an id-based stack) is enough for today
 * because we only need the boolean "any open?". The API is shaped so
 * we can promote it to a proper stack later without breaking callers.
 *
 * Usage:
 *   const { anyOpen } = useModalStack()
 *   defineShortcuts({ w: gotoPrev }, { when: () => !anyOpen.value })
 *
 * For components that own a modal, prefer `useModalStackRegistration`
 * below – it binds push/release to a reactive `isOpen` ref and
 * releases on unmount so a mid-modal route change cannot leak a
 * phantom entry.
 *
 * See `tests/component/useModalStack.test.ts` for the full contract.
 */
export function useModalStack() {
    const count = useState<number>('modalStack.count', () => 0)
    const anyOpen = computed(() => count.value > 0)

    function push(): () => void {
        count.value += 1
        let released = false
        return () => {
            if (released) return
            released = true
            count.value = Math.max(0, count.value - 1)
        }
    }

    return { anyOpen, push }
}

/**
 * Bind the stack registration to a reactive "is open" boolean.
 *
 * Registers on open, releases on close, and releases once more on
 * unmount so a component that is torn down while its modal is still
 * open cannot leak a phantom entry into the counter.
 */
export function useModalStackRegistration(isOpen: Ref<boolean>): void {
    const { push } = useModalStack()
    let release: (() => void) | null = null

    function sync(open: boolean) {
        if (open && !release) {
            release = push()
        } else if (!open && release) {
            release()
            release = null
        }
    }

    watch(isOpen, sync, { immediate: true })

    onBeforeUnmount(() => {
        release?.()
        release = null
    })
}
