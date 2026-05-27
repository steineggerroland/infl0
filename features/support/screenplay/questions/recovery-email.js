import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const RecoveryEmailIsVerified = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    const email = actor.recall('recoveryEmail')
    if (!email) throw new Error(`${actor.name} has no remembered recovery email.`)
    await expect(page.getByTestId('account-recovery-email')).toHaveText(email)
    await expect(page.getByTestId('account-recovery-email-status')).toContainText('Verified')
  },
}

export const RecoveryIsUnavailable = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page.getByTestId('password-reset-error')).toContainText('Recovery is not available', {
      timeout: 20_000,
    })
  },
}

export const PasswordRecoveryFailed = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page.getByTestId('password-reset-error')).toContainText('Invalid or expired code', {
      timeout: 20_000,
    })
    await expect(page).toHaveURL(/\/login(\?|$)/u)
  },
}

export const ObliviaIsSignedIn = {
  async answeredBy(actor) {
    const page = BrowseTheWeb.as(actor)
    await expect(page).toHaveURL(/\/(\?|$)/u)
    await expect(page.locator('details > summary').first()).toBeVisible({ timeout: 20_000 })
  },
}
