// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { isEditableTarget } from '../../utils/editable-target'

describe('isEditableTarget', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('returns false for null / non-element targets', () => {
        expect(isEditableTarget(null)).toBe(false)
        expect(isEditableTarget({} as EventTarget)).toBe(false)
    })

    it('returns false for non-editable elements', () => {
        const div = document.createElement('div')
        document.body.appendChild(div)
        expect(isEditableTarget(div)).toBe(false)

        const button = document.createElement('button')
        expect(isEditableTarget(button)).toBe(false)

        const a = document.createElement('a')
        expect(isEditableTarget(a)).toBe(false)
    })

    it('returns true for text-like form controls', () => {
        const input = document.createElement('input')
        expect(isEditableTarget(input)).toBe(true)

        const textarea = document.createElement('textarea')
        expect(isEditableTarget(textarea)).toBe(true)

        const select = document.createElement('select')
        expect(isEditableTarget(select)).toBe(true)
    })

    it('returns true for contenteditable hosts', () => {
        const el = document.createElement('div')
        el.setAttribute('contenteditable', 'true')
        document.body.appendChild(el)
        expect(isEditableTarget(el)).toBe(true)
    })

    it('returns true for elements nested inside a contenteditable region', () => {
        const host = document.createElement('div')
        host.setAttribute('contenteditable', 'true')
        const inner = document.createElement('span')
        host.appendChild(inner)
        document.body.appendChild(host)
        // `isContentEditable` inherits down the tree.
        expect(isEditableTarget(inner)).toBe(true)
    })
})
