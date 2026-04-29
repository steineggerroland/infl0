/**
 * Drift guard for the onboarding card catalog.
 *
 * Adding a card means: register it in `utils/onboarding-cards.ts` AND add
 * its title / body (or `body.desktop` + `body.mobile` when
 * `hasDeviceVariants`) and CTA label to BOTH locales. This spec fails
 * loudly if either side is missing.
 *
 * Why it lives in the same drift-guard tier as `tests/unit/app-shortcuts.test.ts`:
 *
 * - Onboarding cards are server-driven (the inflow API only emits the
 *   `topic` discriminator), so the visible copy lives only in i18n.
 * - A new translator who adds DE copy without EN — or a content edit
 *   that drops a key — must fail at unit-test time, not in a user's
 *   inflow.
 */
import { describe, expect, it } from 'vitest'

import deLocale from '../../i18n/locales/de.json'
import enLocale from '../../i18n/locales/en.json'
import {
    findOnboardingCard,
    isInternalCtaHref,
    ONBOARDING_CARDS,
    ONBOARDING_TOPICS,
    type OnboardingCard,
    type OnboardingTopic,
} from '../../utils/onboarding-cards'

type LocaleFile = {
    onboarding: {
        skipIntro: string
    } & Record<
        OnboardingTopic,
        {
            title: string
            front: string | { desktop: string; mobile: string }
            back: string | { desktop: string; mobile: string }
            full: string | { desktop: string; mobile: string }
            cta?: string
        }
    >
}

const LOCALES: { id: 'de' | 'en'; data: LocaleFile }[] = [
    { id: 'de', data: deLocale as LocaleFile },
    { id: 'en', data: enLocale as LocaleFile },
]

function nonEmptyString(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0
}

describe('onboarding-cards catalog', () => {
    it('lists every catalog entry under ONBOARDING_TOPICS', () => {
        const catalogTopics = ONBOARDING_CARDS.map((c) => c.topic)
        expect(catalogTopics).toEqual([...ONBOARDING_TOPICS])
    })

    it('uses unique topics and unique ordinals', () => {
        const topics = ONBOARDING_CARDS.map((c) => c.topic)
        const ordinals = ONBOARDING_CARDS.map((c) => c.ordinal)
        expect(new Set(topics).size).toBe(topics.length)
        expect(new Set(ordinals).size).toBe(ordinals.length)
    })

    it('renders intro first so the skip button is the first thing a new user sees', () => {
        const intro = ONBOARDING_CARDS[0]
        expect(intro?.topic).toBe('intro')
        expect(intro?.ordinal).toBe(0)
    })

    it('keeps CTA hrefs internal — no external links on the calm reading surface', () => {
        for (const card of ONBOARDING_CARDS) {
            if (!card.cta) continue
            expect(isInternalCtaHref(card.cta.href), `CTA on ${card.topic}`).toBe(true)
        }
    })

    it('rejects malformed CTA hrefs (defensive, in case someone edits the catalog)', () => {
        expect(isInternalCtaHref('https://evil.example/')).toBe(false)
        expect(isInternalCtaHref('//evil.example/')).toBe(false)
        expect(isInternalCtaHref('feeds')).toBe(false)
        expect(isInternalCtaHref('')).toBe(false)
    })

    describe('i18n parity', () => {
        for (const card of ONBOARDING_CARDS) {
            describeForCard(card)
        }

        it('exposes a skip-introduction label in DE and EN', () => {
            for (const { id, data } of LOCALES) {
                expect(
                    nonEmptyString(data.onboarding?.skipIntro),
                    `${id}.onboarding.skipIntro must be non-empty`,
                ).toBe(true)
            }
        })

        it('keeps onboarding keys in step between DE and EN', () => {
            for (const card of ONBOARDING_CARDS) {
                const en = (enLocale as LocaleFile).onboarding[card.topic]
                const de = (deLocale as LocaleFile).onboarding[card.topic]
                expect(
                    Object.keys(en).sort(),
                    `keys for ${card.topic}`,
                ).toEqual(Object.keys(de).sort())
            }
        })
    })

    describe('lookup helper', () => {
        it('returns the catalog entry for a known topic', () => {
            expect(findOnboardingCard('intro')?.topic).toBe('intro')
        })
        it('returns undefined for an unknown topic', () => {
            expect(findOnboardingCard('not-a-topic')).toBeUndefined()
        })
    })
})

function describeForCard(card: OnboardingCard) {
    describe(`card: ${card.topic}`, () => {
        for (const { id, data } of LOCALES) {
            describe(`locale ${id}`, () => {
                const block = data.onboarding[card.topic]

                it('has a non-empty title', () => {
                    expect(nonEmptyString(block?.title)).toBe(true)
                })

                if (card.hasDeviceVariants) {
                    it('has desktop and mobile variants for each copy surface', () => {
                        for (const key of ['front', 'back', 'full'] as const) {
                            expect(typeof block?.[key], `${key} must be an object`).toBe('object')
                            const value = block?.[key] as { desktop: unknown; mobile: unknown }
                            expect(nonEmptyString(value?.desktop), `${key}.desktop variant`).toBe(true)
                            expect(nonEmptyString(value?.mobile), `${key}.mobile variant`).toBe(true)
                        }
                    })
                } else {
                    it('has flat front/back/full strings', () => {
                        expect(nonEmptyString(block?.front as unknown), 'front').toBe(true)
                        expect(nonEmptyString(block?.back as unknown), 'back').toBe(true)
                        expect(nonEmptyString(block?.full as unknown), 'full').toBe(true)
                    })
                }

                if (card.cta) {
                    it('has a non-empty CTA label', () => {
                        expect(nonEmptyString(block?.cta)).toBe(true)
                    })
                } else {
                    it('does not declare a CTA label', () => {
                        expect(block?.cta).toBeUndefined()
                    })
                }
            })
        }
    })
}
