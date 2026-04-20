import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * App-wide accessibility contract.
 *
 * Every page the user can land on must expose:
 *   1. A `<main>` landmark with `id="main"` so screen-reader users can
 *      jump to the primary content with a single shortcut and keyboard
 *      users reach it via the skip link.
 *   2. A visible-on-focus skip link at the top of the tab order that
 *      targets `#main`. Labelled via `t('common.skipToMain')`, never
 *      hard-coded.
 *
 * The two live in lock-step: a `<main id="main">` without a matching
 * skip link would orphan keyboard users, and a skip link without a
 * `<main>` landing target is a broken promise.
 *
 * Pages that use the `app` layout inherit both from `layouts/app.vue`.
 * Pages that opt out (`layout: false`) must provide both themselves.
 */

const root = resolve(__dirname, '../..')

function read(relPath: string): string {
    return readFileSync(resolve(root, relPath), 'utf8')
}

function hasSkipLinkToMain(source: string): boolean {
    // Link must target #main, sit in `sr-only focus:not-sr-only` (i.e.
    // invisible until focused), and be labelled via the shared i18n
    // key so translators see it alongside the other common strings.
    return (
        /href="#main"/.test(source) &&
        /sr-only focus:not-sr-only/.test(source) &&
        /common\.skipToMain/.test(source)
    )
}

function hasMainLandmark(source: string): boolean {
    // Accept either on one line or across line breaks.
    return /<main\s[^>]*id="main"/s.test(source)
}

describe('landmarks & skip-link contract', () => {
    describe('layouts/app.vue (shared chrome for signed-in pages)', () => {
        const layout = read('layouts/app.vue')

        it('exposes a <main id="main"> wrapping the page slot', () => {
            expect(hasMainLandmark(layout)).toBe(true)
            // The slot is the page content: make sure the slot lives
            // inside the <main>, otherwise pages would render outside
            // the landmark.
            expect(layout).toMatch(
                /<main\b[^>]*id="main"[^>]*>[\s\S]*?<slot\s*\/>[\s\S]*?<\/main>/,
            )
        })

        it('ships a skip link that targets the shared main landmark', () => {
            expect(hasSkipLinkToMain(layout)).toBe(true)
        })

        it('makes the <main> focusable so the skip link actually moves focus', () => {
            // Without `tabindex="-1"` the skip link would only scroll,
            // leaving screen-reader / keyboard focus behind.
            expect(layout).toMatch(/<main\s[^>]*tabindex="-1"/s)
        })
    })

    describe.each([
        ['pages/help.vue'],
        ['pages/login.vue'],
        ['pages/register.vue'],
    ])('layout-less page %s', (file) => {
        const source = read(file)

        it('declares its own <main id="main"> landmark', () => {
            expect(hasMainLandmark(source)).toBe(true)
        })

        it('provides its own skip link to #main', () => {
            expect(hasSkipLinkToMain(source)).toBe(true)
        })

        it('does not keep a stale bespoke main id (e.g. help-main)', () => {
            // We deliberately unified on `id="main"` so the same skip
            // link works across the app. Finding `id="help-main"` means
            // the page drifted back.
            expect(source).not.toMatch(/id="help-main"/)
            expect(source).not.toMatch(/href="#help-main"/)
        })
    })

    describe('pages that use the app layout do not duplicate the landmark', () => {
        it.each([
            ['pages/index.vue'],
            ['pages/feeds.vue'],
            ['pages/settings/personalization.vue'],
            ['pages/settings/privacy.vue'],
            ['pages/settings/timeline-score.vue'],
        ])('%s relies on layouts/app.vue for <main>', (file) => {
            const source = read(file)
            // These pages must not add their own top-level <main>, to
            // avoid double landmarks which confuse assistive tech.
            expect(source).not.toMatch(/<main\b/)
        })
    })
})
