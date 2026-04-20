/**
 * Colour-independent indicators for numeric scores and deltas.
 *
 * The personalization page used to rely on emerald (positive) vs.
 * amber (negative) hues alone, which fails WCAG 1.4.1 for users
 * with red-green colour blindness. These helpers give every
 * caller a direction token (for copy / i18n) and a shape-based
 * glyph (for rendering) so the sign is conveyed redundantly on
 * top of the colour.
 *
 * Kept as a pure utility — no Vue, no DOM — so tests stay fast and
 * the helpers can be reused in CLI tooling or server-side render
 * contexts if we ever need to.
 */

export type ScoreDirection = 'positive' | 'negative' | 'neutral' | 'unknown'

/**
 * A small dead zone around zero. Numbers this close to zero are
 * indistinguishable from rounding noise and should be rendered
 * as neutral rather than biased one way.
 */
const NEUTRAL_EPSILON = 1e-9

export function scoreDirection(
    value: number | null | undefined,
): ScoreDirection {
    if (value == null || !Number.isFinite(value)) return 'unknown'
    if (Math.abs(value) < NEUTRAL_EPSILON) return 'neutral'
    return value > 0 ? 'positive' : 'negative'
}

/**
 * Map a direction to a shape-based glyph. All four glyphs must
 * be visually distinct *without* relying on colour. The
 * specific characters are a product decision kept in sync with
 * the rest of the UI (the same triangles/dot/dash already
 * appear on timeline cards), which is why callers must render
 * them as **plain inline text** next to the number — not inside
 * `inline-flex items-center`. Triangles have a different
 * intrinsic inline-box height than digits, and flex centring
 * visibly pushes them off the baseline. See
 * `docs/CONTENT_AND_A11Y.md` (Colour & contrast) for the
 * rendering contract.
 */
export function scoreGlyph(direction: ScoreDirection): string {
    switch (direction) {
        case 'positive':
            return '▲'
        case 'negative':
            return '▼'
        case 'neutral':
            return '·'
        case 'unknown':
            return '—'
    }
}
