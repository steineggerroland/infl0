import { onMounted, onUnmounted } from 'vue'
import { isEditableTarget } from '~/utils/editable-target'

type ShortcutHandler = (event: KeyboardEvent) => void

interface ShortcutDefinition {
    [key: string]: ShortcutHandler
}

/**
 * Options controlling when and where a shortcut group is active.
 *
 * `when` scopes the whole group to a reactive predicate. It is evaluated
 * on every keypress, so the scope can follow changing UI state (e.g.
 * "only while no modal is open") without re-registering listeners.
 *
 * `skipEditableTarget` is a narrow escape hatch for dismissal keys such
 * as `Escape` inside popovers/modals, where the key must fire even when
 * a form control inside the surface holds focus. Avoid it for anything
 * that is not a universally safe dismissal.
 */
export interface ShortcutOptions {
    when?: () => boolean
    skipEditableTarget?: boolean
}

/**
 * Register a keyboard-shortcut map for the current component.
 *
 * Contract:
 * - Shortcuts do **not** fire while a text-entry surface is focused
 *   (`<input>`, `<textarea>`, `<select>`, `[contenteditable]`). This
 *   matches the promise made in the help centre ("active as long as no
 *   input field is focused") and protects users from accidentally
 *   triggering global actions while typing. `skipEditableTarget` opts
 *   out for dismissal keys such as `Escape`.
 * - Unmodified single-key shortcuts must be pressed **alone**: chords with
 *   `Ctrl` or `Meta` never fire, so the browser can keep e.g. reload or back.
 *   **Explicit** `alt+{key}` and `shift+{key}` entries are allowed (without
 *   Ctrl/Meta). The editable guard still applies. If a `shift+{key}` entry
 *   exists, it is tried first while `shiftKey` is set; if none exist for that
 *   key, a plain `{key}` handler still runs (so `r` and `Shift+R` both match
 *   `r` when there is no `shift+r` map — legacy casing).
 * - A `when` predicate scopes the group to a reactive condition. Use it
 *   to yield keyboard control to a higher surface — e.g. the timeline
 *   `w`/`s` navigation must be silent while a full-text article modal
 *   is open, otherwise the background article drifts away from the
 *   content the user is actually reading.
 *
 * See `utils/editable-target.ts` for the editable-surface rule and
 * `tests/component/useShortcuts.test.ts` for the full contract.
 *
 * @param shortcuts Object mapping keys (case-insensitive) to handlers.
 * @param options   Optional scoping and editable-target override.
 */
export function defineShortcuts(
    shortcuts: ShortcutDefinition,
    options: ShortcutOptions = {},
) {
    function handleKeyPress(event: KeyboardEvent) {
        if (options.when && !options.when()) return
        if (!options.skipEditableTarget && isEditableTarget(event.target)) return
        if (event.ctrlKey || event.metaKey) return

        const key = event.key.toLowerCase()

        if (event.altKey) {
            const comb = `alt+${key}`
            if (shortcuts[comb]) {
                shortcuts[comb](event)
            }
            return
        }

        if (event.shiftKey) {
            const scomb = `shift+${key}`
            if (shortcuts[scomb]) {
                shortcuts[scomb](event)
                return
            }
        }

        if (shortcuts[key]) {
            shortcuts[key](event)
        }
    }

    onMounted(() => {
        document.addEventListener('keydown', handleKeyPress)
    })

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeyPress)
    })
}
