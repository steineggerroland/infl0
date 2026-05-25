import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'

const WIDE_VIEWPORT = { width: 1440, height: 900 }

function escapedPath(path) {
  return path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class SettingsNavigation {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  async prepareWideLayout() {
    await this.page.setViewportSize(WIDE_VIEWPORT)
  }

  async open(path = '/settings') {
    await this.page.goto(path)
    await waitForNuxtAppReady(this.page)
  }

  async followSection(slug) {
    const link = this.page.getByTestId(`settings-nav-link-${slug}`)
    await expect(link).toBeVisible()
    await Promise.all([
      this.page.waitForURL(new RegExp(`/settings#${slug}$`, 'u')),
      link.click(),
    ])
  }

  async expectLocation(path) {
    await expect(this.page).toHaveURL(new RegExp(`${escapedPath(path)}$`, 'u'))
  }

  async expectAppearanceSection() {
    await expect(this.page.getByTestId('appearance-control')).toBeVisible()
  }

  async expectSortingSection() {
    await expect(this.page.locator('#settings-sorting-heading')).toBeVisible()
  }

  async expectThemeSection() {
    await expect(this.page.getByTestId('theme-control')).toBeVisible()
  }
}
