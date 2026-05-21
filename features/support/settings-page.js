import { expect } from '@playwright/test'

export class SettingsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  async hideOnboardingCards() {
    await this.page.goto('/settings#onboarding')
    const toggle = this.page.getByTestId('onboarding-visible-toggle')
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
    if (await toggle.isChecked()) {
      await toggle.click()
      await expect(toggle).not.toBeChecked({ timeout: 15_000 })
    }
  }

  async setReadingBehaviourTracking(enabled) {
    await this.page.goto('/settings#tracking')
    const toggle = this.page.getByTestId('tracking-toggle')
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
    const checked = await toggle.isChecked()
    if (checked !== enabled) {
      await toggle.click()
      await expect.poll(async () => toggle.isChecked(), { timeout: 15_000 }).toBe(enabled)
    }
  }
}
