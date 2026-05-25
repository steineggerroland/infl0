import { Then, When } from '@cucumber/cucumber'
import { currentActor } from '../../support/screenplay/actor.js'
import { OpenSignInOnPhone } from '../../support/screenplay/tasks/install-affordance.js'
import {
  InstallAffordanceIsAvailable,
  PhoneInstallLayoutIsReady,
} from '../../support/screenplay/questions/install-affordance.js'

When('{word} opens the sign-in page on a phone', async function (name) {
  await currentActor(this, name).attemptsTo(OpenSignInOnPhone)
})

Then('the browser should know how to install infl0 for {word}', async function (name) {
  await currentActor(this, name).asksFor(InstallAffordanceIsAvailable)
})

Then("{word} should see a layout that works for phone install", async function (name) {
  await currentActor(this, name).asksFor(PhoneInstallLayoutIsReady)
})
