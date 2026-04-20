import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Baseline focus-visible indicator.
 *
 * Every interactive surface in the app must expose a keyboard focus
 * ring. We do not chase this per-component (it drifts as soon as a new
 * button or a `[role="switch"]` is added); instead a single global rule
 * in `assets/css/tailwind.css` covers the common surfaces and uses
 * `currentColor` + `outline-offset` so it stays legible on both dark
 * and light backgrounds without a per-theme config.
 *
 * This guard pins the rule down. If you deliberately change the
 * strategy, update both the stylesheet and this test so the decision
 * is reviewed explicitly.
 */

const css = readFileSync(
    resolve(__dirname, '../../assets/css/tailwind.css'),
    'utf8',
)

describe('focus-visible baseline in tailwind.css', () => {
    // Pull out the entire `:where(...):focus-visible { ... }` block so
    // individual assertions can look at it without false positives from
    // other rules in the file. The selector list legitimately contains
    // a nested `:not(...)`, so the regex tolerates one level of
    // balanced parens.
    const match = css.match(
        /:where\(((?:[^()]|\([^()]*\))*)\)\s*:focus-visible\s*\{([^}]+)\}/,
    )

    it('declares a single :where(...):focus-visible baseline rule', () => {
        expect(match).not.toBeNull()
    })

    const selectors = match?.[1] ?? ''
    const body = match?.[2] ?? ''

    it.each([
        'a',
        'button',
        'summary',
        'input',
        'select',
        'textarea',
        '[role="button"]',
        '[role="switch"]',
        '[role="menuitem"]',
        '[role="tab"]',
        '[role="checkbox"]',
        '[role="radio"]',
    ])('covers the %s interactive surface', (needle) => {
        // Normalise whitespace so the list can be formatted freely in CSS.
        const normalised = selectors.replace(/\s+/g, ' ')
        expect(normalised).toContain(needle)
    })

    it('explicitly excludes tabindex="-1" (programmatic focus targets)', () => {
        // Without this exclusion the ring would flash on our <main> when
        // the skip link fires, even though <main> is not a control.
        expect(selectors.replace(/\s+/g, '')).toContain(
            '[tabindex]:not([tabindex="-1"])',
        )
    })

    it('uses currentColor for the outline so the ring adapts to the surface', () => {
        // currentColor inherits the text colour of the focused element.
        // On dark forms the text is light, on the light help page the
        // text is dark – either way the ring has the same contrast as
        // the surrounding text, which WCAG itself already requires to
        // be at least 4.5:1 against the background.
        expect(body).toMatch(/outline:\s*[^;]*currentColor/i)
    })

    it('offsets the ring from the element to keep it visible on coloured buttons', () => {
        expect(body).toMatch(/outline-offset:\s*[1-9]/)
    })

    it('uses :where(...) to keep specificity zero', () => {
        // `:where()` keeps the whole rule at specificity (0,0,0) so any
        // component-level override (Tailwind `focus-visible:outline-*`,
        // DaisyUI `.btn`, etc.) still wins without `!important`.
        expect(match?.[0]).toMatch(/^:where\(/)
    })
})
