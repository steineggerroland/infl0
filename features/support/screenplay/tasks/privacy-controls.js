import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from '../../app-ready.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

const WIDE_VIEWPORT = { width: 1440, height: 900 }

export const PreparePrivacyReview = {
  async performAs(actor) {
    await BrowseTheWeb.as(actor).setViewportSize(WIDE_VIEWPORT)
  },
}

export const OpenReadingBehaviourTracking = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await page.goto('/settings#tracking')
    await waitForNuxtAppReady(page)
    await expect(page).toHaveURL(/\/settings#tracking$/u)
  },
}

export const NoteReadingBehaviourTrackingState = {
  async performAs(actor) {
    const toggle = BrowseTheWeb.as(actor).getByTestId('tracking-toggle')
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
    actor.remember('trackingToggleWasChecked', await toggle.isChecked())
  },
}

export const FlipReadingBehaviourTracking = {
  async performAs(actor) {
    const toggle = BrowseTheWeb.as(actor).getByTestId('tracking-toggle')
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
    await toggle.click()
  },
}

export const OpenPersonalizationExplainer = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await page.goto('/settings/personalization')
    await expect(page).toHaveURL(/\/settings\/personalization/u)
  },
}
