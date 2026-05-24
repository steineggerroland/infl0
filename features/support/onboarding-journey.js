import { expect } from '@playwright/test'

const ONBOARDING_TOPICS = ['intro', 'sources', 'scoring', 'themes']

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class OnboardingJourney {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }

  card(topic) {
    return this.page.locator(`[data-onboarding-topic="${topic}"]`).first()
  }

  front(topic) {
    return this.page.locator(`[data-onboarding-front="${topic}"]`).first()
  }

  back(topic) {
    return this.page.locator(`[data-onboarding-back="${topic}"]`).first()
  }

  fullText(topic) {
    return this.page.locator(`[data-onboarding-full="${topic}"]`).first()
  }

  async expectCardsVisible() {
    await expect(this.page.getByTestId('onboarding-card').first()).toBeVisible({ timeout: 20_000 })
  }

  async expectCardsBeforeArticles() {
    const firstItemHasOnboarding = await this.page
      .locator('.scroll-container > div')
      .first()
      .locator('[data-testid="onboarding-card"]')
      .count()
    expect(firstItemHasOnboarding).toBeGreaterThan(0)
  }

  async expectTopicsInOrder(expectedTopics = ONBOARDING_TOPICS) {
    const topics = await this.page
      .locator('[data-testid="onboarding-card"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-onboarding-topic')))
    expect(topics).toEqual(expectedTopics)
  }

  async focusTopic(topic) {
    const targetIndex = ONBOARDING_TOPICS.indexOf(topic)
    if (targetIndex < 0) throw new Error(`Unknown onboarding topic: ${topic}`)

    await expect(this.card('intro')).toBeVisible({ timeout: 20_000 })
    let currentTopic = await this.readStoredTopic()
    if (!currentTopic) {
      await this.waitForStoredTopic('intro')
      currentTopic = 'intro'
    }

    let currentIndex = ONBOARDING_TOPICS.indexOf(currentTopic)
    if (currentIndex < 0) currentIndex = 0

    while (currentIndex < targetIndex) {
      currentIndex += 1
      await this.page.keyboard.press('s')
      await this.waitForStoredTopic(ONBOARDING_TOPICS[currentIndex])
    }

    while (currentIndex > targetIndex) {
      currentIndex -= 1
      await this.page.keyboard.press('w')
      await this.waitForStoredTopic(ONBOARDING_TOPICS[currentIndex])
    }

    const card = this.card(topic)
    await expect(card).toHaveAttribute('data-reader-selected', 'true', { timeout: 10_000 })
    await expect.poll(async () => this.visibleRatio(card), { timeout: 15_000 }).toBeGreaterThan(0.5)
    return card
  }

  async flipTopic(topic) {
    await this.focusTopic(topic)
    if (await this.back(topic).isVisible()) return
    await this.front(topic).click()
    await expect(this.back(topic)).toBeVisible()
  }

  async openFullText(topic) {
    await this.flipTopic(topic)
    await this.page.locator(`[data-onboarding-open-full="${topic}"]`).first().evaluate((el) => el.click())
    await expect(this.fullText(topic)).toBeVisible()
  }

  async finishFromTopic(topic) {
    const card = await this.focusTopic(topic)
    const skip = card.locator('[data-onboarding-skip]').first()
    await expect(skip).toBeVisible({ timeout: 10_000 })
    await skip.click()
    await expect(this.page.getByTestId('onboarding-card')).toHaveCount(0, { timeout: 15_000 })
  }

  async reloadKeepingTopic(topic) {
    await this.waitForStoredTopic(topic)
    await this.page.reload({ waitUntil: 'networkidle' })
  }

  async expectTopicRestored(topic) {
    const card = this.card(topic)
    await expect(card).toBeVisible()
    await expect.poll(async () => this.visibleRatio(card), { timeout: 15_000 }).toBeGreaterThan(0.5)
  }

  async expectUrlForTopic(topic) {
    await expect(this.page).toHaveURL(new RegExp(`/inflow/onboarding/${escapeRegExp(topic)}$`, 'u'))
  }

  async expectIntroHeadline() {
    const title = this.page.locator('[data-onboarding-topic="intro"] [data-onboarding-title="intro"]')
    await expect(title).toBeVisible()
    await expect(title).not.toHaveText('')
  }

  async expectGuidanceToFlip() {
    await expect(this.front('intro')).toBeVisible()
    const content = (await this.front('intro').textContent()) ?? ''
    expect(content).toMatch(/(flip|click the card|shortcut "E"|shortcut "e")/iu)
  }

  async expectIntroNavigationDetails() {
    const content = (await this.back('intro').textContent()) ?? ''
    expect(content).toMatch(/(W\/S|arrow keys|next|previous)/iu)
  }

  async expectIntroFullTextAffordance() {
    await expect(this.page.locator('[data-onboarding-open-full="intro"]')).toBeVisible()
  }

  async expectIntroFullTextHelpLink() {
    const openDialog = this.page.locator('dialog[open]').first()
    await expect(openDialog).toBeVisible()
    await expect(openDialog.locator('a[href="/help"]').first()).toBeVisible()
  }

  async expectIntroFullTextContinuation() {
    const content = (await this.fullText('intro').textContent()) ?? ''
    expect(content).toMatch(/(next)/iu)
  }

  async readStoredTopic() {
    const raw = await this.page.evaluate(() => window.localStorage.getItem('infl0.inflow.returnContext.v1'))
    if (!raw) return ''
    try {
      const id = JSON.parse(raw).anchor?.id ?? ''
      return id.startsWith('onboarding/') ? id.slice('onboarding/'.length) : ''
    } catch {
      return ''
    }
  }

  async waitForStoredTopic(topic) {
    await expect.poll(async () => this.readStoredTopic(), { timeout: 15_000 }).toBe(topic)
  }

  async visibleRatio(locator) {
    return locator.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
      if (rect.height <= 0) return 0
      return Math.max(0, Math.min(visibleHeight, rect.height)) / rect.height
    })
  }
}
