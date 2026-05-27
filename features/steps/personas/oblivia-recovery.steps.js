import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import {
  ConfirmPasswordRecovery,
  ConfirmRecoveryEmailVerification,
  EnterInvalidPasswordRecoveryCode,
  RememberPasswordRecoveryCode,
  RememberRecoveryEmailVerificationCode,
  RequestRecoveryEmailVerification,
  ResendRecoveryEmailVerification,
  SignOutOfInfl0,
  StartPasswordRecoveryWithRememberedEmail,
  StartPasswordRecoveryWithUnverifiedEmail,
  StartSignedInWithoutVerifiedRecoveryEmail,
  TryToVerifySameRecoveryEmailAgain,
  VerifyRecoveryEmailInSettings,
} from '../../support/screenplay/tasks/recovery-email.js'
import {
  ObliviaIsSignedIn,
  PasswordRecoveryFailed,
  RecoveryAlreadyVerified,
  RecoveryEmailIsVerified,
  RecoveryIsUnavailable,
} from '../../support/screenplay/questions/recovery-email.js'

Given('{word} is signed in to infl0 without a verified recovery email', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInWithoutVerifiedRecoveryEmail)
})

Given('{word} had verified a recovery email in settings', async function (name) {
  await actorCalled(this, name).attemptsTo(VerifyRecoveryEmailInSettings)
})

Given('{word} is signed out of infl0', async function (name) {
  await currentActor(this, name).attemptsTo(SignOutOfInfl0)
})

When('{word} requests verification for a recovery email address', async function (name) {
  await currentActor(this, name).attemptsTo(RequestRecoveryEmailVerification)
})

When('{word} resends the verification code for that recovery email', async function (name) {
  await currentActor(this, name).attemptsTo(ResendRecoveryEmailVerification)
})

When('{word} tries to verify the same recovery email again', async function (name) {
  await currentActor(this, name).attemptsTo(TryToVerifySameRecoveryEmailAgain)
})

Then('{word} should receive a verification code for that recovery email', async function (name) {
  await currentActor(this, name).attemptsTo(RememberRecoveryEmailVerificationCode)
})

When('{word} confirms the verification code in account settings', async function (name) {
  await currentActor(this, name).attemptsTo(ConfirmRecoveryEmailVerification)
})

Then('{word} should see the verified recovery email in account settings', async function (name) {
  await currentActor(this, name).asksFor(RecoveryEmailIsVerified)
})

When('{word} signs out of infl0', async function (name) {
  await currentActor(this, name).attemptsTo(SignOutOfInfl0)
})

When('{word} starts password recovery with that recovery email', async function (name) {
  await currentActor(this, name).attemptsTo(StartPasswordRecoveryWithRememberedEmail)
})

When('{word} starts password recovery with an unverified recovery email', async function (name) {
  await currentActor(this, name).attemptsTo(StartPasswordRecoveryWithUnverifiedEmail)
})

Then('{word} should receive a password recovery code for that recovery email', async function (name) {
  await currentActor(this, name).attemptsTo(RememberPasswordRecoveryCode)
})

When('{word} confirms the recovery code and sets a new password', async function (name) {
  await currentActor(this, name).attemptsTo(ConfirmPasswordRecovery)
})

When('{word} enters an invalid recovery code', async function (name) {
  await currentActor(this, name).attemptsTo(EnterInvalidPasswordRecoveryCode)
})

Then('{word} should be signed in to infl0', async function (name) {
  await currentActor(this, name).asksFor(ObliviaIsSignedIn)
})

Then('{word} should be told recovery is not available yet', async function (name) {
  await currentActor(this, name).asksFor(RecoveryIsUnavailable)
})

Then('{word} should be told that recovery email is already verified', async function (name) {
  await currentActor(this, name).asksFor(RecoveryAlreadyVerified)
})

Then('{word} should not be signed in to infl0', async function (name) {
  await currentActor(this, name).asksFor(PasswordRecoveryFailed)
})
