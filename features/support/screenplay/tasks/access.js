import { expect } from '@playwright/test'
import {
  openRegistrationPage,
  registerFreshAccountViaUi,
} from '../../auth-ui.js'
import { waitForNuxtAppReady } from '../../app-ready.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function usernamePrefixFor(actor) {
  return `bdd-${actor.name.toLowerCase().replace(/[^a-z0-9]+/gu, '-') || 'reader'}`
}

async function registerActor(actor) {
  const page = BrowseTheWeb.as(actor)
  await openRegistrationPage(page)
  const credentials = await registerFreshAccountViaUi(page, {
    usernamePrefix: usernamePrefixFor(actor),
    displayName: actor.name,
    world: actor.world,
  })
  actor.remember('credentials', credentials)
  await expect(page).toHaveURL(/\/(\?|$)/u)
}

export const StartAsSignedOutVisitor = {
  async performAs(actor) {
    await BrowseTheWeb.withFreshSession(actor)
  },
}

export const RegisterForInfl0 = {
  async performAs(actor) {
    await registerActor(actor)
  },
}

export const HaveInfl0Account = {
  async performAs(actor) {
    await BrowseTheWeb.withFreshSession(actor)
    await registerActor(actor)
    await SignOutOfInfl0.performAs(actor)
  },
}

export const StartSignedInToInfl0 = {
  async performAs(actor) {
    await BrowseTheWeb.withFreshSession(actor)
    await registerActor(actor)
  },
}

export const SignInToInfl0 = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const credentials = actor.recall('credentials')
    if (!credentials?.username || !credentials?.password) {
      throw new Error(`${actor.name} has no remembered infl0 credentials.`)
    }

    await page.goto('/login')
    await expect(page).toHaveURL(/\/login(\?|$)/u)
    await waitForNuxtAppReady(page)
    await page.getByLabel('Username').fill(credentials.username)
    await page.locator('input[autocomplete="current-password"]').fill(credentials.password)
    await Promise.all([
      page.waitForURL(/\/(\?|$)/u, { timeout: 60_000 }),
      page.getByRole('button', { name: 'Sign in' }).click(),
    ])
  },
}

export const SignOutOfInfl0 = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const menuTrigger = page.locator('details > summary').first()
    await expect(menuTrigger).toBeVisible({ timeout: 15_000 })
    await menuTrigger.click()
    const logoutButton = page.getByRole('button', { name: /(log out|abmelden)/i }).first()
    await expect(logoutButton).toBeVisible()
    await Promise.all([
      page.waitForURL(/\/login(\?|$)/u),
      logoutButton.click(),
    ])
  },
}
