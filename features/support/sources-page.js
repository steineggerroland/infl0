import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'

function timeoutAfter(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms)
  })
}

async function fillStable(locator, value) {
  await expect(async () => {
    await locator.fill(value)
    await locator.page().waitForTimeout(150)
    await expect(locator).toHaveValue(value)
  }).toPass({ timeout: 10_000 })
}

export class SourcesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  async open() {
    await this.page.goto('/feeds')
    await waitForNuxtAppReady(this.page)
    await expect(this.page).toHaveURL(/\/feeds/u)
    await this.page.waitForLoadState('networkidle')
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
    const urlInput = this.page.locator('#feed-url-input')
    const displayInput = this.page.locator('#feed-display-input')
    await fillStable(urlInput, address)
    await fillStable(displayInput, displayName)

    const submit = this.page.locator('[data-testid="feeds-add-fieldset"] button[type="submit"]')
    const errorAlert = this.page.getByTestId('feeds-add-error')
    const rowByUrl = this.row(address)
    const rowByTitle = this.row(displayName)

    await expect(submit).toBeEnabled({ timeout: 30_000 })
    await submit.scrollIntoViewIfNeeded()

    const isFeedPost = (request) =>
      request.method() === 'POST' && new URL(request.url()).pathname === '/api/feeds'

    let feedRequestPromise = this.page.waitForRequest(isFeedPost, { timeout: 10_000 })
    await submit.click()

    let feedRequest
    try {
      feedRequest = await feedRequestPromise
    } catch {
      feedRequestPromise = this.page.waitForRequest(isFeedPost, { timeout: 10_000 })
      await urlInput.press('Enter')
      feedRequest = await feedRequestPromise
    }

    const feedResponse = await Promise.race([
      feedRequest.response(),
      timeoutAfter(45_000, 'POST /api/feeds was sent but did not receive a response within 45s.'),
    ])
    if (!feedResponse) {
      throw new Error('POST /api/feeds finished without a response.')
    }
    if (!feedResponse.ok()) {
      throw new Error(`POST /api/feeds failed (${feedResponse.status()}): ${await feedResponse.text()}`)
    }

    if (await errorAlert.isVisible()) {
      throw new Error(`Add source failed in UI: ${await errorAlert.textContent()}`)
    }

    const row = (await rowByUrl.count()) > 0 ? rowByUrl : rowByTitle
    try {
      await expect(row).toBeVisible({ timeout: 15_000 })
    } catch {
      await this.page.reload()
      await expect(this.page.getByTestId('feeds-add-fieldset')).toBeVisible({ timeout: 30_000 })
      await expect(row).toBeVisible({ timeout: 15_000 })
    }
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
    await waitForNuxtAppReady(this.page)
    const row = this.row(snippet)
    await expect(row).toBeVisible()
    const feedId = await row.getAttribute('data-feed-id')
    const deleteResponse = feedId
      ? this.page.waitForResponse(
          (response) =>
            response.request().method() === 'DELETE' &&
            new URL(response.url()).pathname === `/api/feeds/${feedId}`,
          { timeout: 45_000 },
        )
      : null
    await row.getByRole('button', { name: 'Remove' }).click()
    if (deleteResponse) {
      const response = await deleteResponse
      if (!response.ok()) {
        throw new Error(`DELETE /api/feeds/${feedId} failed (${response.status()}): ${await response.text()}`)
      }
    }
    await expect(row).toHaveCount(0, { timeout: 15_000 })
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
