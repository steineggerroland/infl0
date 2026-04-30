import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

function topicCard(world, topic) {
  return world.page.locator(`[data-onboarding-topic="${topic}"]`).first()
}

async function focusTopic(world, topic) {
  const card = topicCard(world, topic)
  await expect(card).toBeVisible()
  await card.scrollIntoViewIfNeeded()
  await card.locator('[data-onboarding-title]').first().click()
  await world.page.waitForTimeout(150)
  world.currentTopic = topic
  return card
}

async function ensureSurface(world, surface) {
  const topic = world.currentTopic
  const card = topicCard(world, topic)
  if (surface === 'front') {
    await expect(card.locator(`[data-onboarding-front="${topic}"]`)).toBeVisible()
    world.currentSurface = 'front'
    return
  }
  if (surface === 'back') {
    const back = card.locator(`[data-onboarding-back="${topic}"]`)
    if (!(await back.isVisible())) {
      await card.locator('.action-flip-front').click({ force: true })
      await expect(back).toBeVisible()
    }
    world.currentSurface = 'back'
    return
  }
  if (surface === 'full-text') {
    await ensureSurface(world, 'back')
    const openFull = world.page.locator(`[data-onboarding-open-full="${topic}"]`).first()
    await openFull.evaluate((el) => el.click())
    await expect(world.page.locator(`[data-onboarding-full="${topic}"]`).first()).toBeVisible()
    world.currentSurface = 'full-text'
  }
}

function activeCopyLocator(world) {
  const topic = world.currentTopic
  if (world.currentSurface === 'back') return world.page.locator(`[data-onboarding-back="${topic}"]`)
  if (world.currentSurface === 'full-text') return world.page.locator(`[data-onboarding-full="${topic}"]`)
  return world.page.locator(`[data-onboarding-front="${topic}"]`)
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
  await focusTopic(this, topic)
})

Then('I should see onboarding cards before regular articles', async function () {
  const firstItemIsOnboarding = await this.page
    .locator('.scroll-container > div')
    .first()
    .locator('[data-testid="onboarding-card"]')
    .count()
  expect(firstItemIsOnboarding).toBeGreaterThan(0)
})

Then('the onboarding topics should be ordered as:', async function (table) {
  const expected = table.hashes().map((r) => r.topic)
  const topics = await this.page
    .locator('[data-testid="onboarding-card"]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-onboarding-topic')))
  expect(topics).toEqual(expected)
})

Then('I should see the intro headline', async function () {
  const title = this.page.locator('[data-onboarding-topic="intro"] [data-onboarding-title="intro"]')
  await expect(title).toBeVisible()
  await expect(title).not.toHaveText('')
})

Then('I should see guidance to flip the card', async function () {
  const text = this.page.locator('[data-onboarding-front="intro"]')
  await expect(text).toBeVisible()
  const content = (await text.textContent()) ?? ''
  expect(content).toMatch(/(flip|click the card|shortcut "E"|shortcut "e")/iu)
})

When('I flip the {string} onboarding card', async function (topic) {
  const card = await focusTopic(this, topic)
  await card.locator('.action-flip-front').click()
  await expect(card.locator(`[data-onboarding-back="${topic}"]`)).toBeVisible()
  this.currentSurface = 'back'
})

Then('I should see details about moving to the next and previous cards', async function () {
  const text = this.page.locator('[data-onboarding-back="intro"]')
  const content = (await text.textContent()) ?? ''
  expect(content).toMatch(/(W\/S|arrow keys|next|previous)/iu)
})

Then('I should see how to open full text', async function () {
  await expect(this.page.locator('[data-onboarding-open-full="intro"]')).toBeVisible()
})

When('I open full text on the {string} onboarding card', async function (topic) {
  await focusTopic(this, topic)
  await ensureSurface(this, 'full-text')
  await expect(this.page.locator(`[data-onboarding-full="${topic}"]`).first()).toBeVisible()
  this.currentSurface = 'full-text'
})

Then('the copy should ask me to continue to the next onboarding card', async function () {
  const content = (await this.page.locator('[data-onboarding-full="intro"]').textContent()) ?? ''
  expect(content).toMatch(/(next)/iu)
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
  await focusTopic(this, topic)
  const cta = topicCard(this, topic).locator(`.onboarding-front [data-onboarding-cta="${topic}"]`)
  await expect(cta).toBeVisible()
})

When('I activate the scoring CTA', async function () {
  const cta = topicCard(this, 'scoring').locator('.onboarding-front [data-onboarding-cta="scoring"]')
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
