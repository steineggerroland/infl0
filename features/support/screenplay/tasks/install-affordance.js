import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from '../../app-ready.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

const PHONE_VIEWPORT = { width: 390, height: 844 }

export const OpenSignInOnPhone = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await page.setViewportSize(PHONE_VIEWPORT)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login(\?|$)/u)
    await waitForNuxtAppReady(page)
  },
}
