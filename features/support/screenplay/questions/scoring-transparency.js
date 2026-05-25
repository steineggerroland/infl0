import { expect } from '@playwright/test'
import { OnboardingJourney } from '../../onboarding-journey.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function onboarding(actor) {
  return new OnboardingJourney(BrowseTheWeb.as(actor))
}

export const ScoringFrontExplainsAlgorithmControl = {
  async answeredBy(actor) {
    const front = onboarding(actor).front('scoring')
    const back = onboarding(actor).back('scoring')
    const frontContent = ((await front.textContent()) ?? '').toLowerCase()
    const combined = `${frontContent} ${((await back.textContent()) ?? '').toLowerCase()}`
    expect(frontContent).toContain('the algorithm')
    expect(combined).toMatch(/(transparent)/u)
    expect(combined).toMatch(/(control|tune|adjust)/u)
  },
}

export const ScoringBackExplainsOptionalTracking = {
  async answeredBy(actor) {
    const content = (await onboarding(actor).back('scoring').textContent()) ?? ''
    expect(content).toMatch(/(optional|aktivier|enable tracking)/iu)
    expect(content).toMatch(/(improve|better)/iu)
  },
}

export const ScoringFullTextLinksControls = {
  async answeredBy(actor) {
    const fullText = onboarding(actor).fullText('scoring')
    await expect(fullText.locator('a[href="/settings#settings-sorting-heading"]').first()).toBeVisible()
    await expect(fullText.locator('a[href="/settings#settings-tracking-heading"]').first()).toBeVisible()
    await expect(fullText.locator('a[href="/settings/personalization"]').first()).toBeVisible()
    const content = (await fullText.textContent()) ?? ''
    expect(content).toMatch(/(recalculated|save)/iu)
  },
}

export const SortingControlsAreOpen = {
  async answeredBy(actor) {
    await expect(BrowseTheWeb.as(actor)).toHaveURL(/\/settings#settings-sorting-heading$/u)
  },
}
