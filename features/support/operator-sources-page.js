import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from './app-ready.js'

export class OperatorSourcesPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  async open() {
    await this.page.goto('/operator/sources')
    await waitForNuxtAppReady(this.page)
  }

  table() {
    return this.page.getByTestId('operator-sources-table')
  }

  async expectAccessDenied() {
    await expect(
      this.page.getByRole('heading', { name: /operator access denied/i }),
    ).toBeVisible({ timeout: 15_000 })
  }

  async expectSummaryBand() {
    await expect(
      this.page.getByRole('heading', { level: 1, name: 'Operator · sources' }),
    ).toBeVisible({ timeout: 20_000 })
    await expect(this.page.getByTestId('operator-summary-total')).toBeVisible()
    await expect(this.page.getByTestId('operator-summary-attention')).toBeVisible()
  }

  async expectAttentionFirst() {
    const table = this.table()
    const blockedRow = table.locator('tbody tr').filter({ hasText: 'https://example.com/operator-blocked.xml' }).first()
    const healthyRow = table.locator('tbody tr').filter({ hasText: 'https://example.com/operator-healthy.xml' }).first()
    await expect(blockedRow).toBeVisible()
    await expect(blockedRow).toContainText('Attention')
    await expect(healthyRow).toBeVisible()

    const { blockedIndex, healthyIndex } = await this.page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[data-testid="operator-sources-table"] tbody tr'))
      const indexOf = (substr) => rows.findIndex((tr) => (tr.textContent ?? '').includes(substr))
      return {
        blockedIndex: indexOf('https://example.com/operator-blocked.xml'),
        healthyIndex: indexOf('https://example.com/operator-healthy.xml'),
      }
    })
    if (blockedIndex < 0 || healthyIndex < 0) {
      throw new Error(`Expected fixture rows in table (blockedIndex=${blockedIndex}, healthyIndex=${healthyIndex})`)
    }
    expect(blockedIndex).toBeLessThan(healthyIndex)
  }

  async expectRows() {
    await expect(this.table().locator('tbody tr').first()).toBeVisible()
  }

  async activateFilter(label) {
    const filterByLabel = {
      Attention: 'attention',
      'Failing / degraded': 'failing_degraded',
      'Needs setup': 'needs_setup',
      Blocked: 'blocked',
      Quiet: 'quiet',
      All: 'all',
    }
    await this.page.getByRole('button', { name: label }).click()
    const filter = filterByLabel[label]
    if (filter) {
      await expect(this.page).toHaveURL(new RegExp(`[?&]filter=${filter}(?:&|$)`, 'u'))
    }
  }

  async expectIncludesSource(crawlKey) {
    await expect(this.table()).toContainText(crawlKey)
  }

  async expectExcludesSource(crawlKey) {
    await expect(this.table()).not.toContainText(crawlKey)
  }
}
