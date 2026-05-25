import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'

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

async function expectThemePaletteSelected(locator) {
  const testId = await locator.getAttribute('data-testid')
  if (testId === 'theme-option-custom' || testId === 'theme-option-high-contrast') {
    await expect(locator).toBeChecked()
    return
  }
  await expect(locator).toHaveAttribute('aria-checked', 'true')
}

export class DisplaySettingsPanel {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  cardFrontGroup() {
    return this.page.getByTestId(`surface-group-${CARD_FRONT}`)
  }

  themePaletteControl(label) {
    const control = this.page.getByTestId('theme-control')
    if (label === 'Custom colours') {
      return control.getByTestId('theme-option-custom')
    }
    return control.getByRole('radio', { name: label })
  }

  async open() {
    await this.page.goto('/settings')
    await expect(this.page).toHaveURL(/\/settings(?:[?#]|$)/u)
    await waitForNuxtAppReady(this.page)
  }

  async reload() {
    await this.page.reload()
    await waitForNuxtAppReady(this.page)
    await expect(this.page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible({
      timeout: 20_000,
    })
  }

  async chooseAppearance(label) {
    const radio = this.page
      .getByTestId('appearance-control')
      .getByRole('radio', { name: startsWithAccessibleName(label) })
    await radio.check()
    await expect(radio).toBeChecked({ timeout: 15_000 })
  }

  async expectAppearance(label) {
    const radio = this.page
      .getByTestId('appearance-control')
      .getByRole('radio', { name: startsWithAccessibleName(label) })
    await expect(radio).toBeChecked()
  }

  async choosePalette(label) {
    const control = this.themePaletteControl(label)
    await control.click()
    await expectThemePaletteSelected(control)
  }

  async chooseCustomColours() {
    const radio = this.page.getByTestId('theme-option-custom')
    await radio.check()
    await expect(radio).toBeChecked({ timeout: 15_000 })
  }

  async expectPalette(label) {
    await expectThemePaletteSelected(this.themePaletteControl(label))
  }

  async chooseMotion(label) {
    const radio = this.page
      .getByTestId('motion-control')
      .getByRole('radio', { name: startsWithAccessibleName(label) })
    await radio.check()
    await expect(radio).toBeChecked({ timeout: 15_000 })
  }

  async expectMotion(label) {
    const radio = this.page
      .getByTestId('motion-control')
      .getByRole('radio', { name: startsWithAccessibleName(label) })
    await expect(radio).toBeChecked()
  }

  async setCardFrontTypeface(label) {
    const value = TYPEFACE_VALUE_BY_LABEL[label]
    if (!value) throw new Error(`No test mapping for typeface "${label}".`)
    const select = this.cardFrontGroup().getByTestId(`font-family-${CARD_FRONT}`)
    await select.selectOption({ label })
    await expect(select).toHaveValue(value, { timeout: 15_000 })
  }

  async expectCardFrontTypeface(label) {
    const value = TYPEFACE_VALUE_BY_LABEL[label]
    if (!value) throw new Error(`No test mapping for typeface "${label}".`)
    const select = this.cardFrontGroup().getByTestId(`font-family-${CARD_FRONT}`)
    await expect(select).toHaveValue(value)
  }

  async setCardFrontTextSize(size) {
    const input = this.cardFrontGroup().getByTestId(`font-size-num-${CARD_FRONT}`)
    await input.fill(String(size))
    await input.dispatchEvent('change')
    await expect(input).toHaveValue(String(size), { timeout: 15_000 })
  }

  async expectCardFrontTextSize(size) {
    const input = this.cardFrontGroup().getByTestId(`font-size-num-${CARD_FRONT}`)
    await expect(input).toHaveValue(String(size))
  }

  async expectCardFrontColourControls() {
    await expect(this.cardFrontGroup().getByTestId(`custom-colors-${CARD_FRONT}`)).toBeVisible()
  }

  async setCardFrontBackground(hex) {
    const normalized = hex.toLowerCase()
    const input = this.cardFrontGroup().getByTestId(`custom-color-bg-${CARD_FRONT}`)
    await input.evaluate((el, value) => {
      el.value = value
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }, normalized)
    await expect(input).toHaveValue(normalized, { timeout: 15_000 })
  }

  async expectCardFrontBackground(hex) {
    const input = this.cardFrontGroup().getByTestId(`custom-color-bg-${CARD_FRONT}`)
    await expect(input).toHaveValue(hex.toLowerCase())
  }
}
