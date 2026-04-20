/**
 * True when the event target is a text-entry surface where global
 * keyboard shortcuts must not fire.
 *
 * The help centre documents shortcuts as "active in the timeline as
 * long as no input field is focused". This helper is the authoritative
 * implementation of that sentence and is reused by `defineShortcuts`.
 *
 * Covered surfaces:
 * - `<input>` of any type (we err on the side of caution — blocking a
 *   shortcut on a checkbox is better than swallowing a user's text).
 * - `<textarea>` and `<select>`.
 * - Anything inside a `contenteditable` region (inheritance handled
 *   for free by `HTMLElement.isContentEditable`).
 *
 * Anything else — plain containers, buttons, links — is considered a
 * safe target for shortcuts.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    if (target.isContentEditable) return true
    const tag = target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}
