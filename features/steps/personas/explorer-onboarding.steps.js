import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { OnboardingJourney } from '../../support/onboarding-journey.js'
import { RegisterForInfl0 } from '../../support/screenplay/tasks/access.js'

const ONBOARDING_TOPICS = ['intro', 'sources', 'scoring', 'themes']
const FULL_TEXT_TOPICS = ['intro', 'scoring']

When('{word} moves through every onboarding card', async function (name) {
  const actor = actorCalled(this, name)
  if (!actor.recall('credentials')) {
    await actor.attemptsTo(RegisterForInfl0)
  }
  const journey = new OnboardingJourney(this.page)
  for (const topic of ONBOARDING_TOPICS) {
    await journey.focusTopic(topic)
    await journey.flipTopic(topic)
  }
})

When('{word} opens full text where explanations are available', async function (name) {
  currentActor(this, name)
  const journey = new OnboardingJourney(this.page)
  for (const topic of FULL_TEXT_TOPICS) {
    await journey.openFullText(topic)
    await this.page.keyboard.press('Escape')
    await expect(journey.fullText(topic)).toHaveCount(0, { timeout: 10_000 })
  }
})

Then('{word} should understand sources, scoring, themes, and help', async function (name) {
  currentActor(this, name)
  const journey = new OnboardingJourney(this.page)
  await journey.expectTopicsInOrder()

  const expectations = [
    ['sources', /source|feed|quelle/i],
    ['scoring', /score|rank|sort|gewicht/i],
    ['themes', /colour|color|palette|style|lighting|farbe|thema/i],
    ['intro', /card|karte|flip|shortcut|taste/i],
  ]

  for (const [topic, pattern] of expectations) {
    await journey.focusTopic(topic)
    const text = (await journey.back(topic).textContent()) ?? ''
    expect(text).toMatch(pattern)
  }
})
