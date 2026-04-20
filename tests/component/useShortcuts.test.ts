// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { defineShortcuts } from '../../composables/useShortcuts'

/**
 * The help centre promises: "Shortcuts are active in the timeline as
 * long as no input field is focused." This suite locks that promise
 * into the composable so every caller benefits.
 */

function mountWithShortcut(onKey: (event: KeyboardEvent) => void) {
    const Harness = defineComponent({
        setup() {
            defineShortcuts({ r: onKey })
        },
        render() {
            return h('div')
        },
    })
    return mount(Harness, { attachTo: document.body })
}

describe('defineShortcuts editable-target guard', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('fires when the key is pressed on a non-editable target', () => {
        const handler = vi.fn()
        const wrapper = mountWithShortcut(handler)

        const div = document.createElement('div')
        document.body.appendChild(div)
        div.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }))

        expect(handler).toHaveBeenCalledOnce()
        wrapper.unmount()
    })

    it('does NOT fire when the user is typing in an <input>', () => {
        const handler = vi.fn()
        const wrapper = mountWithShortcut(handler)

        const input = document.createElement('input')
        document.body.appendChild(input)
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }))

        expect(handler).not.toHaveBeenCalled()
        wrapper.unmount()
    })

    it('does NOT fire when the user is typing in a <textarea>', () => {
        const handler = vi.fn()
        const wrapper = mountWithShortcut(handler)

        const textarea = document.createElement('textarea')
        document.body.appendChild(textarea)
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }))

        expect(handler).not.toHaveBeenCalled()
        wrapper.unmount()
    })

    it('does NOT fire when the user is typing inside a contenteditable region', () => {
        const handler = vi.fn()
        const wrapper = mountWithShortcut(handler)

        const host = document.createElement('div')
        host.setAttribute('contenteditable', 'true')
        const inner = document.createElement('span')
        host.appendChild(inner)
        document.body.appendChild(host)
        inner.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }))

        expect(handler).not.toHaveBeenCalled()
        wrapper.unmount()
    })

    // Regression: on Safari/Chrome `Cmd+R` reloads the page, on Windows/Linux
    // it is `Ctrl+R`. Without a modifier guard our `r` shortcut still fired on
    // the way to the reload, toggled `showRead`, persisted the flipped value
    // to localStorage, and every reload visibly flipped the timeline filter.
    // A shortcut is only a shortcut when it is pressed *on its own* — chords
    // with `Ctrl`, `Meta`, or `Alt` belong to the browser or OS.
    const modifierCases: Array<{ name: string; init: KeyboardEventInit }> = [
        { name: 'Meta (Cmd on macOS)', init: { key: 'r', metaKey: true, bubbles: true } },
        { name: 'Ctrl', init: { key: 'r', ctrlKey: true, bubbles: true } },
        { name: 'Alt', init: { key: 'r', altKey: true, bubbles: true } },
    ]

    it.each(modifierCases)(
        'does NOT fire when the user presses $name + the shortcut key',
        ({ init }) => {
            const handler = vi.fn()
            const wrapper = mountWithShortcut(handler)

            const div = document.createElement('div')
            document.body.appendChild(div)
            div.dispatchEvent(new KeyboardEvent('keydown', init))

            expect(handler).not.toHaveBeenCalled()
            wrapper.unmount()
        },
    )

    it('still fires when Shift alone is held (covers caps-locked layouts)', () => {
        const handler = vi.fn()
        const wrapper = mountWithShortcut(handler)

        const div = document.createElement('div')
        document.body.appendChild(div)
        div.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'R', shiftKey: true, bubbles: true }),
        )

        // Shift is a pure casing modifier, not a chord. The user is still
        // "just pressing r" from a keyboard-shortcut perspective.
        expect(handler).toHaveBeenCalledOnce()
        wrapper.unmount()
    })
})

// `when` lets a caller scope a shortcut group to a piece of reactive state
// (e.g. "only when no modal is open"). The callback is evaluated on every
// keypress so the scope can follow changing UI state without re-registering
// listeners. This is the core mechanism that stops the timeline `w`/`s`
// navigation from fighting a full-text article modal for focus.
describe('defineShortcuts when-scope', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    function mountWithScope(onKey: () => void, active: { value: boolean }) {
        const Harness = defineComponent({
            setup() {
                defineShortcuts({ w: onKey }, { when: () => active.value })
            },
            render() {
                return h('div')
            },
        })
        return mount(Harness, { attachTo: document.body })
    }

    it('suppresses the handler while the scope predicate returns false', () => {
        const handler = vi.fn()
        const active = ref(false)
        const wrapper = mountWithScope(handler, active)

        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'w', bubbles: true }),
        )

        expect(handler).not.toHaveBeenCalled()
        wrapper.unmount()
    })

    it('fires the handler while the scope predicate returns true', () => {
        const handler = vi.fn()
        const active = ref(true)
        const wrapper = mountWithScope(handler, active)

        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'w', bubbles: true }),
        )

        expect(handler).toHaveBeenCalledOnce()
        wrapper.unmount()
    })

    it('re-evaluates the scope predicate between keypresses', () => {
        const handler = vi.fn()
        const active = ref(true)
        const wrapper = mountWithScope(handler, active)

        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'w', bubbles: true }),
        )
        active.value = false
        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'w', bubbles: true }),
        )
        active.value = true
        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'w', bubbles: true }),
        )

        expect(handler).toHaveBeenCalledTimes(2)
        wrapper.unmount()
    })
})

// `skipEditableTarget` is the narrow escape hatch used by dismissal
// shortcuts inside popovers/modals: an `Escape` must always close the
// surrounding dialog even when a form control inside it holds focus.
// The hatch is deliberately *not* available per-key — a caller that
// needs it takes responsibility for the whole group.
describe('defineShortcuts skipEditableTarget', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    function mountWithSkip(onKey: (event: KeyboardEvent) => void) {
        const Harness = defineComponent({
            setup() {
                defineShortcuts({ escape: onKey }, { skipEditableTarget: true })
            },
            render() {
                return h('div')
            },
        })
        return mount(Harness, { attachTo: document.body })
    }

    it('fires inside an <input> when the group opts in', () => {
        const handler = vi.fn()
        const wrapper = mountWithSkip(handler)

        const input = document.createElement('input')
        document.body.appendChild(input)
        input.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        )

        expect(handler).toHaveBeenCalledOnce()
        wrapper.unmount()
    })

    it('still blocks modifier chords even with skipEditableTarget', () => {
        const handler = vi.fn()
        const wrapper = mountWithSkip(handler)

        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', metaKey: true, bubbles: true }),
        )

        expect(handler).not.toHaveBeenCalled()
        wrapper.unmount()
    })
})
