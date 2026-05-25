import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  ActivateScoringControlsCta,
  FlipScoringCard,
  OpenScoringFullText,
  PrepareScoringTransparency,
} from '../../support/screenplay/tasks/scoring-transparency.js'
import {
  ScoringBackExplainsOptionalTracking,
  ScoringFrontExplainsAlgorithmControl,
  ScoringFullTextLinksControls,
  SortingControlsAreOpen,
} from '../../support/screenplay/questions/scoring-transparency.js'

Given('{word} is reviewing scoring transparency in onboarding', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PrepareScoringTransparency)
})

When('{word} flips the scoring explanation', async function (name) {
  await currentActor(this, name).attemptsTo(FlipScoringCard)
})

When('{word} opens the scoring full text', async function (name) {
  await currentActor(this, name).attemptsTo(OpenScoringFullText)
})

When('{word} opens scoring controls from onboarding', async function (name) {
  await currentActor(this, name).attemptsTo(ActivateScoringControlsCta)
})

Then('{word} should see algorithm control explained', async function (name) {
  await currentActor(this, name).asksFor(ScoringFrontExplainsAlgorithmControl)
})

Then('{word} should see tracking described as optional but useful', async function (name) {
  await currentActor(this, name).asksFor(ScoringBackExplainsOptionalTracking)
})

Then('{word} should land on sorting controls', async function (name) {
  await currentActor(this, name).asksFor(SortingControlsAreOpen)
})

Then('{word} should see scoring links to the relevant controls', async function (name) {
  await currentActor(this, name).asksFor(ScoringFullTextLinksControls)
})
