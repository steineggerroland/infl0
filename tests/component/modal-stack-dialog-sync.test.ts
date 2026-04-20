// @vitest-environment happy-dom
import { resetNuxtTestState } from '../_helpers/nuxt-globals'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import {
    useModalStack,
    useModalStackRegistration,
} from '../../composables/useModalStack'

/**
 * Reviewer-flagged regression (Sprint 6.1).
 *
 * `<dialog>` has **three** native close paths that never run through
 * component script: pressing `Escape`, clicking the backdrop, and
 * activating a `<button>` inside a `<form method="dialog">`. All three
 * just dispatch a `close` event on the element (preceded by `cancel`
 * for the Escape case). A component that registers its `<dialog>` with
 * `useModalStackRegistration(isOpen)` but forgets to mirror the
 * element's `close` event back into `isOpen` silently desynchronises:
 *
 * - the `<dialog>` is closed (`.open === false`),
 * - `isOpen.value` stays `true`,
 * - `anyOpen.value` stays `true`,
 * - every background shortcut gated on `!anyOpen.value` (timeline
 *   `w/s`, `r`, arrow keys, card-flip `e`) stays muted forever.
 *
 * This is exactly the bug the reviewer hit in `ArticleView.vue`. The
 * test below mounts the *same wiring pattern* ArticleView now uses
 * (`ref="modal"` + `@close`/`@cancel` bound to an `isOpen = false`
 * handler + stack registration) and pins it end-to-end in happy-dom
 * so regressions trip a real test rather than the user's reload.
 *
 * The harness is deliberately minimal – it imports nothing from
 * ArticleView so the test stays readable and is not dragged into
 * ArticleView's unrelated render concerns. The invariant under test
 * is the *wiring contract*, which ArticleView must follow verbatim.
 */

function createDialogHarness() {
    return defineComponent({
        setup() {
            const isOpen = ref(false)
            const dlg = ref<HTMLDialogElement | null>(null)

            useModalStackRegistration(isOpen)

            function open() {
                dlg.value?.showModal()
                isOpen.value = true
            }

            function closeProgrammatically() {
                dlg.value?.close()
                // Intentionally no direct `isOpen.value = false` here –
                // the `close` event handler below is the single writer.
            }

            function onDialogClose() {
                isOpen.value = false
            }

            return { isOpen, dlg, open, closeProgrammatically, onDialogClose }
        },
        render() {
            return h('div', [
                h('button', { onClick: this.open, 'data-testid': 'open' }, 'open'),
                h('button', { onClick: this.closeProgrammatically, 'data-testid': 'close' }, 'close'),
                h(
                    'dialog',
                    {
                        ref: 'dlg',
                        'data-testid': 'dlg',
                        onClose: this.onDialogClose,
                        onCancel: this.onDialogClose,
                    },
                    [h('p', 'body')],
                ),
            ])
        },
    })
}

describe('modal-stack + <dialog> close sync', () => {
    beforeEach(() => {
        resetNuxtTestState()
        document.body.innerHTML = ''
    })
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('registers with the stack when the dialog opens', async () => {
        const { anyOpen } = useModalStack()
        const Harness = createDialogHarness()
        const wrapper = mount(Harness, { attachTo: document.body })

        expect(anyOpen.value).toBe(false)

        await wrapper.get('[data-testid="open"]').trigger('click')

        expect(anyOpen.value).toBe(true)
        wrapper.unmount()
    })

    it('releases the stack when the dialog is closed programmatically', async () => {
        const { anyOpen } = useModalStack()
        const Harness = createDialogHarness()
        const wrapper = mount(Harness, { attachTo: document.body })

        await wrapper.get('[data-testid="open"]').trigger('click')
        expect(anyOpen.value).toBe(true)

        await wrapper.get('[data-testid="close"]').trigger('click')
        await nextTick()

        expect(anyOpen.value).toBe(false)
        wrapper.unmount()
    })

    it('releases the stack when the user dismisses the dialog natively (close event)', async () => {
        // The browser dispatches a `close` event for *every* dismissal:
        // Escape, backdrop click, and `<form method="dialog">` submit
        // all end up here. Mirroring that one event is what keeps the
        // stack in sync.
        const { anyOpen } = useModalStack()
        const Harness = createDialogHarness()
        const wrapper = mount(Harness, { attachTo: document.body })

        await wrapper.get('[data-testid="open"]').trigger('click')
        expect(anyOpen.value).toBe(true)

        const dlg = wrapper.get('[data-testid="dlg"]').element as HTMLDialogElement
        dlg.dispatchEvent(new Event('close'))
        await nextTick()

        expect(anyOpen.value).toBe(false)
        wrapper.unmount()
    })

    it('also releases on the cancel event (Escape path in spec order)', async () => {
        // Per WHATWG, Escape on an open `<dialog>` fires `cancel`
        // first, then `close`. Some browsers historically fired only
        // `cancel` in edge cases; binding both keeps the stack in
        // sync no matter which event the platform chooses to emit.
        const { anyOpen } = useModalStack()
        const Harness = createDialogHarness()
        const wrapper = mount(Harness, { attachTo: document.body })

        await wrapper.get('[data-testid="open"]').trigger('click')
        expect(anyOpen.value).toBe(true)

        const dlg = wrapper.get('[data-testid="dlg"]').element as HTMLDialogElement
        dlg.dispatchEvent(new Event('cancel'))
        await nextTick()

        expect(anyOpen.value).toBe(false)
        wrapper.unmount()
    })

    it('keeps background shortcuts active again after the dialog is dismissed', async () => {
        // The end-to-end promise: gating a shortcut on
        // `!anyOpen.value` must flip back from "muted" to "active"
        // after the dialog is closed via any path. This is the
        // user-visible consequence of the fix – before Sprint 6.1
        // the gating stayed muted because the stack never released.
        const { anyOpen } = useModalStack()
        const Harness = createDialogHarness()
        const wrapper = mount(Harness, { attachTo: document.body })

        await wrapper.get('[data-testid="open"]').trigger('click')
        expect(anyOpen.value).toBe(true)

        const dlg = wrapper.get('[data-testid="dlg"]').element as HTMLDialogElement
        dlg.dispatchEvent(new Event('close'))
        await nextTick()

        expect(anyOpen.value).toBe(false)

        // Reopen/redismiss must still work – no leftover stale state.
        await wrapper.get('[data-testid="open"]').trigger('click')
        expect(anyOpen.value).toBe(true)
        dlg.dispatchEvent(new Event('close'))
        await nextTick()
        expect(anyOpen.value).toBe(false)

        wrapper.unmount()
    })
})
