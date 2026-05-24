import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'
import { UserMenu } from './user-menu.js'

export class ReaderTimeline {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
    this.userMenu = new UserMenu(page)
  }

  async open() {
    await this.page.goto('/')
    await waitForNuxtAppReady(this.page)
  }

  async waitForShell() {
    await expect(
      this.page.locator('[data-testid="reader-start"], .scroll-container').first(),
    ).toBeVisible({ timeout: 20_000 })
  }

  articleCard(articleId) {
    return this.page.locator(`[data-testid="article-card"][data-article-id="${articleId}"]`).first()
  }

  episodeCard(episodeId) {
    return this.page.locator(`[data-testid="episode-card"][data-episode-id="${episodeId}"]`).first()
  }

  async startReading() {
    const readerStart = this.page.getByTestId('reader-start')
    await expect(readerStart).toBeVisible({ timeout: 20_000 })
    await this.page.getByTestId('reader-start-button').click()
    await expect(readerStart).toHaveCount(0, { timeout: 15_000 })
  }

  async setShowReadArticles(show) {
    await this.open()
    await this.waitForShell()

    if ((await this.userMenu.readShowReadChecked()) === show) {
      await this.userMenu.close()
      return
    }

    if (await this.isShowReadShortcutActive()) {
      await this.userMenu.close()
      await this.page.locator('body').click({ position: { x: 8, y: 8 } })
      await this.page.keyboard.press('r')
      await expect
        .poll(async () => this.userMenu.readShowReadChecked(), { timeout: 15_000 })
        .toBe(show)
      await this.userMenu.close()
      return
    }

    const input = await this.userMenu.openShowReadInput()
    if (show) await input.check()
    else await input.uncheck()
    await expect.poll(async () => input.isChecked(), { timeout: 15_000 }).toBe(show)
    await this.userMenu.close()
  }

  /** Matches readerIsInteractive: `r` only works after reader start or with onboarding. */
  async isShowReadShortcutActive() {
    const readerStart = this.page.getByTestId('reader-start')
    if (!(await readerStart.isVisible())) return true
    return (await this.page.getByTestId('onboarding-card').count()) > 0
  }

  async focusCard(card) {
    await expect(card).toBeVisible({ timeout: 20_000 })
    await card.evaluate((el) => {
      const scroller = el.closest('.scroll-container')
      if (scroller) scroller.scrollTo({ top: el.offsetTop, behavior: 'instant' })
      else el.scrollIntoView({ block: 'center', inline: 'nearest' })
    })
    await expect.poll(async () => this.visibleRatio(card), { timeout: 15_000 }).toBeGreaterThan(0.5)
    await card.click({ position: { x: 8, y: 8 } })
    await expect(card).toHaveAttribute('data-reader-selected', 'true', { timeout: 10_000 })
  }

  async visibleRatio(locator) {
    return locator.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
      if (rect.height <= 0) return 0
      return Math.max(0, Math.min(visibleHeight, rect.height)) / rect.height
    })
  }
}
