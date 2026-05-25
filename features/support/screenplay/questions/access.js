import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const TimelineIsReachable = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page).toHaveURL(/\/(\?|$)/u)
    await expect(page.locator('.scroll-container')).toBeVisible({ timeout: 20_000 })
  },
}

export const SignInIsRequired = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page).toHaveURL(/\/login(?:[?#].*)?$/u)
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  },
}
