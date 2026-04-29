/**
 * Single source of truth for the **onboarding cards** the inflow API
 * prepends to a user's inflow when `uiPrefs.onboardingHidden === false`.
 *
 * Why this file exists — see `docs/planned/onboarding-and-inflow-cards.md`:
 *
 * - The inflow API (`server/api/inflow.get.ts`) maps each topic in the
 *   `ONBOARDING_CARDS` list to a `{ type: 'onboarding', topic, ordinal,
 *   cta?, hasDeviceVariants }` row at the top of the response. The
 *   server intentionally does **not** carry copy: titles, bodies, CTA
 *   labels live in `i18n/locales/{de,en}.json` under `onboarding.<topic>.*`
 *   and are rendered by `components/OnboardingCardView.vue`.
 * - Onboarding cards do **not** participate in `R` (show-read), in
 *   engagement-tracking (dwell), or in rank scoring. Those mechanisms
 *   stay exclusive to article cards. Onboarding cards always sit at
 *   the top, regardless of any article rank scores below them.
 *
 * Editorial guardrails (`docs/CONTENT_AND_A11Y.md`):
 *
 * - Adding a topic means: register it here **and** add `title` /
 *   `body` (or `body.desktop` + `body.mobile` when
 *   `hasDeviceVariants`) and any CTA label to **both** locales. The
 *   drift-guard test (`tests/unit/onboarding-cards.test.ts`) fails
 *   loudly when either step is missing, so the visible cards cannot
 *   silently drop a translation.
 * - CTA hrefs are **internal absolute paths only** (`/feeds`,
 *   `/settings`, ...). External URLs are intentionally rejected to
 *   keep onboarding from shipping users out of the app.
 *
 * Mobile / desktop variants are selected at render time inside
 * `OnboardingCardView` via `matchMedia('(pointer: coarse)')`. Until
 * that query resolves, the renderer shows a DaisyUI skeleton placeholder
 * to avoid copy flicker on hydration.
 */

/** Stable identifiers for the onboarding card topics. */
export const ONBOARDING_TOPICS = [
    'intro',
    'sources',
    'scoring',
    'themes',
] as const
export type OnboardingTopic = (typeof ONBOARDING_TOPICS)[number]

/** Optional call-to-action attached to a card. Internal absolute paths only. */
export interface OnboardingCardCta {
    /** i18n key under `onboarding.<topic>.cta` resolving to the button label. */
    labelKey: string
    /** Internal route the CTA navigates to. Must start with `/`. */
    href: string
}

export interface OnboardingCard {
    topic: OnboardingTopic
    /**
     * Ordering in the inflow. Smaller values render first. Values are
     * stable across releases so existing tests / selectors do not
     * silently re-target a different card.
     */
    ordinal: number
    /**
     * `true` for cards whose copy genuinely differs by input device
     * (e.g. the `intro` card explains keyboard navigation on desktop
     * and tap navigation on mobile). Cards that do not need a variant
     * keep one flat `body` key in the i18n catalog.
     */
    hasDeviceVariants: boolean
    /** Optional CTA, e.g. "Add a feed" → `/feeds`. */
    cta?: OnboardingCardCta
}

/**
 * The catalog. **Order matters** — `ordinal` defines the visible
 * order; `intro` always comes first so the *Skip introduction*
 * button (rendered only on `intro`) is the first thing a new user
 * sees.
 */
export const ONBOARDING_CARDS: readonly OnboardingCard[] = [
    {
        topic: 'intro',
        ordinal: 0,
        hasDeviceVariants: true,
    },
    {
        topic: 'sources',
        ordinal: 1,
        hasDeviceVariants: false,
        cta: { labelKey: 'onboarding.sources.cta', href: '/feeds' },
    },
    {
        topic: 'scoring',
        ordinal: 2,
        hasDeviceVariants: false,
        cta: { labelKey: 'onboarding.scoring.cta', href: '/settings/privacy' },
    },
    {
        topic: 'themes',
        ordinal: 3,
        hasDeviceVariants: false,
        cta: { labelKey: 'onboarding.themes.cta', href: '/settings' },
    },
] as const

/** Returns the card for a topic, or `undefined` for unknown values. */
export function findOnboardingCard(topic: string): OnboardingCard | undefined {
    return ONBOARDING_CARDS.find((c) => c.topic === topic)
}

/** Internal route guard: catalog CTAs must never link off-site. */
export function isInternalCtaHref(href: string): boolean {
    if (typeof href !== 'string' || href.length === 0) return false
    if (!href.startsWith('/')) return false
    if (href.startsWith('//')) return false
    return true
}
