import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

const WIDE_VIEWPORT = { width: 1440, height: 900 }

Given('I use a wide viewport for the settings layout', async function () {
  await this.page.setViewportSize(WIDE_VIEWPORT)
})

Given('I open the settings page', async function () {
  await this.page.goto('/settings')
  await expect(this.page).toHaveURL(/\/settings(?:[?#]|$)/u)
})

When('I open settings at {string}', async function (path) {
  await this.page.goto(path)
})

When('I follow the settings hub link {string}', async function (slug) {
  const testId = `settings-nav-link-${slug}`
  const link = this.page.getByTestId(testId)
  await expect(link).toBeVisible()
  await Promise.all([
    this.page.waitForURL(new RegExp(`/settings#${slug}$`, 'u')),
    link.click(),
  ])
})

Then('I should see the appearance settings control', async function () {
  await expect(this.page.getByTestId('appearance-control')).toBeVisible()
})

Then('I should see the sorting section heading', async function () {
  await expect(this.page.locator('#settings-sorting-heading')).toBeVisible()
})

Then('I should see the theme settings control', async function () {
  await expect(this.page.getByTestId('theme-control')).toBeVisible()
})

Then('I should see the reading behaviour tracking toggle', async function () {
  const toggle = this.page.getByTestId('tracking-toggle')
  await expect(toggle).toBeVisible()
  await expect(toggle).toBeEnabled({ timeout: 20_000 })
})

Then('I note whether reading behaviour tracking is enabled', async function () {
  const toggle = this.page.getByTestId('tracking-toggle')
  await expect(toggle).toBeEnabled({ timeout: 20_000 })
  this.trackingToggleWasChecked = await toggle.isChecked()
})

When('I flip the reading behaviour tracking toggle', async function () {
  const toggle = this.page.getByTestId('tracking-toggle')
  await expect(toggle).toBeEnabled({ timeout: 20_000 })
  await toggle.click()
})

Then('the reading behaviour tracking toggle should differ from the noted state', async function () {
  const before = this.trackingToggleWasChecked
  if (typeof before !== 'boolean') {
    throw new Error('Call “I note whether reading behaviour tracking is enabled” first.')
  }
  const toggle = this.page.getByTestId('tracking-toggle')
  await expect(toggle).toBeEnabled({ timeout: 20_000 })
  await expect.poll(async () => toggle.isChecked(), { timeout: 15_000 }).not.toBe(before)
})

When('I open the personalization page', async function () {
  await this.page.goto('/settings/personalization')
  await expect(this.page).toHaveURL(/\/settings\/personalization/u)
})

Then('I should see the personalization page title', async function () {
  await expect(this.page.getByRole('heading', { level: 1, name: 'Why at the top?' })).toBeVisible({
    timeout: 20_000,
  })
})

Then('I should see the algorithm snapshot heading', async function () {
  await expect(
    this.page.getByRole('heading', { name: 'How your timeline is being sorted right now' }),
  ).toBeVisible({ timeout: 20_000 })
})
