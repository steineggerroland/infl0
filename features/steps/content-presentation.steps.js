import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import {
  ingestMinimalArticle,
  ingestMinimalEpisode,
  ingestRichArticle,
  ingestRichEpisode,
} from '../support/content-fixtures.js'
import { ReaderTimeline } from '../support/reader-timeline.js'

/** @typedef {'rich' | 'minimal'} PresentationVariant */
/** @typedef {'article' | 'episode'} PresentationKind */

/**
 * @param {import('../support/world.js').BddWorld} world
 * @param {PresentationKind} kind
 * @param {PresentationVariant} variant
 */
function presentationMeta(world, kind, variant) {
  const bucket = kind === 'article' ? world.contentPresentation?.articles : world.contentPresentation?.episodes
  const meta = bucket?.[variant]
  if (!meta) {
    throw new Error(`No ${variant} ${kind} in world — run the matching Given ingest step first.`)
  }
  return meta
}

/**
 * @param {import('../support/world.js').BddWorld} world
 */
function timeline(world) {
  return new ReaderTimeline(world.page)
}

function focusedCard(world) {
  const focus = world.focusedPresentation
  if (!focus) throw new Error('No card is focused — use a "view the teaser" step first.')
  const reader = timeline(world)
  if (focus.kind === 'article') return reader.articleCard(focus.id)
  return reader.episodeCard(focus.id)
}

function focusedReadStatus(world) {
  const focus = world.focusedPresentation
  if (!focus) throw new Error('No card is focused — use a "view the teaser" step first.')
  const testId = focus.kind === 'article' ? 'article-read-status' : 'episode-read-status'
  return focusedCard(world).getByTestId(testId).first()
}

function focusedBackTypography(world) {
  return focusedCard(world).locator('.infl0-surface-typo-back').first()
}

async function readFontSizePx(locator) {
  return locator.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
}

async function readFontFamily(locator) {
  return locator.evaluate((el) => getComputedStyle(el).fontFamily)
}

Given('I have an article with all information', async function () {
  await ingestRichArticle(this.page, this)
})

Given('I have an article with little information', async function () {
  await ingestMinimalArticle(this.page, this)
})

Given('I have an episode with all information', async function () {
  await ingestRichEpisode(this.page, this)
})

Given('I have an episode with little information', async function () {
  await ingestMinimalEpisode(this.page, this)
})

When('I view the teaser of the rich article', async function () {
  const meta = presentationMeta(this, 'article', 'rich')
  const card = timeline(this).articleCard(meta.id)
  await timeline(this).focusCard(card)
  this.focusedPresentation = { kind: 'article', id: meta.id, variant: 'rich' }
})

When('I view the teaser of the minimal article', async function () {
  const meta = presentationMeta(this, 'article', 'minimal')
  const card = timeline(this).articleCard(meta.id)
  await timeline(this).focusCard(card)
  this.focusedPresentation = { kind: 'article', id: meta.id, variant: 'minimal' }
})

When('I view the teaser of the rich episode', async function () {
  const meta = presentationMeta(this, 'episode', 'rich')
  const card = timeline(this).episodeCard(meta.id)
  await timeline(this).focusCard(card)
  this.focusedPresentation = { kind: 'episode', id: meta.id, variant: 'rich' }
})

When('I view the teaser of the minimal episode', async function () {
  const meta = presentationMeta(this, 'episode', 'minimal')
  const card = timeline(this).episodeCard(meta.id)
  await timeline(this).focusCard(card)
  this.focusedPresentation = { kind: 'episode', id: meta.id, variant: 'minimal' }
})

When('I flip the focused card to the back', async function () {
  const card = focusedCard(this)
  await card.locator('.teaser').first().click()
  await expect(card.locator('[data-testid="episode-details-panel"], .summary').first()).toBeVisible({
    timeout: 10_000,
  })
})

When('I expand the chapters on the focused episode card', async function () {
  const card = focusedCard(this)
  const details = card.getByTestId('episode-chapters-collapsible')
  await expect(details).toBeVisible()
  await details.locator('summary').click()
  await expect(details).toHaveAttribute('open', '')
})

When('I expand the shownotes on the focused episode card', async function () {
  const card = focusedCard(this)
  const details = card.getByTestId('episode-shownotes-collapsible')
  await expect(details).toBeVisible()
  await details.locator('summary').click()
  await expect(details).toHaveAttribute('open', '')
})

When('I open the details of the focused episode card', async function () {
  const card = focusedCard(this)
  await card.getByTestId('episode-details-link').click()
  await expect(this.page.locator('dialog[open]')).toBeVisible({ timeout: 10_000 })
})

When('I open the content tab in the episode details', async function () {
  const dialog = this.page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('tab', { name: 'Content' }).click()
  await expect(dialog.getByRole('tab', { name: 'Content' })).toHaveAttribute('aria-selected', 'true')
})

When('I open the transcript tab in the episode details', async function () {
  const dialog = this.page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('tab', { name: 'Transcript' }).click()
  await expect(dialog.getByRole('tab', { name: 'Transcript' })).toHaveAttribute('aria-selected', 'true')
})

When('I open the original article from the focused card back', async function () {
  const card = focusedCard(this)
  await card.getByRole('link', { name: 'Original article' }).click()
})

When('I use the card flip shortcut', async function () {
  await this.page.keyboard.press('e')
})

When('I use the card escape shortcut', async function () {
  await this.page.keyboard.press('Escape')
})

When('I use the reader dialog shortcut', async function () {
  await this.page.keyboard.press('q')
})

When('I use the read-state shortcut on the focused card', async function () {
  await this.page.keyboard.press('m')
})

When('I use the font-size shortcuts on the focused card', async function () {
  const target = focusedBackTypography(this)
  await expect(target).toBeVisible()
  await this.page.keyboard.press('0')
  this.cardFontSizeBefore = await readFontSizePx(target)

  await this.page.keyboard.press('+')
  await expect
    .poll(async () => readFontSizePx(target), { timeout: 10_000 })
    .toBeGreaterThan(this.cardFontSizeBefore)
  this.cardFontSizeAfterIncrease = await readFontSizePx(target)

  await this.page.keyboard.press('-')
  await expect
    .poll(async () => readFontSizePx(target), { timeout: 10_000 })
    .toBeLessThan(this.cardFontSizeAfterIncrease)
  this.cardFontSizeAfterDecrease = await readFontSizePx(target)

  await this.page.keyboard.press('=')
  await expect
    .poll(async () => readFontSizePx(target), { timeout: 10_000 })
    .toBeGreaterThan(this.cardFontSizeAfterDecrease)
  this.cardFontSizeAfterEquals = await readFontSizePx(target)

  await this.page.keyboard.press('0')
  await expect
    .poll(async () => readFontSizePx(target), { timeout: 10_000 })
    .toBe(this.cardFontSizeBefore)
  this.cardFontSizeAfterReset = await readFontSizePx(target)
})

When('I use the font-family shortcuts on the focused card', async function () {
  const target = focusedBackTypography(this)
  await expect(target).toBeVisible()
  this.cardFontFamilyBefore = await readFontFamily(target)

  await this.page.keyboard.press('Shift+L')
  await expect
    .poll(async () => readFontFamily(target), { timeout: 10_000 })
    .not.toBe(this.cardFontFamilyBefore)
  this.cardFontFamilyAfterForward = await readFontFamily(target)

  await this.page.keyboard.press('Shift+K')
  await expect
    .poll(async () => readFontFamily(target), { timeout: 10_000 })
    .not.toBe(this.cardFontFamilyAfterForward)
  this.cardFontFamilyAfterBackward = await readFontFamily(target)
})

async function expectFocusedCardText(world, ...texts) {
  const card = focusedCard(world)
  for (const text of texts) {
    await expect(card).toContainText(text)
  }
}

async function expectNoFocusedCardText(world, ...texts) {
  const card = focusedCard(world)
  for (const text of texts) {
    await expect(card).not.toContainText(text)
  }
}

async function expectFocusedCardLink(world, hrefPart) {
  const card = focusedCard(world)
  const link = card.locator(`a[href*="${hrefPart}"]`).filter({ visible: true }).first()
  await expect(link).toBeVisible()
}

function openReaderDialog(world) {
  return world.page.locator('dialog[open]')
}

async function expectOpenReaderDialogText(world, ...texts) {
  const dialog = openReaderDialog(world)
  await expect(dialog).toBeVisible()
  for (const text of texts) {
    await expect(dialog).toContainText(text)
  }
}

async function expectOpenReaderDialogLink(world, hrefPart) {
  const dialog = openReaderDialog(world)
  await expect(dialog).toBeVisible()
  await expect(dialog.locator(`a[href*="${hrefPart}"]`).first()).toBeVisible()
}

Then('I should see the rich article teaser', async function () {
  await expectFocusedCardText(
    this,
    'BDD rich article',
    'Rich article teaser for the card front.',
  )
})

Then('I should see the rich article back', async function () {
  await expectFocusedCardText(
    this,
    'Rich article long summary on the back of the card.',
    'bdd, presentation',
  )
  await expectFocusedCardLink(this, 'https://example.com/bdd/present/')
})

Then('I should see the rich article body in the reader dialog', async function () {
  await expectOpenReaderDialogText(this, 'Rich body')
})

Then('I should not see an open reader dialog', async function () {
  await expect(this.page.locator('dialog[open]')).toHaveCount(0)
})

Then('I should see the minimal article teaser', async function () {
  await expectFocusedCardText(this, 'BDD minimal article', 'Minimal teaser only.')
})

Then('I should see the minimal article back without optional fields', async function () {
  await expectNoFocusedCardText(this, 'Rich article long summary', 'bdd, presentation')
  await expect(openReaderDialog(this)).toHaveCount(0)
})

Then('I should see the rich episode teaser', async function () {
  await expectFocusedCardText(
    this,
    'BDD rich episode',
    'Rich episode teaser on the card front.',
    'Season 3 · Episode 42',
    '1:02:03',
    'BDD Demo Podcast',
  )
})

Then('I should see the rich episode back', async function () {
  const card = focusedCard(this)
  await expectFocusedCardText(
    this,
    'Rich episode summary below the action buttons on the back.',
    'Rich episode subtitle',
  )
  await expect(card.getByTestId('episode-play-browser')).toBeVisible()
  await expectFocusedCardLink(this, 'https://example.com/bdd/present/')
  await expectFocusedCardLink(this, 'bdd/present/podcast-')
  await expect(card.getByTestId('episode-chapters-collapsible')).toBeVisible()
  await expect(card.getByTestId('episode-shownotes-collapsible')).toBeVisible()
  await expect(card.getByTestId('episode-details-link')).toBeVisible()
})

Then('I should see the expanded rich episode chapters', async function () {
  await expectFocusedCardText(this, 'Second chapter')
})

Then('I should see the expanded rich episode shownotes', async function () {
  await expectFocusedCardText(this, 'DDD article')
})

Then('I should see the rich episode content tab', async function () {
  await expectOpenReaderDialogText(this, 'Rich episode content')
})

Then('I should see the rich episode transcript tab', async function () {
  await expectOpenReaderDialogText(this, 'Welcome to the rich BDD episode')
  await expectOpenReaderDialogLink(this, '/transcript.txt')
})

Then('I should see the minimal episode teaser', async function () {
  await expectFocusedCardText(this, 'BDD minimal episode', 'Minimal episode teaser only.', '8:00')
  await expectNoFocusedCardText(this, 'Season 3 · Episode 42')
})

Then('I should see the minimal episode back with core actions only', async function () {
  const card = focusedCard(this)
  await expect(card.getByTestId('episode-play-browser')).toBeVisible()
  await expectFocusedCardLink(this, 'bdd/present/podcast-')
  await expect(card.getByTestId('episode-chapters-collapsible')).toHaveCount(0)
  await expect(card.getByTestId('episode-shownotes-collapsible')).toHaveCount(0)
  await expect(card.getByTestId('episode-details-link')).toHaveCount(0)
  await expectNoFocusedCardText(this, 'Rich episode subtitle')
})

Then('the focused card should be marked as read', async function () {
  await expect(focusedReadStatus(this)).toHaveAttribute('aria-pressed', 'true', {
    timeout: 10_000,
  })
})

Then('the focused card font size should respond to shortcuts', async function () {
  expect(this.cardFontSizeBefore).toBeGreaterThan(0)
  expect(this.cardFontSizeAfterIncrease).toBeGreaterThan(this.cardFontSizeBefore)
  expect(this.cardFontSizeAfterDecrease).toBeLessThan(this.cardFontSizeAfterIncrease)
  expect(this.cardFontSizeAfterEquals).toBeGreaterThan(this.cardFontSizeAfterDecrease)
  expect(this.cardFontSizeAfterReset).toBe(this.cardFontSizeBefore)
})

Then('the focused card font family should respond to shortcuts', async function () {
  expect(this.cardFontFamilyBefore).toBeTruthy()
  expect(this.cardFontFamilyAfterForward).toBeTruthy()
  expect(this.cardFontFamilyAfterForward).not.toBe(this.cardFontFamilyBefore)
  expect(this.cardFontFamilyAfterBackward).toBeTruthy()
})
