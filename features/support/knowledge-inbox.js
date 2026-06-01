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
      this.page.getByTestId('knowledge-inbox-list').or(this.page.getByTestId('knowledge-inbox-empty')),
    ).toBeVisible({ timeout: 15_000 })
  }

  itemByTitle(title) {
    return this.page
      .getByTestId('knowledge-inbox-item')
      .filter({ hasText: title })
      .first()
  }

  entryLinkByTitle(title) {
    return this.itemByTitle(title).getByTestId('knowledge-inbox-entry-link')
  }

  async openItem(title) {
    const link = this.entryLinkByTitle(title)
    await expect(link).toBeVisible({ timeout: 15_000 })
    await expect(link).toBeEnabled()
    await Promise.all([
      this.page.waitForURL(/\/(?:articles|episodes)\//u, { timeout: 30_000 }),
      link.click(),
    ])
    await waitForNuxtAppReady(this.page)
  }

  async removeItem(title) {
    const matchingItems = this.page.getByTestId('knowledge-inbox-item').filter({ hasText: title })
    await expect(matchingItems).toHaveCount(1, { timeout: 15_000 })

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const item = this.itemByTitle(title)
      const remove = item.getByTestId('knowledge-inbox-remove')
      await expect(remove).toBeVisible({ timeout: 15_000 })
      await expect(remove).toBeEnabled({ timeout: 15_000 })
      await remove.click()

      try {
        await expect(matchingItems).toHaveCount(0, { timeout: 15_000 })
        return
      } catch (error) {
        if (attempt === 2) throw error
        await this.page.waitForTimeout(500)
      }
    }
  }
}
