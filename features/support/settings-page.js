import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'

export class SettingsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  async openAccount() {
    await this.page.goto('/settings#account')
    await waitForNuxtAppReady(this.page)
    await expect(this.page.getByTestId('account-sign-in-name')).toBeVisible({ timeout: 20_000 })
  }

  async hideOnboardingCards() {
    await this.page.goto('/settings#onboarding')
    await waitForNuxtAppReady(this.page)
    const toggle = this.page.getByTestId('onboarding-visible-toggle')
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
    if (await toggle.isChecked()) {
      await toggle.click()
      await expect(toggle).not.toBeChecked({ timeout: 15_000 })
    }
  }

  async setReadingBehaviourTracking(enabled) {
    await this.page.goto('/settings#tracking')
    await waitForNuxtAppReady(this.page)
    const toggle = this.page.getByTestId('tracking-toggle')
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
    const checked = await toggle.isChecked()
    if (checked !== enabled) {
      await toggle.click()
      await expect.poll(async () => toggle.isChecked(), { timeout: 15_000 }).toBe(enabled)
    }
  }
}
