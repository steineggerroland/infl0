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
    const item = this.itemByTitle(title)
    const remove = item.getByTestId('knowledge-inbox-remove')
    await expect(remove).toBeVisible({ timeout: 15_000 })
    await expect(remove).toBeEnabled()
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.request().method() === 'DELETE'
          && response.url().includes('/api/knowledge/inbox/')
          && response.ok(),
        { timeout: 30_000 },
      ),
      remove.click(),
    ])
    await expect(this.page.getByTestId('knowledge-inbox-item').filter({ hasText: title })).toHaveCount(0, { timeout: 30_000 })
  }
}
