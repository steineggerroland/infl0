import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { currentActor } from '../../support/screenplay/actor.js'
import { BrowseTheWeb } from '../../support/screenplay/abilities/browse-the-web.js'
import { HELP_SHORTCUT_GROUPS } from '../../support/help-shortcuts-catalog.js'
import { waitForNuxtAppReady } from '../../support/app-ready.js'

When('{word} opens the keyboard shortcuts reference in Help', async function (name) {
  const page = BrowseTheWeb.as(currentActor(this, name))
  await page.goto('/help#shortcuts-reference')
  await waitForNuxtAppReady(page)
})

Then('{word} should see the shortcuts reference on the help page', async function (name) {
  const page = BrowseTheWeb.as(currentActor(this, name))
  const reference = page.getByTestId('help-shortcuts-reference')
  await expect(reference).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(/\/help#shortcuts-reference/u)
})

Then('{word} should see every documented shortcut group in Help', async function (name) {
  const page = BrowseTheWeb.as(currentActor(this, name))
  for (const group of HELP_SHORTCUT_GROUPS) {
    await expect(page.getByTestId(`help-shortcut-group-${group.id}`)).toBeVisible()
    for (const entryId of group.entryIds) {
      await expect(page.getByTestId(`help-shortcut-${entryId}`)).toBeVisible()
      await expect(page.getByTestId(`help-shortcut-${entryId}-keys`)).toBeVisible()
    }
  }
})
