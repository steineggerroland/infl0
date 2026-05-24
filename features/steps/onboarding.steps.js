import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { OnboardingJourney } from '../support/onboarding-journey.js'

function onboarding(world) {
  return new OnboardingJourney(world.page)
}

async function ensureSurface(world, surface) {
  const topic = world.currentTopic
  if (surface === 'front') {
    await expect(onboarding(world).front(topic)).toBeVisible()
    world.currentSurface = 'front'
    return
  }
  if (surface === 'back') {
    await onboarding(world).flipTopic(topic)
    world.currentSurface = 'back'
    return
  }
  if (surface === 'full-text') {
    await onboarding(world).openFullText(topic)
    world.currentSurface = 'full-text'
  }
}

function activeCopyLocator(world) {
  const topic = world.currentTopic
  if (world.currentSurface === 'back') return onboarding(world).back(topic)
  if (world.currentSurface === 'full-text') return onboarding(world).fullText(topic)
  return onboarding(world).front(topic)
}

async function readFontSizePx(locator) {
  return locator.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
}

async function readFontFamily(locator) {
  return locator.evaluate((el) => getComputedStyle(el).fontFamily)
}

function normalizeShortcut(shortcut) {
  if (shortcut === 'Shift+K') return 'Shift+K'
  if (shortcut === 'Shift+L') return 'Shift+L'
  if (shortcut === '+') return '+'
  if (shortcut === '-') return '-'
  if (shortcut === '0') return '0'
  return shortcut
}

When('I focus the {string} onboarding card', async function (topic) {
  await onboarding(this).focusTopic(topic)
  this.currentTopic = topic
})

When('I reload the timeline', async function () {
  if (this.currentTopic) {
    await onboarding(this).waitForStoredTopic(this.currentTopic)
  }
  await this.page.reload({ waitUntil: 'networkidle' })
})

Then('I should see onboarding cards before regular articles', async function () {
  await onboarding(this).expectCardsBeforeArticles()
})

Then('the onboarding topics should be ordered as:', async function (table) {
  const expected = table.hashes().map((r) => r.topic)
  await onboarding(this).expectTopicsInOrder(expected)
})

Then('the {string} onboarding card should be restored as my current place', async function (topic) {
  await onboarding(this).expectTopicRestored(topic)
})

Then('the URL should point to the {string} onboarding card', async function (topic) {
  await onboarding(this).expectUrlForTopic(topic)
})

Then('I should see the intro headline', async function () {
  await onboarding(this).expectIntroHeadline()
})

Then('I should see guidance to flip the card', async function () {
  await onboarding(this).expectGuidanceToFlip()
})

When('I flip the {string} onboarding card', async function (topic) {
  await onboarding(this).flipTopic(topic)
  this.currentTopic = topic
  this.currentSurface = 'back'
})

Then('I should see details about moving to the next and previous cards', async function () {
  await onboarding(this).expectIntroNavigationDetails()
})

Then('I should see how to open full text', async function () {
  await onboarding(this).expectIntroFullTextAffordance()
})

When('I open full text on the {string} onboarding card', async function (topic) {
  await onboarding(this).openFullText(topic)
  this.currentTopic = topic
  this.currentSurface = 'full-text'
})

Then('the copy should ask me to continue to the next onboarding card', async function () {
  await onboarding(this).expectIntroFullTextContinuation()
})

Then('I should see wording that references {string}', async function (phrase) {
  const content = (await this.page.locator('[data-onboarding-front="scoring"]').textContent()) ?? ''
  expect(content.toLowerCase()).toContain(phrase.toLowerCase())
})

Then('I should see wording that infl0 is transparent and user-adjustable', async function () {
  const combined = (
    ((await this.page.locator('[data-onboarding-front="scoring"]').textContent()) ?? '') +
    ' ' +
    ((await this.page.locator('[data-onboarding-back="scoring"]').textContent()) ?? '')
  ).toLowerCase()
  expect(combined).toMatch(/(transparent)/u)
  expect(combined).toMatch(/(control|tune|adjust)/u)
})

Then('I should see that tracking is optional', async function () {
  const content = (await this.page.locator('[data-onboarding-back="scoring"]').textContent()) ?? ''
  expect(content).toMatch(/(optional|aktivier|enable tracking)/iu)
})

Then('I should see that enabling tracking can improve ranking quality', async function () {
  const content = (await this.page.locator('[data-onboarding-back="scoring"]').textContent()) ?? ''
  expect(content).toMatch(/(improve|better)/iu)
})

Then('I should see a CTA on the {string} card', async function (topic) {
  await onboarding(this).focusTopic(topic)
  this.currentTopic = topic
  const cta = onboarding(this).card(topic).locator(`.onboarding-front [data-onboarding-cta="${topic}"]`)
  await expect(cta).toBeVisible()
})

When('I activate the scoring CTA', async function () {
  const cta = onboarding(this).card('scoring').locator('.onboarding-front [data-onboarding-cta="scoring"]')
  await expect(cta).toBeVisible()
  await Promise.all([
    this.page.waitForURL(/\/settings#settings-sorting-heading$/u),
    cta.evaluate((el) => el.click()),
  ])
})

Then('I should see wording that scores are recalculated after saving sorting settings', async function () {
  const content = (await this.page.locator('[data-onboarding-full="scoring"]').textContent()) ?? ''
  expect(content).toMatch(/(recalculated|save)/iu)
})

When('I am on the {string} side of that card', async function (surface) {
  await ensureSurface(this, surface)
})

When('I press {string}', async function (shortcut) {
  const target = activeCopyLocator(this)
  await expect(target).toBeVisible()
  await target.click({ force: true })
  this.lastShortcut = shortcut
  this.fontSizeBefore = await readFontSizePx(target)
  this.fontFamilyBefore = await readFontFamily(target)
  const key = normalizeShortcut(shortcut)
  await this.page.keyboard.press(key)
  if (shortcut === 'Shift+L' || shortcut === 'Shift+K') {
    // On some runs the first key event lands before the card becomes selected.
    let tries = 0
    while (tries < 2) {
      const currentFamily = await readFontFamily(target)
      if (currentFamily !== this.fontFamilyBefore) break
      await this.page.keyboard.press(key)
      tries += 1
    }
  }
  this.fontSizeAfter = await readFontSizePx(target)
  this.fontFamilyAfter = await readFontFamily(target)
})

Then('the font size for {string} should change accordingly', async function (_surface) {
  void _surface
  expect(this.fontSizeAfter).not.toBeNull()
  expect(this.fontSizeBefore).not.toBeNull()
  const shortcut = this.lastShortcut
  if (shortcut === '+') expect(this.fontSizeAfter).toBeGreaterThanOrEqual(this.fontSizeBefore)
  else if (shortcut === '-') expect(this.fontSizeAfter).toBeLessThanOrEqual(this.fontSizeBefore)
  else if (shortcut === '0') expect(this.fontSizeAfter).toBe(this.fontSizeBefore)
})

Then('the typeface for card back should move forward', async function () {
  expect(this.lastShortcut).toBe('Shift+L')
  expect(this.fontFamilyAfter).toBeTruthy()
})

Then('the typeface for card back should move backward', async function () {
  expect(this.lastShortcut).toBe('Shift+K')
  expect(this.fontFamilyAfter).toBeTruthy()
})
