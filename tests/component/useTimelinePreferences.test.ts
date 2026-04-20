// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { resetNuxtTestState } from '../_helpers/nuxt-globals'
import { TIMELINE_SHOW_READ_STORAGE_KEY } from '../../utils/timeline-preferences'
import { useTimelinePreferences } from '../../composables/useTimelinePreferences'

describe('useTimelinePreferences', () => {
    beforeEach(() => {
        resetNuxtTestState()
        window.localStorage.clear()
    })

    afterEach(() => {
        window.localStorage.clear()
    })

    it('defaults to "hide read articles"', () => {
        const { showRead } = useTimelinePreferences()
        expect(showRead.value).toBe(false)
    })

    it('hydrates from localStorage on first call', () => {
        window.localStorage.setItem(TIMELINE_SHOW_READ_STORAGE_KEY, '1')
        const { showRead } = useTimelinePreferences()
        expect(showRead.value).toBe(true)
    })

    it('shares reactive state across callers (timeline page + menu)', async () => {
        const fromPage = useTimelinePreferences()
        const fromMenu = useTimelinePreferences()

        expect(fromPage.showRead.value).toBe(false)
        expect(fromMenu.showRead.value).toBe(false)

        fromMenu.toggleShowRead()
        await nextTick()

        // Both wrappers read the same underlying useState slot, so a
        // change via one is observable via the other.
        expect(fromPage.showRead.value).toBe(true)
        expect(fromMenu.showRead.value).toBe(true)
    })

    it('persists changes to localStorage using the pure serializer', async () => {
        const { showRead, toggleShowRead } = useTimelinePreferences()
        toggleShowRead()
        await nextTick()
        expect(window.localStorage.getItem(TIMELINE_SHOW_READ_STORAGE_KEY)).toBe('1')

        showRead.value = false
        await nextTick()
        expect(window.localStorage.getItem(TIMELINE_SHOW_READ_STORAGE_KEY)).toBe('0')
    })

    it('ignores unexpected stored values and keeps the default', () => {
        window.localStorage.setItem(TIMELINE_SHOW_READ_STORAGE_KEY, 'yes')
        const { showRead } = useTimelinePreferences()
        expect(showRead.value).toBe(false)
    })

    it('still persists to localStorage after a mount -> unmount -> remount cycle', async () => {
        // Regression: a previous implementation attached the persistence
        // watcher inside the first consuming component's effect scope.
        // Unmounting that component tore the watcher down, and the
        // hydration guard prevented a new watcher from ever being
        // registered on a later mount – the preference then lived only
        // in memory. A persistent preference must survive remounts.
        const Harness = defineComponent({
            setup() {
                return useTimelinePreferences()
            },
            render() {
                return h('div')
            },
        })

        const first = mount(Harness)
        ;(first.vm as unknown as { showRead: boolean }).showRead = true
        await nextTick()
        expect(window.localStorage.getItem(TIMELINE_SHOW_READ_STORAGE_KEY)).toBe('1')
        first.unmount()

        const second = mount(Harness)
        ;(second.vm as unknown as { showRead: boolean }).showRead = false
        await nextTick()
        expect(window.localStorage.getItem(TIMELINE_SHOW_READ_STORAGE_KEY)).toBe('0')
        second.unmount()
    })
})
