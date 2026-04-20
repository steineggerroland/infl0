import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Smoke check that the global `focus-visible` baseline in
 * `assets/css/tailwind.css` is still there.
 *
 * We keep this extremely small on purpose. What the rule contains
 * (which selectors it covers, whether it uses `currentColor` or a
 * fixed palette token, the exact offset) is an implementation
 * decision that has already shifted once and will shift again. The
 * only invariant worth failing CI over is "we did not accidentally
 * remove the keyboard focus indicator while editing CSS". The
 * actual visual quality of the ring is verified manually / via
 * axe + Playwright smoke tests (see `docs/ROADMAP.md`).
 */

const css = readFileSync(
    resolve(__dirname, '../../assets/css/tailwind.css'),
    'utf8',
)

describe('focus-visible baseline', () => {
    it('ships a :focus-visible rule that sets an outline', () => {
        expect(css).toMatch(/:focus-visible/)
        expect(css).toMatch(/outline\s*:/)
    })
})
