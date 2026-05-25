import { Then, When } from '@cucumber/cucumber'
import { currentActor } from '../../support/screenplay/actor.js'
import { OpenAccountSettings } from '../../support/screenplay/tasks/account-settings.js'
import {
  RecoveryEmailMatchesRegistration,
  SignInNameMatchesRegistration,
} from '../../support/screenplay/questions/account-settings.js'

When('{word} opens account settings', async function (name) {
  await currentActor(this, name).attemptsTo(OpenAccountSettings)
})

Then('{word} should see their sign-in name in account settings', async function (name) {
  await currentActor(this, name).asksFor(SignInNameMatchesRegistration)
})

Then('{word} should see their recovery email in account settings', async function (name) {
  await currentActor(this, name).asksFor(RecoveryEmailMatchesRegistration)
})
