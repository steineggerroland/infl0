import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from '../support/app-ready.js'

const WIDE_VIEWPORT = { width: 1440, height: 900 }
const CARD_FRONT = 'card-front'
const TYPEFACE_VALUE_BY_LABEL = {
  'System Sans (device)': 'system-sans',
  'System Serif (device)': 'system-serif',
  'System Monospace (device)': 'system-mono',
  Inter: 'inter',
  'Source Sans 3': 'source-sans-3',
  'Source Serif 4': 'source-serif-4',
  'Atkinson Hyperlegible': 'atkinson',
  Lexend: 'lexend',
  OpenDyslexic: 'opendyslexic',
  'IBM Plex Sans': 'ibm-plex',
  Fraunces: 'fraunces',
}

function startsWithAccessibleName(text) {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped}(?:\\b|\\s|$)`, 'u')
}

function cardFrontGroup(page) {
  return page.getByTestId(`surface-group-${CARD_FRONT}`)
}

/** Preset swatches are `<button role="radio">` with `aria-checked`; extra options are native `<input type="radio">`. */
function themePaletteControl(page, label) {
  const control = page.getByTestId('theme-control')
  if (label === 'Custom colours') {
    return control.getByTestId('theme-option-custom')
  }
  return control.getByRole('radio', { name: label })
}

async function expectThemePaletteSelected(locator) {
  const testId = await locator.getAttribute('data-testid')
  if (testId === 'theme-option-custom' || testId === 'theme-option-high-contrast') {
    await expect(locator).toBeChecked()
    return
  }
  await expect(locator).toHaveAttribute('aria-checked', 'true')
}

Given('I use a wide viewport for the settings layout', async function () {
  await this.page.setViewportSize(WIDE_VIEWPORT)
})

Given('I open the settings page', async function () {
  await this.page.goto('/settings')
  await expect(this.page).toHaveURL(/\/settings(?:[?#]|$)/u)
  await waitForNuxtAppReady(this.page)
})

When('I reload the settings page', async function () {
  await this.page.reload()
  await waitForNuxtAppReady(this.page)
  await expect(this.page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible({
    timeout: 20_000,
  })
})

When('I open settings at {string}', async function (path) {
  await this.page.goto(path)
  await waitForNuxtAppReady(this.page)
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

When('I choose {string} as display appearance', async function (label) {
  const radio = this.page
    .getByTestId('appearance-control')
    .getByRole('radio', { name: startsWithAccessibleName(label) })
  await radio.check()
  await expect(radio).toBeChecked({ timeout: 15_000 })
})

Then('{string} should still be the display appearance', async function (label) {
  const radio = this.page
    .getByTestId('appearance-control')
    .getByRole('radio', { name: startsWithAccessibleName(label) })
  await expect(radio).toBeChecked()
})

When('I choose the colour palette {string}', async function (label) {
  const control = themePaletteControl(this.page, label)
  await control.click()
  await expectThemePaletteSelected(control)
})

When('I choose custom colours as colour palette', async function () {
  const radio = this.page.getByTestId('theme-option-custom')
  await radio.check()
  await expect(radio).toBeChecked({ timeout: 15_000 })
})

Then('the colour palette {string} should still be selected', async function (label) {
  await expectThemePaletteSelected(themePaletteControl(this.page, label))
})

When('I choose {string} as motion preference', async function (label) {
  const radio = this.page
    .getByTestId('motion-control')
    .getByRole('radio', { name: startsWithAccessibleName(label) })
  await radio.check()
  await expect(radio).toBeChecked({ timeout: 15_000 })
})

Then('{string} should still be the motion preference', async function (label) {
  const radio = this.page
    .getByTestId('motion-control')
    .getByRole('radio', { name: startsWithAccessibleName(label) })
  await expect(radio).toBeChecked()
})

When('I set the card front typeface to {string}', async function (label) {
  const value = TYPEFACE_VALUE_BY_LABEL[label]
  if (!value) throw new Error(`No test mapping for typeface "${label}".`)
  const select = cardFrontGroup(this.page).getByTestId(`font-family-${CARD_FRONT}`)
  await select.selectOption({ label })
  await expect(select).toHaveValue(value, { timeout: 15_000 })
})

Then('the card front typeface should still be {string}', async function (label) {
  const value = TYPEFACE_VALUE_BY_LABEL[label]
  if (!value) throw new Error(`No test mapping for typeface "${label}".`)
  const select = cardFrontGroup(this.page).getByTestId(`font-family-${CARD_FRONT}`)
  await expect(select).toHaveValue(value)
})

When('I set the card front text size to {int} px', async function (size) {
  const input = cardFrontGroup(this.page).getByTestId(`font-size-num-${CARD_FRONT}`)
  await input.fill(String(size))
  await input.dispatchEvent('change')
  await expect(input).toHaveValue(String(size), { timeout: 15_000 })
})

Then('the card front text size should still be {int} px', async function (size) {
  const input = cardFrontGroup(this.page).getByTestId(`font-size-num-${CARD_FRONT}`)
  await expect(input).toHaveValue(String(size))
})

Then('I should see colour controls for the card front', async function () {
  await expect(cardFrontGroup(this.page).getByTestId(`custom-colors-${CARD_FRONT}`)).toBeVisible()
})

When('I set the card front background colour to {string}', async function (hex) {
  const normalized = hex.toLowerCase()
  const input = cardFrontGroup(this.page).getByTestId(`custom-color-bg-${CARD_FRONT}`)
  await input.evaluate((el, value) => {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, normalized)
  await expect(input).toHaveValue(normalized, { timeout: 15_000 })
})

Then('the card front background colour should still be {string}', async function (hex) {
  const input = cardFrontGroup(this.page).getByTestId(`custom-color-bg-${CARD_FRONT}`)
  await expect(input).toHaveValue(hex.toLowerCase())
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
