import { expect } from '@playwright/test'

export class SourcesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  async open() {
    await this.page.goto('/feeds')
    await expect(this.page).toHaveURL(/\/feeds/u)
  }

  row(snippet) {
    return this.page.locator('[data-testid="feeds-source-list"] li').filter({ hasText: snippet })
  }

  async rememberFeedFromRow(world, feedUrl) {
    const row = this.row(feedUrl)
    await expect(row).toBeVisible({ timeout: 15_000 })
    const crawlKey = await row.getAttribute('data-crawl-key')
    const feedId = await row.getAttribute('data-feed-id')
    if (!crawlKey) {
      throw new Error(`Source row for ${feedUrl} is missing data-crawl-key.`)
    }
    world.lastCrawlKey = crawlKey
    world.lastFeedId = feedId
  }

  async addSource(world, address, displayName) {
    await expect(this.page.getByTestId('feeds-add-fieldset')).toBeVisible({ timeout: 30_000 })
    await this.page.locator('#feed-url-input').fill(address)
    await this.page.locator('#feed-display-input').fill(displayName)

    const submit = this.page.locator('[data-testid="feeds-add-fieldset"] button[type="submit"]')
    const errorAlert = this.page.getByTestId('feeds-add-error')
    const rowByUrl = this.row(address)
    const rowByTitle = this.row(displayName)

    await expect(submit).toBeEnabled({ timeout: 30_000 })
    await submit.scrollIntoViewIfNeeded()
    await submit.click()

    async function waitForAddOutcome(timeoutMs) {
      await expect
        .poll(
          async () => {
            if (await errorAlert.isVisible()) return 'error'
            if ((await rowByUrl.count()) > 0 || (await rowByTitle.count()) > 0) return 'ok'
            if (await submit.isDisabled()) return 'submitting'
            return 'pending'
          },
          { timeout: timeoutMs },
        )
        .toMatch(/^(ok|error)$/)
    }

    try {
      await waitForAddOutcome(120_000)
    } catch {
      if (await errorAlert.isVisible()) {
        throw new Error(`Add source failed in UI: ${await errorAlert.textContent()}`)
      }
      if ((await rowByUrl.count()) === 0 && (await rowByTitle.count()) === 0) {
        await this.page.reload()
        await expect(this.page.getByTestId('feeds-add-fieldset')).toBeVisible({ timeout: 30_000 })
        await waitForAddOutcome(90_000)
      }
    }

    if (await errorAlert.isVisible()) {
      throw new Error(`Add source failed in UI: ${await errorAlert.textContent()}`)
    }

    const row = (await rowByUrl.count()) > 0 ? rowByUrl : rowByTitle
    await expect(row).toBeVisible({ timeout: 15_000 })
    await this.rememberFeedFromRow(world, address)
  }

  async expectEmptyHint() {
    await expect(this.page.getByTestId('feeds-empty-alert')).toBeVisible({ timeout: 15_000 })
  }

  async expectListContains(snippet) {
    const list = this.page.getByTestId('feeds-source-list')
    await expect(list).toBeVisible({ timeout: 15_000 })
    await expect(list.getByText(snippet, { exact: false })).toBeVisible()
  }

  async removeSource(snippet) {
    const row = this.row(snippet)
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Remove' }).click()
    await this.expectEmptyHint()
  }

  async expandRow(snippet) {
    const row = this.row(snippet)
    await expect(row).toBeVisible()
    const details = row.locator('details')
    await expect(details).toBeVisible()
    await details.evaluate((/** @type {HTMLDetailsElement} */ el) => {
      if (!el.open) el.open = true
    })
    return row
  }

  async expectSourceHealth(snippet, expectedAttr) {
    const row = this.row(snippet)
    const health = row.getByTestId('feed-source-health')
    await expect(health).toBeVisible()
    await expect(health).toHaveAttribute('data-source-health', expectedAttr)
  }

  async expectExpandedHealthLabel(snippet, substring) {
    const row = await this.expandRow(snippet)
    const label = row.getByTestId('feed-source-health-label')
    await expect(label).toBeVisible({ timeout: 15_000 })
    await expect(label).toContainText(substring)
  }

  async pauseSource(snippet) {
    const row = this.row(snippet)
    await expect(row).toBeVisible()
    const toggle = row.locator('button[data-testid^="feed-toggle-"]')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(row).toHaveAttribute('data-active', 'false', { timeout: 25_000 })
  }

  async resumeSource(snippet) {
    const row = this.row(snippet)
    await expect(row).toBeVisible()
    const toggle = row.locator('button[data-testid^="feed-toggle-"]')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(row).toHaveAttribute('data-active', 'true', { timeout: 25_000 })
  }

  async expectSourceActive(snippet) {
    await expect(this.row(snippet)).toHaveAttribute('data-active', 'true')
  }

  async expectSourcePaused(snippet) {
    await expect(this.row(snippet)).toHaveAttribute('data-active', 'false')
  }

  async expectListHeading() {
    await expect(this.page.locator('#feeds-list-heading')).toBeVisible({ timeout: 15_000 })
  }
}
