import { expect } from '@playwright/test'

export class UserMenu {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  menu() {
    return this.page.locator('body > header .dropdown.dropdown-end').first()
  }

  showReadInput() {
    return this.page.getByTestId('menu-show-read-toggle').locator('input[type="checkbox"]')
  }

  async open() {
    const menu = this.menu()
    const summary = menu.locator('summary').first()
    await expect(summary).toBeVisible({ timeout: 15_000 })
    const isOpen = await menu.evaluate((el) => el instanceof HTMLDetailsElement && el.open)
    if (!isOpen) await summary.click()
    return menu
  }

  async close() {
    await this.page.keyboard.press('Escape')
  }

  async openShowReadInput() {
    await this.open()
    const input = this.showReadInput()
    await expect(input).toBeVisible({ timeout: 10_000 })
    return input
  }

  async readShowReadChecked() {
    const input = await this.openShowReadInput()
    return input.isChecked()
  }

  async goToHelp() {
    const menu = await this.open()
    const helpLink = menu.locator('.dropdown-content a[href="/help"]').first()
    await expect(helpLink).toBeVisible({ timeout: 10_000 })
    await helpLink.click()
    await expect(this.page).toHaveURL(/\/help(?:[?#].*)?$/u, { timeout: 15_000 })
  }
}
