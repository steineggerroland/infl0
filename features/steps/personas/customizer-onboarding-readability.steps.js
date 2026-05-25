import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  PrepareOnboardingReadability,
  UseOnboardingReadabilityShortcut,
} from '../../support/screenplay/tasks/onboarding-readability.js'
import {
  OnboardingFontSizeResponds,
  OnboardingTypefaceResponds,
} from '../../support/screenplay/questions/onboarding-readability.js'

Given('{word} is tuning onboarding readability', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareOnboardingReadability)
})

When(
  '{word} uses {string} on the {string} side of the {string} onboarding card',
  async function (name, shortcut, surface, topic) {
    await currentActor(this, name).attemptsTo(UseOnboardingReadabilityShortcut(topic, surface, shortcut))
  },
)

Then('{word} should see onboarding font size respond', async function (name) {
  await currentActor(this, name).asksFor(OnboardingFontSizeResponds)
})

Then('{word} should see onboarding typeface respond', async function (name) {
  await currentActor(this, name).asksFor(OnboardingTypefaceResponds)
})
