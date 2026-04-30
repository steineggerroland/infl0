import { Given, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

Given('I am signed in with a fresh onboarding account', async function () {
  expect(this.page).toBeTruthy()
})

Given('I open the timeline', async function () {
  await this.page.goto('/')
})

Given('I start as a signed-out visitor', async function () {
  if (this.page) await this.page.close()
  if (this.context) await this.context.close()
  this.context = await this.browser.newContext({
    baseURL: this.baseURL,
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  this.page = await this.context.newPage()
})

Then('I should land on {string}', async function (urlPath) {
  const escaped = urlPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const hasExplicitSuffix = urlPath.includes('?') || urlPath.includes('#')
  const pattern = hasExplicitSuffix
    ? new RegExp(`${escaped}$`, 'u')
    : new RegExp(`${escaped}(?:[?#].*)?$`, 'u')
  await expect(this.page).toHaveURL(pattern)
})

Then('I should see a link to {string}', async function (href) {
  const openDialog = this.page.locator('dialog[open]').first()
  await expect(openDialog).toBeVisible()
  await expect(openDialog.locator(`a[href="${href}"]`).first()).toBeVisible()
})

Then('I should see the timeline screen', async function () {
  await expect(this.page).toHaveURL(/\/(\?|$)/u)
  const timelineContainer = this.page.locator('.scroll-container')
  await expect(timelineContainer).toBeVisible()
})
