<script setup lang="ts">
/**
 * Renders a numeric score delta with the three redundant cues
 * required by our A11y contract (see
 * `docs/CONTENT_AND_A11Y.md`, section "Colour & contrast"):
 *
 *   1. Signed number (`+0.0123` / `-0.0456`) so the sign is
 *      visible without relying on colour.
 *   2. A shape-based glyph from `utils/score-indicator.ts`,
 *      hidden from assistive tech because the screen-reader
 *      label below already communicates the direction.
 *   3. A translated screen-reader label the caller passes in,
 *      rendered as `.sr-only`.
 *
 * Rendered as plain inline spans on purpose: `inline-flex
 * items-center` would align inline boxes of different intrinsic
 * heights (triangle glyph vs. digits) and visibly push the
 * glyph off the text baseline. Plain inline flow keeps them on
 * the same baseline, which is what the eye reads as "they line
 * up".
 *
 * Colour is the decorative fourth layer and stays at the call
 * site (via a `:class` on the wrapping element), so the same
 * component can be themed emerald/amber on the personalization
 * page, teal/orange on a timeline card, etc.
 */
import { computed } from 'vue'
import { scoreDirection, scoreGlyph } from '~/utils/score-indicator'

const props = withDefaults(
    defineProps<{
        value: number | null | undefined
        srLabel: string
        precision?: number
    }>(),
    { precision: 4 },
)

function fmtSigned(value: number, digits: number): string {
    if (!Number.isFinite(value)) return '—'
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(digits)}`
}

const glyph = computed(() => scoreGlyph(scoreDirection(props.value)))
const text = computed(() => fmtSigned(props.value ?? Number.NaN, props.precision))
</script>

<template>
    <span>
        <span aria-hidden="true" class="me-2">{{ glyph }}</span><span>{{ text }}</span>
        <span class="sr-only">{{ srLabel }}</span>
    </span>
</template>
