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
 *   emailPrefix?: string
 *   displayName?: string
 *   world?: { registeredEmail?: string, registeredPassword?: string }
 * }} [options]
 */
export async function registerFreshAccountViaUi(page, options = {}) {
  const inviteCode = requireRegistrationInviteCode()
  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
  const prefix = options.emailPrefix ?? 'bdd-register'
  const email = `${prefix}-${unique}@neurospicy.icu`
  const password = randomBytes(16).toString('hex')
  const name = options.displayName ?? 'BDD Register User'

  if (options.world) {
    options.world.registeredEmail = email
    options.world.registeredPassword = password
  }

  await page.getByLabel('Invite code').fill(inviteCode)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Name (optional)').fill(name)
  await page.locator('input[autocomplete="new-password"]').fill(password)
  await Promise.all([
    page.waitForURL(/\/(\?|$)/u, { timeout: 60_000 }),
    page.getByRole('button', { name: 'Register' }).click(),
  ])

  return { email, password }
}
