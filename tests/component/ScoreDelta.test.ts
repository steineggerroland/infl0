// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreDelta from '../../components/ScoreDelta.vue'

/**
 * Behavioural coverage for our colour-independent score-delta
 * renderer. This is the *only* guard we rely on for the WCAG 1.4.1
 * contract — "direction is encoded redundantly via sign + shape +
 * screen-reader label, never colour alone" — at the layer that
 * actually ships to assistive tech: the rendered DOM.
 *
 * We used to assert this with a regex over
 * `components/settings/SettingsPersonalizationSection.vue`; that caught the literal
 * bytes of the template and broke on every cosmetic refactor while
 * still missing real regressions (a flex-layout bug slipped past
 * it). Now every caller renders through `ScoreDelta`, so these
 * mount-level assertions follow the actual behaviour.
 */

describe('ScoreDelta', () => {
    it('renders positive values with an explicit "+" sign', () => {
        const wrapper = mount(ScoreDelta, {
            props: { value: 0.0123, srLabel: 'Positive' },
        })
        expect(wrapper.text()).toContain('+0.0123')
    })

    it('renders negative values with the "−" sign from Number.toFixed', () => {
        const wrapper = mount(ScoreDelta, {
            props: { value: -0.0456, srLabel: 'Negative' },
        })
        expect(wrapper.text()).toContain('-0.0456')
    })

    it('renders an em dash for non-finite values (null / NaN)', () => {
        const wrapper = mount(ScoreDelta, {
            props: { value: null, srLabel: 'Unknown' },
        })
        expect(wrapper.text()).toContain('—')
    })

    it('renders a non-empty glyph and hides it from assistive tech', () => {
        // Sighted users get the shape as a redundant cue next to the
        // sign. Screen readers already hear the sr-only label, so
        // also announcing the glyph would just be noise.
        const wrapper = mount(ScoreDelta, {
            props: { value: 0.0123, srLabel: 'Positive' },
        })
        const glyph = wrapper.get('[aria-hidden="true"]')
        expect(glyph.text().trim()).not.toBe('')
    })

    it('renders the screen-reader label as visually hidden text', () => {
        const wrapper = mount(ScoreDelta, {
            props: { value: -0.0001, srLabel: 'Decreased' },
        })
        expect(wrapper.get('.sr-only').text()).toBe('Decreased')
    })

    it('respects the precision prop without breaking the sign', () => {
        const wrapper = mount(ScoreDelta, {
            props: { value: 0.5, srLabel: 'Positive', precision: 2 },
        })
        expect(wrapper.text()).toContain('+0.50')
    })

    it('shows four distinct glyphs for positive, negative, neutral and unknown', () => {
        // Colour is a decorative fourth layer — strip it away and
        // users must still tell the four states apart by shape
        // alone.
        const glyphs = new Set(
            [0.1, -0.1, 0, null].map((value) => {
                const wrapper = mount(ScoreDelta, {
                    props: { value, srLabel: 'x' },
                })
                return wrapper.get('[aria-hidden="true"]').text().trim()
            }),
        )
        expect(glyphs.size).toBe(4)
    })
})
