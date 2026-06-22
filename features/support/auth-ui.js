/**
 * Shared registration UI flow for BDD (single source for form fill + submit).
 */

import { expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { waitForNuxtAppReady } from './app-ready.js'

export function requireRegistrationInviteCode() {
  const inviteCode = process.env.NUXT_REGISTRATION_INVITE_CODE?.trim()
  if (!inviteCode) {
    throw new Error('NUXT_REGISTRATION_INVITE_CODE is required for registration BDD tests.')
  }
  return inviteCode
}

/** @param {import('@playwright/test').Page} page */
export async function openRegistrationPage(page) {
  await page.goto('/register')
  await expect(page).toHaveURL(/\/register(\?|$)/u)
  await waitForNuxtAppReady(page)
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{
 *   usernamePrefix?: string
 *   displayName?: string
 *   recoveryEmail?: string
 *   world?: {
 *     registeredUsername?: string
 *     registeredPassword?: string
 *     registeredRecoveryEmail?: string
 *   }
 * }} [options]
 */
export async function registerFreshAccountViaUi(page, options = {}) {
  const inviteCode = requireRegistrationInviteCode()
  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
  const prefix = options.usernamePrefix ?? options.emailPrefix ?? 'bdd-register'
  const username = `${prefix}-${unique}`.toLowerCase().replace(/[^a-z0-9._-]+/gu, '-').replace(/^-|-$/gu, '')
  const password = randomBytes(16).toString('hex')
  const name = options.displayName ?? 'BDD Register User'
  const recoveryEmail =
    options.recoveryEmail ?? `${prefix}-recovery-${unique}@neurospicy.icu`

  if (options.world) {
    options.world.registeredUsername = username
    options.world.registeredPassword = password
    options.world.registeredRecoveryEmail = recoveryEmail
    options.world.registeredEmail = recoveryEmail
  }

  await page.getByLabel('Invite code').fill(inviteCode)
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Recovery email (optional)').fill(recoveryEmail)
  await page.getByLabel('Display name (optional)').fill(name)
  await page.locator('input[autocomplete="new-password"]').fill(password)
  // Use waitForFunction because waitForURL with negative lookahead can be flaky
  await page.getByRole('button', { name: 'Register' }).click()
  await page.waitForFunction(
    () => !window.location.pathname.startsWith('/register'),
    { timeout: 60_000 },
  )

  return { username, password, recoveryEmail }
}
