import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guard rails that lock in the review finding: the help page must not
 * reintroduce any coupling to the auth state or cache it in a way that
 * survives sign-in transitions. A static check is intentionally strict –
 * we would rather fail fast on the symptom (an auth import in help.vue)
 * than chase the consequence (stale back links) at runtime.
 */

const source = readFileSync(
    resolve(__dirname, '../../pages/help.vue'),
    'utf8',
)

describe('pages/help.vue auth decoupling', () => {
    it('declares itself public via definePageMeta', () => {
        expect(source).toMatch(/auth:\s*['"]public['"]/)
    })

    it('does not read or cache any auth state', () => {
        expect(source).not.toMatch(/useState\s*</)
        expect(source).not.toMatch(/authState/)
        expect(source).not.toMatch(/\/api\/auth\/me/)
        expect(source).not.toMatch(/signedIn/i)
    })

    it('uses a neutral back link pointing to the timeline root', () => {
        // A `to="/"` keeps the destination predictable; the global auth
        // middleware forwards signed-out visitors from `/` to `/login`, so
        // this page does not need to know about the session state.
        expect(source).toMatch(/to="\/"/)
        expect(source).toMatch(/common\.back/)
    })

    it('uses an action-oriented skip link', () => {
        expect(source).toMatch(/common\.skipToMain/)
        // The previous implementation used the page title, which reads as
        // the destination ("Help & FAQ") instead of the action.
        expect(source).not.toMatch(/>\s*{{\s*t\('help\.title'\)\s*}}\s*<\/a>/)
    })
})
