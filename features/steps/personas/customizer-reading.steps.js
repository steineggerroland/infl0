import { Given, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { BrowseTheWeb } from '../../support/screenplay/abilities/browse-the-web.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import {
  ChooseLowStimulationDisplayPreferences,
  PrepareDisplaySettings,
} from '../../support/screenplay/tasks/display-preferences.js'
import { waitForNuxtAppReady } from '../../support/app-ready.js'
import { browserFetchJson } from '../../support/crawler-fixtures.js'
import { HaveReaderArticles } from '../../support/screenplay/tasks/active-reader.js'

Given('{word} is preparing to read', async function (name) {
  const actor = actorCalled(this, name)
  await actor.attemptsTo(
    StartSignedInToInfl0,
    PrepareDisplaySettings,
    ChooseLowStimulationDisplayPreferences,
  )
  const page = BrowseTheWeb.as(currentActor(this, name))
  const prefs = await browserFetchJson(page, '/api/me/ui-prefs', {
    method: 'PATCH',
    body: { onboardingHidden: true },
  })
  if (!prefs.ok) {
    throw new Error(`PATCH /api/me/ui-prefs failed (${prefs.status}): ${prefs.text}`)
  }
  await actor.attemptsTo(HaveReaderArticles)
  await page.goto('/')
  await waitForNuxtAppReady(page)
})

Then('infl0 should reduce visual friction without hiding the reader controls', async function () {
  await expect(this.page.locator('html')).toHaveAttribute('data-motion', 'reduced')
  await expect(this.page.getByTestId('reader-start-button')).toBeVisible({ timeout: 20_000 })
})
