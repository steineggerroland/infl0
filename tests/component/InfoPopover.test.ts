// @vitest-environment happy-dom
import { resetNuxtTestState } from '../_helpers/nuxt-globals'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import InfoPopover from '../../components/InfoPopover.vue'

/**
 * Component tests for the `InfoPopover` covering the accessibility contract
 * a reviewer should be able to trust without opening the browser.
 */

function mountPopover(options: { content?: string } = {}) {
    return mount(InfoPopover, {
        props: { triggerLabel: 'How we protect your password' },
        slots: { default: options.content ?? '<p>body</p>' },
        global: {
            mocks: { $t: (key: string) => key },
        },
        attachTo: document.body,
    })
}

describe('InfoPopover', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
        resetNuxtTestState()
    })
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('renders a trigger with the provided accessible name', () => {
        const wrapper = mountPopover()
        const trigger = wrapper.get('button[aria-haspopup="dialog"]')

        expect(trigger.attributes('aria-label')).toBe('How we protect your password')
        expect(trigger.attributes('aria-expanded')).toBe('false')
    })

    it('opens on click and exposes matching aria attributes', async () => {
        const wrapper = mountPopover({ content: '<p>Plain-language explainer.</p>' })
        const trigger = wrapper.get('button[aria-haspopup="dialog"]')

        await trigger.trigger('click')

        expect(trigger.attributes('aria-expanded')).toBe('true')
        const panel = wrapper.get('[role="dialog"]')
        expect(panel.attributes('id')).toBe(trigger.attributes('aria-controls'))
        expect(panel.attributes('aria-label')).toBe('How we protect your password')
        expect(panel.text()).toContain('Plain-language explainer.')
    })

    it('closes on Escape and returns focus to the trigger', async () => {
        const wrapper = mountPopover()
        const trigger = wrapper.get('button[aria-haspopup="dialog"]').element as HTMLButtonElement

        trigger.click()
        await nextTick()
        expect(wrapper.get('button[aria-haspopup="dialog"]').attributes('aria-expanded')).toBe('true')

        const escape = new KeyboardEvent('keydown', { key: 'Escape' })
        document.dispatchEvent(escape)
        await flushPromises()

        expect(wrapper.get('button[aria-haspopup="dialog"]').attributes('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(trigger)
    })

    it('closes when clicking outside the popover', async () => {
        const wrapper = mountPopover()
        const trigger = wrapper.get('button[aria-haspopup="dialog"]')

        await trigger.trigger('click')
        expect(trigger.attributes('aria-expanded')).toBe('true')

        const outside = document.createElement('button')
        outside.textContent = 'outside'
        document.body.appendChild(outside)

        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await flushPromises()

        expect(wrapper.get('button[aria-haspopup="dialog"]').attributes('aria-expanded')).toBe('false')
    })

    it('ignores Escape while closed (no focus change)', async () => {
        const wrapper = mountPopover()
        const trigger = wrapper.get('button[aria-haspopup="dialog"]').element as HTMLButtonElement

        const focusSpy = vi.spyOn(trigger, 'focus')
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await flushPromises()

        expect(focusSpy).not.toHaveBeenCalled()
    })

    // Regression for the `Cmd+R` family of bugs generalised to every chord.
    // Escape with a modifier held is an app-/OS-level shortcut (e.g. macOS
    // uses Cmd+Escape for various system actions) and must not dismiss an
    // in-page popover on its way through.
    it('ignores Escape while a modifier is held', async () => {
        const wrapper = mountPopover()
        const trigger = wrapper.get('button[aria-haspopup="dialog"]')

        await trigger.trigger('click')
        expect(trigger.attributes('aria-expanded')).toBe('true')

        document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', metaKey: true }),
        )
        await flushPromises()

        expect(wrapper.get('button[aria-haspopup="dialog"]').attributes('aria-expanded')).toBe('true')
    })

    it('closes on Escape even when the focus is inside an editable control', async () => {
        // `<input>`/`<textarea>` inside a popover must still honour the
        // universal dismissal key. The editable-target guard that
        // protects shortcuts like `w`/`s` must not fight the dialog
        // contract here.
        const wrapper = mountPopover({
            content: '<input type="text" data-testid="field" />',
        })
        const trigger = wrapper.get('button[aria-haspopup="dialog"]')

        await trigger.trigger('click')
        const field = wrapper.get('[data-testid="field"]').element as HTMLInputElement
        field.focus()

        field.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        )
        await flushPromises()

        expect(wrapper.get('button[aria-haspopup="dialog"]').attributes('aria-expanded')).toBe('false')
    })
})
