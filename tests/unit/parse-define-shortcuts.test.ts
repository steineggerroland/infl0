import { describe, expect, it } from 'vitest'
import { extractDefineShortcutsKeys } from '../_helpers/parse-define-shortcuts'

/**
 * Self-test for the small `defineShortcuts(...)` scanner used by the
 * coverage test (`tests/unit/shortcuts-coverage.test.ts`). The shapes
 * exercised here are exactly the shapes the codebase uses today
 * (`pages/index.vue`, `components/ArticleView.vue`,
 * `components/InfoPopover.vue`). New shapes — e.g. a computed key,
 * a spread, or a `defineShortcuts` invocation built from a constant —
 * should either be added here or trip the coverage test loud enough
 * that the developer notices.
 */

describe('extractDefineShortcutsKeys (.ts source)', () => {
    it('returns the keys of an inline object literal', () => {
        const src = `
            defineShortcuts({
                w: gotoPrev,
                s: gotoNext,
                r: toggleShowRead,
            })
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual(['w', 's', 'r'])
    })

    it('handles both bareword and quoted keys, in either order', () => {
        const src = `
            defineShortcuts({
                'q': fn,
                e: fn,
                "shift+l": fn,
                numpadadd: fn,
                '+': fn,
            })
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual([
            'q',
            'e',
            'shift+l',
            'numpadadd',
            '+',
        ])
    })

    it('keeps numeric keys (`0`, `numpad0`) verbatim', () => {
        const src = `
            defineShortcuts({
                0: reset,
                numpad0: reset,
            })
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual(['0', 'numpad0'])
    })

    it('walks past handler bodies that contain `{`, `}`, strings, and other shortcut-like text', () => {
        const src = `
            defineShortcuts({
                arrowup: (e) => {
                    if (state.value === 'r') return
                    const map = { 'shift+x': true }
                    e.preventDefault()
                },
                arrowdown: gotoNext,
            })
        `
        // The bogus inner key 'shift+x' must not leak out — it is part
        // of a handler body, not a top-level shortcut entry.
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual([
            'arrowup',
            'arrowdown',
        ])
    })

    it('accepts the optional second argument (`{ when, skipEditableTarget }`)', () => {
        const src = `
            defineShortcuts(
                {
                    w: gotoPrev,
                    s: gotoNext,
                },
                { when: () => !anyOpen.value },
            )
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual(['w', 's'])
    })

    it('handles multiple `defineShortcuts(...)` calls in the same source', () => {
        const src = `
            defineShortcuts({ e: fn, escape: fn })
            const x = 1
            defineShortcuts({ q: fn })
            defineShortcuts({ '+': fn, '-': fn, 'shift+k': fn, 'shift+l': fn })
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual([
            'e',
            'escape',
            'q',
            '+',
            '-',
            'shift+k',
            'shift+l',
        ])
    })

    it('skips computed keys and spreads (cannot be resolved statically)', () => {
        const src = `
            defineShortcuts({
                w: fn,
                [dynamic]: fn,
                ...extra,
                s: fn,
            })
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual(['w', 's'])
    })

    it('does not match `defineShortcuts` mentions inside JSDoc comments', () => {
        const src = `
            /**
             * Example: defineShortcuts({ ghost: fn })
             *
             * Real call below.
             */
            defineShortcuts({ real: fn })
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual(['real'])
    })

    it('does not match `defineShortcuts` mentions inside line comments or strings', () => {
        const src = `
            // defineShortcuts({ ghost: fn })
            const note = "see defineShortcuts({ alsoGhost: fn })"
            defineShortcuts({ real: fn })
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual(['real'])
    })

    it('does not match identifiers that merely contain `defineShortcuts`', () => {
        const src = `
            export function defineShortcutsHelper() {
                return defineShortcuts({ w: fn })
            }
            mydefineShortcuts({ ghost: fn })
        `
        // The first call is a real `defineShortcuts(...)` and counts;
        // the wrapper name and the prefixed identifier do not.
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual(['w'])
    })

    it('returns no keys when the first argument is not an inline object literal', () => {
        // Mirrors `composables/useShortcuts.ts` (the function
        // *definition*, not a call site), and the case where a caller
        // passes a precomputed map by name.
        const src = `
            export function defineShortcuts(shortcuts, options = {}) { /* ... */ }
            defineShortcuts(shortcuts, options)
        `
        expect(extractDefineShortcutsKeys(src, 'ts')).toEqual([])
    })
})

describe('extractDefineShortcutsKeys (.vue source)', () => {
    it('reads only the <script> blocks, ignoring <template> and <style>', () => {
        const src = `
            <template>
                <p>defineShortcuts({ ghost: fn })</p>
            </template>

            <script setup lang="ts">
            defineShortcuts({ real: fn })
            </script>

            <style>
            .a::before { content: "defineShortcuts({ stillGhost: fn })"; }
            </style>
        `
        expect(extractDefineShortcutsKeys(src, 'vue')).toEqual(['real'])
    })

    it('concatenates multiple <script> blocks (e.g. <script> + <script setup>)', () => {
        const src = `
            <script lang="ts">
            export default { name: 'X' }
            defineShortcuts({ a: fn })
            </script>
            <script setup lang="ts">
            defineShortcuts({ b: fn })
            </script>
        `
        expect(extractDefineShortcutsKeys(src, 'vue')).toEqual(['a', 'b'])
    })
})
