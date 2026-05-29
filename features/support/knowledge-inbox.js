import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'
import { UserMenu } from './user-menu.js'

export class KnowledgeInboxPage {
  constructor(page) {
    this.page = page
    this.userMenu = new UserMenu(page)
  }

  async open() {
    await this.page.goto('/knowledge/inbox')
    await waitForNuxtAppReady(this.page)
  }

  async waitForList() {
    await expect(
      this.page.getByTestId('knowledge-inbox-list').or(this.page.locator('text=No articles saved yet')),
    ).toBeVisible({ timeout: 15_000 })
  }

  itemByTitle(title) {
    return this.page
      .getByTestId('knowledge-inbox-item')
      .filter({ hasText: title })
      .first()
  }

  async removeItem(title) {
    const item = this.itemByTitle(title)
    await item.getByRole('button', { name: /remove/i }).click()
  }
}
