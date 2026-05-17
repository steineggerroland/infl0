import { expect } from '@playwright/test'

export function sourceRow(page, snippet) {
  return page.locator('[data-testid="feeds-source-list"] li').filter({ hasText: snippet })
}

export async function rememberFeedFromRow(page, world, feedUrl) {
  const row = sourceRow(page, feedUrl)
  await expect(row).toBeVisible({ timeout: 15_000 })
  const crawlKey = await row.getAttribute('data-crawl-key')
  const feedId = await row.getAttribute('data-feed-id')
  if (!crawlKey) {
    throw new Error(`Source row for ${feedUrl} is missing data-crawl-key.`)
  }
  world.lastCrawlKey = crawlKey
  world.lastFeedId = feedId
}

export async function addSourceViaUi(page, world, address, displayName) {
  await page.goto('/feeds')
  await expect(page.getByTestId('feeds-add-fieldset')).toBeVisible({ timeout: 30_000 })
  await page.locator('#feed-url-input').fill(address)
  await page.locator('#feed-display-input').fill(displayName)
  const submit = page.locator('[data-testid="feeds-add-fieldset"] button[type="submit"]')
  const errorAlert = page.getByTestId('feeds-add-error')
  const row = sourceRow(page, address)
  await expect(submit).toBeEnabled({ timeout: 30_000 })
  await submit.scrollIntoViewIfNeeded()
  await submit.click()
  await expect
    .poll(
      async () => {
        if (await errorAlert.isVisible()) return 'error'
        if ((await row.count()) > 0) return 'ok'
        return 'pending'
      },
      { timeout: 90_000 },
    )
    .not.toBe('pending')
  if (await errorAlert.isVisible()) {
    throw new Error(`Add source failed in UI: ${await errorAlert.textContent()}`)
  }
  await expect(row).toBeVisible({ timeout: 15_000 })
  await rememberFeedFromRow(page, world, address)
}

export async function hideOnboardingCards(page) {
  await page.goto('/settings#onboarding')
  const toggle = page.getByTestId('onboarding-visible-toggle')
  await expect(toggle).toBeEnabled({ timeout: 20_000 })
  if (await toggle.isChecked()) {
    await toggle.click()
    await expect(toggle).not.toBeChecked({ timeout: 15_000 })
  }
}

export async function setReadingBehaviourTracking(page, enabled) {
  await page.goto('/settings#tracking')
  const toggle = page.getByTestId('tracking-toggle')
  await expect(toggle).toBeEnabled({ timeout: 20_000 })
  const checked = await toggle.isChecked()
  if (checked !== enabled) {
    await toggle.click()
    await expect.poll(async () => toggle.isChecked(), { timeout: 15_000 }).toBe(enabled)
  }
}

export async function setShowReadArticles(page, show) {
  await page.goto('/')
  const menu = page.locator('body > header .dropdown.dropdown-end').first()
  const summary = menu.locator('summary').first()
  await expect(summary).toBeVisible({ timeout: 15_000 })
  const isOpen = await menu.evaluate((el) => el instanceof HTMLDetailsElement && el.open)
  if (!isOpen) await summary.click()
  const menuToggle = page.getByTestId('menu-show-read-toggle').getByRole('switch')
  await expect(menuToggle).toBeVisible({ timeout: 10_000 })
  const checked = await menuToggle.isChecked()
  if (checked !== show) {
    await menuToggle.click()
    await expect.poll(async () => menuToggle.isChecked(), { timeout: 15_000 }).toBe(show)
  }
}

export function readerArticleCard(page, articleId) {
  return page.locator(`[data-testid="article-card"][data-article-id="${articleId}"]`).first()
}
