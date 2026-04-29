import { test, expect } from '@playwright/test'

/**
 * Authenticated-only inflow check for the `chromium-onboarding`
 * Playwright project. Requires `tests/e2e/.auth/onboarding-<workerIndex>.json`
 * from `onboarding-auth.setup.ts` (fresh SRP sign-up per worker).
 *
 * The spec asserts the contract from
 * `docs/planned/onboarding-and-inflow-cards.md`:
 *
 * 1. After sign-up, `/` renders the four onboarding cards in
 *    `intro → sources → scoring → themes` order with stable selectors.
 * 2. The `intro` card carries the *Skip introduction* button.
 * 3. The `sources` card's CTA navigates to `/feeds`.
 *
 * Skipping onboarding is intentionally NOT exercised here so re-runs
 * stay idempotent on the same fresh account. The skip behaviour is
 * pinned in tests/component/OnboardingCardView.test.ts and
 * tests/component/SettingsIndexPage.test.ts.
 */
test.describe('onboarding cards on a fresh account', () => {
  test('prepends the four cards in order at the top of the inflow', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('[data-testid="onboarding-card"]')
    await expect(cards).toHaveCount(4)
    const topics = await cards.evaluateAll((els) =>
      els.map((el) => (el as HTMLElement).getAttribute('data-onboarding-topic')),
    )
    expect(topics).toEqual(['intro', 'sources', 'scoring', 'themes'])
  })

  test('the intro card exposes the *Skip introduction* button', async ({ page }) => {
    await page.goto('/')
    const intro = page.locator('[data-onboarding-topic="intro"]')
    await expect(intro).toBeVisible()
    await expect(intro.locator('[data-onboarding-skip]')).toBeVisible()
  })

  test('the sources card CTA navigates to /feeds', async ({ page }) => {
    await page.goto('/')
    const sourcesCard = page.locator('[data-onboarding-topic="sources"]').first()
    await expect(sourcesCard).toBeVisible()
    await sourcesCard.scrollIntoViewIfNeeded()
    // Scope to the front surface of the sources card so we avoid duplicate CTA refs.
    const cta = sourcesCard.locator('.onboarding-front [data-onboarding-cta="sources"]')
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/feeds')
    await Promise.all([
      page.waitForURL(/\/feeds(\?|$)/u),
      cta.evaluate((el) => (el as HTMLAnchorElement).click()),
    ])
  })
})
