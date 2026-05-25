import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const InstallAffordanceIsAvailable = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      /manifest\.webmanifest/u,
    )
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1)
  },
}

export const PhoneInstallLayoutIsReady = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/u,
    )
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1)
  },
}
