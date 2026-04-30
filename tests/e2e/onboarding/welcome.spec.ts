import { test, expect } from '@playwright/test'

/**
 * Keep this file as a smoke-only authed onboarding check for the
 * `chromium-onboarding` project. Detailed user behavior belongs to
 * executable BDD specs under `tests/bdd/features`.
 *
 * Purpose here: ensure the page loads for a fresh authed account and
 * the onboarding container renders without runtime regressions.
 */
test.describe('onboarding cards on a fresh account', () => {
  test('loads timeline and renders onboarding cards', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('[data-testid="onboarding-card"]')
    await expect(cards).toHaveCount(4)
    const intro = page.locator('[data-onboarding-topic="intro"]')
    await expect(intro).toBeVisible()
    await expect(page).toHaveURL(/\/(\?|$)/u)
  })
})
