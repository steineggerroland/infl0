import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import { ingestRichArticle } from '../../support/content-fixtures.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'

function timeline(world) {
  return new ReaderTimeline(world.page)
}

function focusedBackTypography(world) {
  const focus = world.focusedPresentation
  if (!focus) throw new Error('No card is focused.')
  const card =
    focus.kind === 'article'
      ? timeline(world).articleCard(focus.id)
      : timeline(world).episodeCard(focus.id)
  return card.locator('.infl0-surface-typo-back').first()
}

async function readFontSizePx(locator) {
  return locator.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
}

async function readFontFamily(locator) {
  return locator.evaluate((el) => getComputedStyle(el).fontFamily)
}

Given('{word} is reading a focused card', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0)
  currentActor(this, name)
  await ingestRichArticle(this.page, this)
  const reader = timeline(this)
  await reader.open()
  await reader.startReading()
  const meta = this.contentPresentation.articles.rich
  const card = reader.articleCard(meta.id)
  await reader.focusCard(card)
  this.focusedPresentation = { kind: 'article', id: meta.id, variant: 'rich' }
  await card.locator('.teaser').first().click()
  await expect(focusedBackTypography(this)).toBeVisible({ timeout: 10_000 })
  this.midSessionTypographyBefore = {
    fontSize: await readFontSizePx(focusedBackTypography(this)),
    fontFamily: await readFontFamily(focusedBackTypography(this)),
  }
  this.midSessionArticleId = meta.id
})

When('{word} changes font size and typeface with shortcuts', async function (name) {
  currentActor(this, name)
  const target = focusedBackTypography(this)
  const beforeSize = await readFontSizePx(target)
  await this.page.keyboard.press('+')
  await expect
    .poll(async () => readFontSizePx(target), { timeout: 10_000 })
    .toBeGreaterThan(beforeSize)

  const beforeFamily = await readFontFamily(target)
  await this.page.keyboard.press('Shift+L')
  await expect
    .poll(async () => readFontFamily(target), { timeout: 10_000 })
    .not.toBe(beforeFamily)

  this.midSessionTypographyAfter = {
    fontSize: await readFontSizePx(target),
    fontFamily: await readFontFamily(target),
  }
})

Then('the focused reading surface should reflect those changes', async function () {
  const before = this.midSessionTypographyBefore
  const after = this.midSessionTypographyAfter
  if (!before || !after) {
    throw new Error('Typography before/after was not recorded.')
  }
  expect(after.fontSize).toBeGreaterThan(before.fontSize)
  expect(after.fontFamily).not.toBe(before.fontFamily)
})

Then('the reader context should remain stable', async function () {
  const articleId = this.midSessionArticleId
  if (!articleId) throw new Error('No article id recorded for mid-session scenario.')
  await expect(this.page).toHaveURL(new RegExp(`/inflow/article/${articleId}$`, 'u'))
  await expect(this.page.getByTestId('reader-start')).toHaveCount(0)
  const card = timeline(this).articleCard(articleId)
  await expect(card).toHaveAttribute('data-reader-selected', 'true')
})
