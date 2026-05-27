import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import { ingestRichEpisode } from '../../support/content-fixtures.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'

function timeline(world) {
  return new ReaderTimeline(world.page)
}

function focusedEpisodeCard(world) {
  const focus = world.focusedPresentation
  if (!focus || focus.kind !== 'episode') {
    throw new Error('No episode card is focused — run the episode setup steps first.')
  }
  return timeline(world).episodeCard(focus.id)
}

async function prepareRichEpisodeReader(world, name) {
  await actorCalled(world, name).attemptsTo(StartSignedInToInfl0)
  currentActor(world, name)
  await ingestRichEpisode(world.page, world)
  const reader = timeline(world)
  await reader.open()
  await reader.startReading()
  const meta = world.contentPresentation.episodes.rich
  const card = reader.episodeCard(meta.id)
  await reader.focusCard(card)
  world.focusedPresentation = { kind: 'episode', id: meta.id, variant: 'rich' }
  await card.locator('.teaser').first().click()
  await expect(card.locator('[data-testid="episode-details-panel"]').first()).toBeVisible({
    timeout: 10_000,
  })
}

Given('{word} is reading an episode card', async function (name) {
  await prepareRichEpisodeReader(this, name)
})

When('{word} opens episode details with the keyboard', async function (name) {
  currentActor(this, name)
  const link = focusedEpisodeCard(this).getByTestId('episode-details-link')
  await link.focus()
  await this.page.keyboard.press('Enter')
  await expect(this.page.locator('dialog[open]')).toBeVisible({ timeout: 10_000 })
})

When('{word} switches between content and transcript', async function (name) {
  currentActor(this, name)
  const dialog = this.page.locator('dialog[open]')
  const contentTab = dialog.locator('[role="tab"][aria-controls$="panel-content"]').first()
  await expect(contentTab).toHaveAttribute('aria-selected', 'true')
  await contentTab.focus()
  await this.page.keyboard.press('ArrowRight')
  const transcriptTab = dialog.locator('[role="tab"][aria-controls$="panel-transcript"]').first()
  await expect(transcriptTab).toHaveAttribute('aria-selected', 'true')
  await expect(transcriptTab).toBeFocused()
})

Then('{word} should stay in an accessible dialog', async function (name) {
  currentActor(this, name)
  const dialog = this.page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  const labelledBy = await dialog.getAttribute('aria-labelledby')
  expect(labelledBy).toBeTruthy()
  await expect(this.page.locator(`#${labelledBy}`)).toBeVisible()
})

Then('focus should return to the episode action after closing', async function () {
  const link = focusedEpisodeCard(this).getByTestId('episode-details-link')
  const dialog = this.page.locator('dialog[open]')
  await dialog.getByLabel('Close').click()
  await expect(dialog).toHaveCount(0, { timeout: 10_000 })
  await expect(link).toBeFocused({ timeout: 10_000 })
})
