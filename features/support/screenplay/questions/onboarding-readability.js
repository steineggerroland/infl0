import { expect } from '@playwright/test'

function lastReadabilityChange(actor) {
  const change = actor.recall('onboardingReadability')
  if (!change) {
    throw new Error(`${actor.name} has no remembered onboarding readability change.`)
  }
  return change
}

export const OnboardingFontSizeResponds = {
  async answeredBy(actor) {
    const { shortcut, before, after } = lastReadabilityChange(actor)
    expect(after.fontSize).not.toBeNull()
    expect(before.fontSize).not.toBeNull()
    if (shortcut === '+') expect(after.fontSize).toBeGreaterThanOrEqual(before.fontSize)
    else if (shortcut === '-') expect(after.fontSize).toBeLessThanOrEqual(before.fontSize)
    else if (shortcut === '0') expect(after.fontSize).toBe(before.fontSize)
  },
}

export const OnboardingTypefaceResponds = {
  async answeredBy(actor) {
    const { after } = lastReadabilityChange(actor)
    expect(after.fontFamily).toBeTruthy()
  },
}
