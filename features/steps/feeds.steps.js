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
    await this.page.getByLabel('Source address').fill(address)
    await this.page.getByLabel('Display name (optional)').fill(displayName)
    await this.page.getByRole('button', { name: 'Save source' }).click()
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
