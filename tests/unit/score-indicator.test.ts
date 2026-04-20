import { describe, expect, it } from 'vitest'
import { scoreDirection, scoreGlyph } from '../../utils/score-indicator'

/**
 * Behavioural tests for the colour-independent score indicator.
 *
 * Rationale: the personalization page used to rely on emerald vs.
 * amber alone to signal "helps the score" vs. "hurts the score",
 * which is a WCAG 1.4.1 (Use of Colour) violation. These helpers
 * hand every caller a direction token plus a shape-based glyph so
 * the sign is conveyed redundantly to colour.
 *
 * We intentionally test *properties* rather than the exact glyph
 * characters. The specific shape is a product decision that will
 * continue to evolve (triangles today, maybe arrows or icons
 * tomorrow); pinning the Unicode codepoint here would turn every
 * design tweak into a test failure without catching any real bug.
 * The invariants that actually matter are: every direction maps
 * to a rendered, non-empty glyph, and the four directions remain
 * visually distinguishable.
 */

describe('scoreDirection', () => {
    it('returns "unknown" for null, undefined and NaN', () => {
        expect(scoreDirection(null)).toBe('unknown')
        expect(scoreDirection(undefined)).toBe('unknown')
        expect(scoreDirection(Number.NaN)).toBe('unknown')
    })

    it('returns "neutral" for values inside the rounding-noise dead zone', () => {
        expect(scoreDirection(0)).toBe('neutral')
        expect(scoreDirection(1e-10)).toBe('neutral')
        expect(scoreDirection(-1e-10)).toBe('neutral')
    })

    it('returns "positive" for any meaningful positive value', () => {
        expect(scoreDirection(1e-8)).toBe('positive')
        expect(scoreDirection(0.0001)).toBe('positive')
        expect(scoreDirection(42)).toBe('positive')
    })

    it('returns "negative" for any meaningful negative value', () => {
        expect(scoreDirection(-1e-8)).toBe('negative')
        expect(scoreDirection(-0.0001)).toBe('negative')
        expect(scoreDirection(-42)).toBe('negative')
    })
})

describe('scoreGlyph', () => {
    it('returns a non-empty string for every direction', () => {
        for (const direction of ['positive', 'negative', 'neutral', 'unknown'] as const) {
            const glyph = scoreGlyph(direction)
            expect(glyph, `glyph for ${direction}`).toBeTypeOf('string')
            expect(glyph.trim(), `glyph for ${direction} must not be blank`).not.toBe('')
        }
    })

    it('renders all four directions as visually distinct glyphs', () => {
        // Monochrome-safety: colour-blind or screen-reader-off users
        // must still be able to tell the four states apart by shape
        // alone, so the glyphs have to be pairwise different.
        const glyphs = new Set([
            scoreGlyph('positive'),
            scoreGlyph('negative'),
            scoreGlyph('neutral'),
            scoreGlyph('unknown'),
        ])
        expect(glyphs.size).toBe(4)
    })
})
