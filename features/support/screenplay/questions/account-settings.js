import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const SignInNameMatchesRegistration = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    const credentials = actor.recall('credentials')
    if (!credentials?.username) {
      throw new Error(`${actor.name} has no remembered registration username.`)
    }
    const signInName = page.getByTestId('account-sign-in-name')
    await expect(signInName).toBeVisible()
    await expect(signInName).toHaveText(credentials.username)
  },
}

export const RecoveryEmailMatchesRegistration = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    const credentials = actor.recall('credentials')
    if (!credentials?.recoveryEmail) {
      throw new Error(`${actor.name} has no remembered recovery email.`)
    }
    const recoveryEmail = page.getByTestId('account-recovery-email')
    await expect(recoveryEmail).toBeVisible()
    await expect(recoveryEmail).toHaveText(credentials.recoveryEmail)
  },
}
