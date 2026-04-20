import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Regression guard for moving the "Show read" control from the
 * floating timeline overlay into the application menu. The source
 * file must bind to the shared composable and expose an accessible
 * switch; the behavioural contract itself is covered by
 * `tests/component/useTimelinePreferences.test.ts`.
 */

const source = readFileSync(
    resolve(__dirname, '../../components/AppUserMenu.vue'),
    'utf8',
)

describe('components/AppUserMenu.vue show-read toggle', () => {
    it('wires to the shared timeline preferences composable', () => {
        expect(source).toMatch(/useTimelinePreferences\s*\(/)
        // No local state duplication; the composable is the source of truth.
        expect(source).not.toMatch(/const\s+showRead\s*=\s*ref\(/)
    })

    it('uses the existing `index.showReadLabel` string (no new vocabulary)', () => {
        expect(source).toMatch(/index\.showReadLabel/)
        // Heading: `menu.view` as an editorial group, not a bespoke label.
        expect(source).toMatch(/menu\.view/)
    })

    it('exposes an accessible switch, not a color-only cue', () => {
        expect(source).toMatch(/role="switch"/)
        expect(source).toMatch(/aria-label/)
    })

    it('binds the checkbox to the composable state', () => {
        expect(source).toMatch(/v-model="showRead"/)
    })
})
