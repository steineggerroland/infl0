import { Given, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import {
  openRegistrationPage,
  registerFreshAccountViaUi,
} from '../support/auth-ui.js'
import { waitForNuxtAppReady } from '../support/app-ready.js'

When('I open the registration page', async function () {
  await openRegistrationPage(this.page)
})

When('I open the login page', async function () {
  await this.page.goto('/login')
  await expect(this.page).toHaveURL(/\/login(\?|$)/u)
  await waitForNuxtAppReady(this.page)
})

When('I register with a fresh valid account', async function () {
  await registerFreshAccountViaUi(this.page, { world: this })
})

Given('I have a freshly registered account credentials', async function () {
  await openRegistrationPage(this.page)
  await registerFreshAccountViaUi(this.page, {
    emailPrefix: 'bdd-auth',
    displayName: 'BDD Auth User',
    world: this,
  })

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

When('I sign in with my registered account', async function () {
  if (!this.registeredEmail || !this.registeredPassword) {
    throw new Error('No registered account credentials in world state.')
  }
  await this.page.getByLabel('Email').fill(this.registeredEmail)
  await this.page.locator('input[autocomplete="current-password"]').fill(this.registeredPassword)
  await Promise.all([
    this.page.waitForURL(/\/(\?|$)/u, { timeout: 60_000 }),
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
