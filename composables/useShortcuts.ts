import { onMounted, onUnmounted } from 'vue'
import { isEditableTarget } from '~/utils/editable-target'

type ShortcutHandler = (event: KeyboardEvent) => void

interface ShortcutDefinition {
    [key: string]: ShortcutHandler
}

/**
 * Register a keyboard-shortcut map for the current component.
 *
 * Contract:
 * - Shortcuts do **not** fire while a text-entry surface is focused
 *   (`<input>`, `<textarea>`, `<select>`, `[contenteditable]`). This
 *   matches the promise made in the help centre ("active as long as no
 *   input field is focused") and protects users from accidentally
 *   triggering global actions while typing.
 * - Shortcuts only fire when the key is pressed **on its own**. Chords
 *   with `Ctrl`, `Meta`, or `Alt` are reserved for the browser and OS
 *   (e.g. `Cmd+R` / `Ctrl+R` for page reload, `Alt+Left` for back).
 *   Swallowing them would silently fight user expectations and, in the
 *   concrete case of the timeline, caused the `showRead` preference to
 *   flip on every reload. `Shift` is allowed because it is a casing
 *   modifier, not a chord (caps-lock or natural capitalisation).
 *
 * See `utils/editable-target.ts` for the editable-surface rule and
 * `tests/component/useShortcuts.test.ts` for the full contract.
 *
 * @param shortcuts Object mapping keys (case-insensitive) to handlers.
 */
export function defineShortcuts(shortcuts: ShortcutDefinition) {
    function handleKeyPress(event: KeyboardEvent) {
        if (isEditableTarget(event.target)) return
        if (event.ctrlKey || event.metaKey || event.altKey) return
        const key = event.key.toLowerCase()
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
