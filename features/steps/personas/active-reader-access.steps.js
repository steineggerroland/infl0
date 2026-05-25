import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import {
  HaveInfl0Account,
  SignInToInfl0,
  SignOutOfInfl0,
  StartSignedInToInfl0,
  StartAsSignedOutVisitor,
} from '../../support/screenplay/tasks/access.js'
import {
  SignInIsRequired,
  TimelineIsReachable,
} from '../../support/screenplay/questions/access.js'

Given('{word} has an infl0 account', async function (name) {
  await actorCalled(this, name).attemptsTo(HaveInfl0Account)
})

Given('{word} starts as a signed-out visitor', async function (name) {
  await actorCalled(this, name).attemptsTo(StartAsSignedOutVisitor)
})

Given('{word} is signed in to infl0', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0)
})

When('{word} signs in to infl0', async function (name) {
  await currentActor(this, name).attemptsTo(SignInToInfl0)
})

When('{word} signs out', async function (name) {
  await currentActor(this, name).attemptsTo(SignOutOfInfl0)
})

Then('{word} should reach their timeline', async function (name) {
  await currentActor(this, name).asksFor(TimelineIsReachable)
})

Then('{word} should be asked to sign in before reading', async function (name) {
  await currentActor(this, name).asksFor(SignInIsRequired)
})
