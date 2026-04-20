// @vitest-environment happy-dom
import { resetNuxtTestState } from '../_helpers/nuxt-globals'

import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import {
    useModalStack,
    useModalStackRegistration,
} from '../../composables/useModalStack'

/**
 * The modal stack is the single source of truth for "is any dismissable
 * overlay currently open". Background shortcuts (timeline `w`/`s`,
 * global `r`) subscribe to it via `defineShortcuts({..}, { when: ... })`
 * so opening a full-text article or an `InfoPopover` cleanly mutes the
 * keys that would otherwise scroll the page underneath.
 *
 * The stack is a counter, not a list – we only need "any open?" today.
 * Promoting it to a proper id-based stack would be a drop-in change
 * the day we need per-modal priorities (e.g. nested overlays).
 */

describe('useModalStack counter', () => {
    beforeEach(() => {
        resetNuxtTestState()
    })

    it('starts empty', () => {
        const { anyOpen } = useModalStack()
        expect(anyOpen.value).toBe(false)
    })

    it('flips anyOpen true on push and back to false on release', () => {
        const { anyOpen, push } = useModalStack()

        const release = push()
        expect(anyOpen.value).toBe(true)

        release()
        expect(anyOpen.value).toBe(false)
    })

    it('tracks multiple concurrent pushes independently', () => {
        const { anyOpen, push } = useModalStack()

        const releaseA = push()
        const releaseB = push()
        expect(anyOpen.value).toBe(true)

        releaseA()
        // B is still open, so the stack is still "any open".
        expect(anyOpen.value).toBe(true)

        releaseB()
        expect(anyOpen.value).toBe(false)
    })

    it('is safe against double-release (idempotent)', () => {
        const { anyOpen, push } = useModalStack()

        const release = push()
        release()
        release()

        expect(anyOpen.value).toBe(false)
    })

    it('never dips below zero even on a stray release', () => {
        const { anyOpen, push } = useModalStack()

        const release = push()
        release()
        release()

        const fresh = push()
        expect(anyOpen.value).toBe(true)
        fresh()
        expect(anyOpen.value).toBe(false)
    })

    it('shares the same counter across separate composable calls', () => {
        const a = useModalStack()
        const b = useModalStack()

        const release = a.push()
        expect(b.anyOpen.value).toBe(true)
        release()
        expect(b.anyOpen.value).toBe(false)
    })
})

describe('useModalStackRegistration', () => {
    beforeEach(() => {
        resetNuxtTestState()
    })

    function mountWithOpenRef(openRef: Ref<boolean>) {
        const Harness = defineComponent({
            setup() {
                useModalStackRegistration(openRef)
            },
            render() {
                return h('div')
            },
        })
        return mount(Harness)
    }

    it('registers on mount when the modal starts open', () => {
        const { anyOpen } = useModalStack()
        const open = ref(true)

        const wrapper = mountWithOpenRef(open)
        expect(anyOpen.value).toBe(true)

        wrapper.unmount()
    })

    it('does not register when the modal starts closed', () => {
        const { anyOpen } = useModalStack()
        const open = ref(false)

        const wrapper = mountWithOpenRef(open)
        expect(anyOpen.value).toBe(false)

        wrapper.unmount()
    })

    it('follows the ref as it toggles open and closed', async () => {
        const { anyOpen } = useModalStack()
        const open = ref(false)

        const wrapper = mountWithOpenRef(open)

        open.value = true
        await wrapper.vm.$nextTick()
        expect(anyOpen.value).toBe(true)

        open.value = false
        await wrapper.vm.$nextTick()
        expect(anyOpen.value).toBe(false)

        wrapper.unmount()
    })

    it('auto-releases when the owning component unmounts while still open', () => {
        // Guards against phantom entries: if a modal-owning component is
        // torn down by a route change without an explicit close, the
        // counter must not stay pinned above zero forever.
        const { anyOpen } = useModalStack()
        const open = ref(true)

        const wrapper = mountWithOpenRef(open)
        expect(anyOpen.value).toBe(true)

        wrapper.unmount()
        expect(anyOpen.value).toBe(false)
    })
})
