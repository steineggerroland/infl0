import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  FlipReadingBehaviourTracking,
  NoteReadingBehaviourTrackingState,
  OpenPersonalizationExplainer,
  OpenReadingBehaviourTracking,
  PreparePrivacyReview,
} from '../../support/screenplay/tasks/privacy-controls.js'
import {
  PersonalizationExplainer,
  ReadingBehaviourTrackingControl,
  ReadingBehaviourTrackingStateChanged,
} from '../../support/screenplay/questions/privacy-controls.js'

Given('{word} is a privacy-sensitive reader', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0, PreparePrivacyReview)
})

When('{word} reviews reading behaviour tracking', async function (name) {
  await currentActor(this, name).attemptsTo(OpenReadingBehaviourTracking)
})

When('{word} notes whether reading behaviour tracking is enabled', async function (name) {
  await currentActor(this, name).attemptsTo(NoteReadingBehaviourTrackingState)
})

When('{word} changes reading behaviour tracking', async function (name) {
  await currentActor(this, name).attemptsTo(FlipReadingBehaviourTracking)
})

When('{word} opens personalization', async function (name) {
  await currentActor(this, name).attemptsTo(OpenPersonalizationExplainer)
})

Then('{word} should see the reading behaviour tracking control', async function (name) {
  await currentActor(this, name).asksFor(ReadingBehaviourTrackingControl)
})

Then("{word}'s reading behaviour tracking choice should change", async function (name) {
  await currentActor(this, name).asksFor(ReadingBehaviourTrackingStateChanged)
})

Then('{word} should see the personalization explainer', async function (name) {
  await currentActor(this, name).asksFor(PersonalizationExplainer)
})
