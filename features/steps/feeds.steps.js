import { When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

When('I open the sources page', async function () {
  await this.page.goto('/feeds')
  await expect(this.page).toHaveURL(/\/feeds/u)
})

Then('I should see the empty sources hint', async function () {
  await expect(this.page.getByTestId('feeds-empty-alert')).toBeVisible({ timeout: 15_000 })
})

When(
  'I add a source with address {string} and display name {string}',
  async function (address, displayName) {
    await expect(this.page.getByTestId('feeds-add-fieldset')).toBeVisible({ timeout: 15_000 })

    // Prefer `#feed-*` over `getByLabel`: Daisy label markup + i18n vary in how Chromium exposes names.
    await this.page.locator('#feed-url-input').fill(address)
    await this.page.locator('#feed-display-input').fill(displayName)

    const responsePromise = this.page.waitForResponse(
      (res) => {
        if (res.request().method() !== 'POST') return false
        try {
          const path = new URL(res.url()).pathname.replace(/\/$/, '')
          return path === '/api/feeds'
        } catch {
          return false
        }
      },
      { timeout: 45_000 },
    )

    await this.page.locator('[data-testid="feeds-add-fieldset"] button[type="submit"]').click()

    const postRes = await responsePromise
    if (!postRes.ok()) {
      const body = await postRes.text().catch(() => '')
      throw new Error(`POST /api/feeds failed (${postRes.status()}): ${body}`)
    }

    await expect(this.page.getByTestId('feeds-add-error')).toHaveCount(0)
    await expect(this.page.getByTestId('feeds-source-list')).toBeVisible({ timeout: 20_000 })
  },
)

Then('I should see the source list containing {string}', async function (snippet) {
  const list = this.page.getByTestId('feeds-source-list')
  await expect(list).toBeVisible({ timeout: 15_000 })
  await expect(list.getByText(snippet, { exact: false })).toBeVisible()
})

When('I remove the source row for {string}', async function (snippet) {
  const row = this.page.locator('[data-testid="feeds-source-list"] li').filter({ hasText: snippet })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Remove' }).click()
  await expect(this.page.getByTestId('feeds-empty-alert')).toBeVisible({ timeout: 20_000 })
})
