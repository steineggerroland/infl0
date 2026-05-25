import { expect } from '@playwright/test'
import { OnboardingJourney } from '../../onboarding-journey.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function onboarding(actor) {
  return new OnboardingJourney(BrowseTheWeb.as(actor))
}

export const PrepareScoringTransparency = {
  async performAs(actor) {
    await onboarding(actor).focusTopic('scoring')
  },
}

export const FlipScoringCard = {
  async performAs(actor) {
    await onboarding(actor).flipTopic('scoring')
  },
}

export const OpenScoringFullText = {
  async performAs(actor) {
    await onboarding(actor).openFullText('scoring')
  },
}

export const ActivateScoringControlsCta = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const cta = onboarding(actor).card('scoring').locator('.onboarding-front [data-onboarding-cta="scoring"]')
    await expect(cta).toBeVisible()
    await Promise.all([
      page.waitForURL(/\/settings#settings-sorting-heading$/u),
      cta.evaluate((el) => el.click()),
    ])
  },
}
