import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'

export class OperatorIngestPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  async open() {
    await this.page.goto('/operator/ingest')
    await waitForNuxtAppReady(this.page)
  }

  requestRows() {
    return this.page.getByTestId('ingest-request-list').locator('details')
  }

  async expectDashboard() {
    await expect(
      this.page.getByRole('heading', { level: 1, name: 'Integrator · ingest' }),
    ).toBeVisible({ timeout: 20_000 })
    await expect(this.page.getByTestId('ingest-summary-latest-ten')).toContainText('Green')
    await expect(this.page.getByTestId('ingest-summary-success')).toBeVisible()
  }

  async expectAcceptedCountMetrics() {
    await expect(this.page.getByTestId('ingest-summary-articles')).toContainText(/\d+/u)
    await expect(this.page.getByTestId('ingest-summary-episodes')).toContainText(/\d+/u)
    await expect(this.page.getByTestId('ingest-summary-subscribers')).toContainText(/\d+/u)
  }

  async openFirstRequestMatching(text) {
    const row = this.requestRows().filter({ hasText: text }).first()
    await expect(row).toBeVisible({ timeout: 20_000 })
    await row.evaluate((/** @type {HTMLDetailsElement} */ el) => {
      el.open = true
    })
    return row
  }

  async expectRejectedRequest(category) {
    const row = this.page.locator(`[data-testid="ingest-request-rejected"][data-failure-category="${category}"]`).first()
    await expect(row).toBeVisible({ timeout: 20_000 })
    await row.evaluate((/** @type {HTMLDetailsElement} */ el) => {
      el.open = true
    })
    return row
  }

  async expectNoCrawlerKeyIsExposed() {
    const key = process.env.NUXT_CRAWLER_API_KEY ?? ''
    if (!key) return
    await expect(this.page.getByTestId('ingest-request-list')).not.toContainText(
      key,
    )
  }
}
