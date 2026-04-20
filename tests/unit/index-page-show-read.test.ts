import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guard rails for the timeline page.
 *
 * These are not assertions about a single bug we just fixed; they
 * describe constraints that new code on this page must respect. If you
 * catch yourself loosening them, first check whether the change is
 * actually desirable – and document the reasoning next to the change.
 */

const indexSource = readFileSync(
    resolve(__dirname, '../../pages/index.vue'),
    'utf8',
)

describe('pages/index.vue guard rails', () => {
    it('does not place a <Teleport> on the timeline without a deliberate decision', () => {
        // Why this rule exists:
        //
        // The timeline is the primary content surface of the app. A
        // `<Teleport>` on this page escapes the normal document flow
        // and is almost always used to render *on top of* the articles,
        // which leads to:
        //   - article text being visually occluded (WCAG 2.2 · 1.4.10
        //     Reflow, 1.4.13 Content on Hover or Focus),
        //   - inconsistent keyboard / screen-reader order because the
        //     teleported node ends up at the end of <body>,
        //   - interaction clashes with the snap-scroll article viewer.
        //
        // We therefore treat any Teleport on this page as a design
        // smell. When you genuinely need one (e.g. a modal dialog
        // triggered from the timeline), remove or narrow this assertion
        // in the same change and record why the Teleport is the right
        // tool in the commit message and in
        // `docs/CONTENT_AND_A11Y.md`. Prefer placing persistent chrome
        // in `AppUserMenu` or a dedicated, static header instead.
        expect(indexSource).not.toMatch(/<Teleport\b/)
    })

    it('pulls the show-read state from the shared composable', () => {
        expect(indexSource).toMatch(/useTimelinePreferences\s*\(/)
    })

    it('registers the "r" keyboard shortcut to toggle show-read', () => {
        // Lives in the `defineShortcuts` block next to arrow/w/s. The
        // help centre advertises this shortcut; losing it would be a
        // silent docs/reality mismatch.
        expect(indexSource).toMatch(/\br\s*:\s*/)
        expect(indexSource).toMatch(/toggleShowRead/)
    })
})
