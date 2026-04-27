import { describe, expect, it } from 'vitest'
import {
    SHORTCUT_GROUPS,
    tokenizeShortcutKey,
} from '../../utils/app-shortcuts'

/**
 * `tokenizeShortcutKey` is the pure renderer behind the `<kbd>` tokens
 * shown in the central shortcuts reference. The catalog itself is also
 * the contract for what shows up in `pages/help.vue`, so a couple of
 * structural invariants are pinned here so the help page cannot
 * accidentally render an empty or duplicate row.
 */
describe('tokenizeShortcutKey', () => {
    it('renders a single plain key as one upper-cased token', () => {
        expect(tokenizeShortcutKey('r')).toEqual([{ raw: 'r', label: 'R' }])
        expect(tokenizeShortcutKey('e')).toEqual([{ raw: 'e', label: 'E' }])
    })

    it('expands a shift+key chord into Shift + the leaf key, in that order', () => {
        expect(tokenizeShortcutKey('shift+l')).toEqual([
            { raw: 'shift+l', label: 'Shift' },
            { raw: 'shift+l', label: 'L' },
        ])
        expect(tokenizeShortcutKey('shift+k')).toEqual([
            { raw: 'shift+k', label: 'Shift' },
            { raw: 'shift+k', label: 'K' },
        ])
    })

    it('translates the named arrow keys into glyphs that match physical keys', () => {
        expect(tokenizeShortcutKey('arrowup')).toEqual([
            { raw: 'arrowup', label: '↑' },
        ])
        expect(tokenizeShortcutKey('arrowdown')).toEqual([
            { raw: 'arrowdown', label: '↓' },
        ])
        expect(tokenizeShortcutKey('arrowleft')).toEqual([
            { raw: 'arrowleft', label: '←' },
        ])
        expect(tokenizeShortcutKey('arrowright')).toEqual([
            { raw: 'arrowright', label: '→' },
        ])
    })

    it('uses Esc for the escape key (matches what users see on the key cap)', () => {
        expect(tokenizeShortcutKey('escape')).toEqual([
            { raw: 'escape', label: 'Esc' },
        ])
    })

    it('renders numpad font-size keys as readable labels', () => {
        expect(tokenizeShortcutKey('numpadadd')).toEqual([
            { raw: 'numpadadd', label: 'Num +' },
        ])
        expect(tokenizeShortcutKey('numpadsubtract')).toEqual([
            { raw: 'numpadsubtract', label: 'Num −' },
        ])
        expect(tokenizeShortcutKey('numpad0')).toEqual([
            { raw: 'numpad0', label: 'Num 0' },
        ])
    })

    it('keeps `+` / `-` / `=` / `0` as printable single tokens', () => {
        expect(tokenizeShortcutKey('+')).toEqual([{ raw: '+', label: '+' }])
        expect(tokenizeShortcutKey('-')).toEqual([{ raw: '-', label: '-' }])
        expect(tokenizeShortcutKey('=')).toEqual([{ raw: '=', label: '=' }])
        expect(tokenizeShortcutKey('0')).toEqual([{ raw: '0', label: '0' }])
    })
})

describe('SHORTCUT_GROUPS catalog invariants', () => {
    it('only declares non-empty groups with non-empty entries', () => {
        expect(SHORTCUT_GROUPS.length).toBeGreaterThan(0)
        for (const group of SHORTCUT_GROUPS) {
            expect(group.id).toMatch(/^[a-z][a-zA-Z0-9-]*$/)
            expect(group.entries.length).toBeGreaterThan(0)
            for (const entry of group.entries) {
                expect(entry.id).toMatch(/^[a-z][a-zA-Z0-9-]*$/)
                expect(entry.keys.length).toBeGreaterThan(0)
                for (const key of entry.keys) {
                    expect(key).toBe(key.toLowerCase())
                }
            }
        }
    })

    it('uses a unique id for every group and a unique entry id within each group', () => {
        const groupIds = new Set<string>()
        for (const group of SHORTCUT_GROUPS) {
            expect(groupIds.has(group.id)).toBe(false)
            groupIds.add(group.id)

            const entryIds = new Set<string>()
            for (const entry of group.entries) {
                expect(entryIds.has(entry.id)).toBe(false)
                entryIds.add(entry.id)
            }
        }
    })

    it('covers the timeline navigation, reading, and readability shortcut groups', () => {
        const ids = SHORTCUT_GROUPS.map((g) => g.id)
        // These three groups carry the package's promise: the central
        // reference shows timeline, article, and readability shortcuts
        // in one place. Adding a fourth group later is fine; removing
        // one of these without a documented replacement is not.
        expect(ids).toContain('timeline')
        expect(ids).toContain('article')
        expect(ids).toContain('readability')
    })
})
