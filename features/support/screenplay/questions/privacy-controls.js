import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const ReadingBehaviourTrackingControl = {
  async answeredBy(actor) {
    const toggle = BrowseTheWeb.as(actor).getByTestId('tracking-toggle')
    await expect(toggle).toBeVisible()
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
  },
}

export const ReadingBehaviourTrackingStateChanged = {
  async answeredBy(actor) {
    const before = actor.recall('trackingToggleWasChecked')
    if (typeof before !== 'boolean') {
      throw new Error(`${actor.name} has no remembered tracking toggle state.`)
    }
    const toggle = BrowseTheWeb.as(actor).getByTestId('tracking-toggle')
    await expect(toggle).toBeEnabled({ timeout: 20_000 })
    await expect.poll(async () => toggle.isChecked(), { timeout: 15_000 }).not.toBe(before)
  },
}

export const PersonalizationExplainer = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page.getByRole('heading', { level: 1, name: 'Why at the top?' })).toBeVisible({
      timeout: 20_000,
    })
    await expect(
      page.getByRole('heading', { name: 'How your timeline is being sorted right now' }),
    ).toBeVisible({ timeout: 20_000 })
  },
}
