import { test, expect } from '@playwright/test'

/**
 * Authenticated-only checks (`chromium-authed` project). Requires
 * `tests/e2e/.auth/dev.json` from `auth.setup.ts` + seeded `dev@localhost`.
 */
test.describe('app layout (signed in)', () => {
  test('privacy page loads and exposes settings footer landmark', async ({ page }) => {
    await page.goto('/settings/privacy')
    await expect(page.locator('main#main')).toHaveCount(1)
    const footer = page.locator('[data-testid="settings-page-footer"]')
    await expect(footer).toBeVisible()
    await expect(footer.getByRole('navigation')).toBeVisible()
  })

  test('feeds page exposes footer shortcuts landmark', async ({ page }) => {
    await page.goto('/feeds')
    await expect(page.locator('main#main')).toHaveCount(1)
    const footer = page.locator('[data-testid="feeds-page-footer"]')
    await expect(footer).toBeVisible()
    await expect(footer.getByRole('navigation')).toBeVisible()
  })
})
