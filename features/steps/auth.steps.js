import { Given, When } from '@cucumber/cucumber'
import { expect, request } from '@playwright/test'
import { createVerifierAndSalt, SRPParameters, SRPRoutines } from 'tssrp6a'
import { randomBytes } from 'node:crypto'

async function registerFreshAccountViaApi(baseURL, inviteCode) {
  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
  const email = `bdd-auth-${unique}@neurospicy.icu`
  const password = randomBytes(16).toString('hex')
  const name = 'BDD Auth User'
  const routines = new SRPRoutines(new SRPParameters())
  const { s, v } = await createVerifierAndSalt(routines, email, password)

  const api = await request.newContext({ baseURL })
  const registerRes = await api.post('/api/auth/srp/register', {
    data: {
      email,
      name,
      saltHex: s.toString(16),
      verifierHex: v.toString(16),
      inviteCode,
    },
  })
  if (!registerRes.ok()) {
    const body = await registerRes.text()
    throw new Error(`SRP register failed (${registerRes.status()}): ${body}`)
  }
  await api.dispose()
  return { email, password }
}

When('I open the registration page', async function () {
  await this.page.goto('/register')
  await expect(this.page).toHaveURL(/\/register(\?|$)/u)
})

When('I open the login page', async function () {
  await this.page.goto('/login')
  await expect(this.page).toHaveURL(/\/login(\?|$)/u)
})

When('I register with a fresh valid account', async function () {
  const inviteCode = process.env.NUXT_REGISTRATION_INVITE_CODE
  if (!inviteCode || inviteCode.trim().length === 0) {
    throw new Error('NUXT_REGISTRATION_INVITE_CODE is required for auth BDD tests.')
  }
  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`
  const email = `bdd-register-${unique}@neurospicy.icu`
  const password = randomBytes(16).toString('hex')
  const name = 'BDD Register User'
  this.registeredEmail = email
  this.registeredPassword = password

  await this.page.getByLabel('Invite code').fill(inviteCode)
  await this.page.getByLabel('Email').fill(email)
  await this.page.getByLabel('Name (optional)').fill(name)
  await this.page.locator('input[autocomplete="new-password"]').fill(password)
  await Promise.all([
    this.page.waitForURL(/\/(\?|$)/u),
    this.page.getByRole('button', { name: 'Register' }).click(),
  ])
})

Given('I have a freshly registered account credentials', async function () {
  const inviteCode = process.env.NUXT_REGISTRATION_INVITE_CODE
  if (!inviteCode || inviteCode.trim().length === 0) {
    throw new Error('NUXT_REGISTRATION_INVITE_CODE is required for auth BDD tests.')
  }
  const creds = await registerFreshAccountViaApi(this.baseURL, inviteCode)
  this.registeredEmail = creds.email
  this.registeredPassword = creds.password
})

When('I sign in with my registered account', async function () {
  if (!this.registeredEmail || !this.registeredPassword) {
    throw new Error('No registered account credentials in world state.')
  }
  await this.page.getByLabel('Email').fill(this.registeredEmail)
  await this.page.locator('input[autocomplete="current-password"]').fill(this.registeredPassword)
  await Promise.all([
    this.page.waitForURL(/\/(\?|$)/u),
    this.page.getByRole('button', { name: 'Sign in' }).click(),
  ])
})

When('I log out', async function () {
  const menuTrigger = this.page.locator('details > summary').first()
  await expect(menuTrigger).toBeVisible()
  await menuTrigger.click()
  const logoutButton = this.page.getByRole('button', { name: /(log out|abmelden)/i }).first()
  await expect(logoutButton).toBeVisible()
  await Promise.all([
    this.page.waitForURL(/\/login(\?|$)/u),
    logoutButton.click(),
  ])
})
