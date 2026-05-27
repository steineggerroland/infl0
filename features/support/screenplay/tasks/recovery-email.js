import { expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import {
  openRegistrationPage,
  registerFreshAccountViaUi,
} from '../../auth-ui.js'
import { waitForNuxtAppReady } from '../../app-ready.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'
import { ReadOtpFromMailbox } from '../abilities/read-otp-from-mailbox.js'
import { SignOutOfInfl0 } from './access.js'
import { OpenAccountSettings } from './account-settings.js'

function usernamePrefixFor(actor) {
  return `bdd-${actor.name.toLowerCase().replace(/[^a-z0-9]+/gu, '-') || 'reader'}`
}

async function openRecoveryEmailEditor(page) {
  const editor = page.getByTestId('recovery-email-editor')
  if (!(await editor.isVisible())) {
    await page.getByTestId('edit-recovery-email').click()
    await expect(editor).toBeVisible()
  }
}

export const StartSignedInWithoutVerifiedRecoveryEmail = {
  async performAs(actor) {
    await BrowseTheWeb.withFreshSession(actor)
    const page = BrowseTheWeb.as(actor)
    await openRegistrationPage(page)
    const credentials = await registerFreshAccountViaUi(page, {
      usernamePrefix: usernamePrefixFor(actor),
      displayName: actor.name,
      recoveryEmail: '',
      world: actor.world,
    })
    actor.remember('credentials', credentials)
    await expect(page).toHaveURL(/\/(\?|$)/u)
  },
}

export const RequestRecoveryEmailVerification = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const email = ReadOtpFromMailbox.recoveryEmailFor(actor)
    actor.remember('recoveryEmail', email)
    await openRecoveryEmailEditor(page)
    await page.getByTestId('recovery-email-input').fill(email)
    await page.getByTestId('request-recovery-email-code').click()
    await expect(page.getByTestId('app-toast-success')).toContainText('verification code', {
      timeout: 20_000,
    })
    await expect(page.getByTestId('recovery-email-code')).toBeVisible()
    await expect(page.getByTestId('recovery-email-spam-hint')).toBeVisible()
  },
}

export const ResendRecoveryEmailVerification = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const resend = page.getByTestId('resend-recovery-email-code')
    await expect(resend).toBeEnabled({ timeout: 20_000 })
    await resend.click()
    await expect(page.getByTestId('app-toast-success')).toContainText('verification code', {
      timeout: 20_000,
    })
  },
}

export const TryToVerifySameRecoveryEmailAgain = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await openRecoveryEmailEditor(page)
    await expect(page.getByTestId('recovery-email-already-verified')).toBeVisible()
    await expect(page.getByTestId('request-recovery-email-code')).toBeDisabled()
  },
}

export const RememberRecoveryEmailVerificationCode = {
  async performAs(actor) {
    const email = actor.recall('recoveryEmail')
    if (!email) throw new Error(`${actor.name} has no remembered recovery email.`)
    actor.remember('recoveryEmailVerificationCode', await ReadOtpFromMailbox.latestCodeFor(email))
  },
}

export const ConfirmRecoveryEmailVerification = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const email = actor.recall('recoveryEmail')
    const code = actor.recall('recoveryEmailVerificationCode')
    if (!email) throw new Error(`${actor.name} has no remembered recovery email.`)
    if (!code) throw new Error(`${actor.name} has no remembered verification code.`)
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/auth/recovery-email/confirm') && r.request().method() === 'POST',
      ),
      page.getByTestId('recovery-email-code').fill(code),
    ])
    if (!response.ok()) {
      const body = await response.text()
      throw new Error(`Recovery email confirm failed (${response.status()}): ${body}`)
    }
    await expect(page.getByTestId('account-recovery-email')).toHaveText(email, { timeout: 20_000 })
    await expect(page.getByTestId('account-recovery-email-status')).toContainText('Verified', {
      timeout: 20_000,
    })
    await expect(page.getByTestId('recovery-email-editor')).toBeHidden()
  },
}

export const VerifyRecoveryEmailInSettings = {
  async performAs(actor) {
    await StartSignedInWithoutVerifiedRecoveryEmail.performAs(actor)
    await OpenAccountSettings.performAs(actor)
    await RequestRecoveryEmailVerification.performAs(actor)
    await RememberRecoveryEmailVerificationCode.performAs(actor)
    await ConfirmRecoveryEmailVerification.performAs(actor)
  },
}

export const StartPasswordRecoveryWithRememberedEmail = {
  async performAs(actor) {
    const email = actor.recall('recoveryEmail')
    if (!email) throw new Error(`${actor.name} has no remembered recovery email.`)
    const page = BrowseTheWeb.as(actor)
    await page.goto('/login')
    await waitForNuxtAppReady(page)
    await page.getByTestId('open-password-recovery').click()
    await page.getByTestId('password-reset-email').fill(email)
    await page.getByRole('button', { name: 'Send recovery code' }).click()
    await expect(page.getByTestId('password-reset-email-sent')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('password-reset-code')).toBeVisible()
    await expect(page.getByTestId('password-reset-spam-hint')).toBeVisible()
  },
}

export const StartPasswordRecoveryWithUnverifiedEmail = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const email = ReadOtpFromMailbox.recoveryEmailFor(actor)
    actor.remember('recoveryEmail', email)
    await page.goto('/login')
    await waitForNuxtAppReady(page)
    await page.getByTestId('open-password-recovery').click()
    await page.getByTestId('password-reset-email').fill(email)
    await page.getByRole('button', { name: 'Send recovery code' }).click()
  },
}

export const RememberPasswordRecoveryCode = {
  async performAs(actor) {
    const email = actor.recall('recoveryEmail')
    if (!email) throw new Error(`${actor.name} has no remembered recovery email.`)
    actor.remember('passwordRecoveryCode', await ReadOtpFromMailbox.latestCodeFor(email))
  },
}

export const ConfirmPasswordRecovery = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const code = actor.recall('passwordRecoveryCode')
    if (!code) throw new Error(`${actor.name} has no remembered recovery code.`)
    const newPassword = randomBytes(12).toString('hex')
    actor.remember('newPassword', newPassword)
    await page.getByTestId('password-reset-code').fill(code)
    await page.getByTestId('password-reset-password').fill(newPassword)
    await Promise.all([
      page.waitForURL(/\/(\?|$)/u, { timeout: 60_000 }),
      page.getByRole('button', { name: 'Reset password' }).click(),
    ])
  },
}

export const EnterInvalidPasswordRecoveryCode = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await page.getByTestId('password-reset-code').fill('000000')
    await page.getByTestId('password-reset-password').fill(randomBytes(12).toString('hex'))
    await page.getByRole('button', { name: 'Reset password' }).click()
  },
}

export { SignOutOfInfl0 }
