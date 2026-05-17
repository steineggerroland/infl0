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

async function waitForTimelineShell(page) {
  await expect(
    page.locator('[data-testid="reader-start"], .scroll-container').first(),
  ).toBeVisible({ timeout: 20_000 })
}

function showReadMenuInput(page) {
  return page.getByTestId('menu-show-read-toggle').locator('input[type="checkbox"]')
}

async function openUserMenu(page) {
  const menu = page.locator('body > header .dropdown.dropdown-end').first()
  const summary = menu.locator('summary').first()
  await expect(summary).toBeVisible({ timeout: 15_000 })
  const isOpen = await menu.evaluate((el) => el instanceof HTMLDetailsElement && el.open)
  if (!isOpen) await summary.click()
  const input = showReadMenuInput(page)
  await expect(input).toBeVisible({ timeout: 10_000 })
  return input
}

async function closeUserMenu(page) {
  await page.keyboard.press('Escape')
}

/** Matches `readerIsInteractive` on the timeline: `r` only works after reader start or with onboarding. */
async function isShowReadShortcutActive(page) {
  const readerStart = page.getByTestId('reader-start')
  if (!(await readerStart.isVisible())) return true
  return (await page.getByTestId('onboarding-card').count()) > 0
}

async function readShowReadChecked(page) {
  const input = await openUserMenu(page)
  return input.isChecked()
}

/**
 * Set show-read like a user: `r` when the timeline shortcut is active, otherwise the
 * menu switch via `check()` / `uncheck()` on the native input (not label `click()`).
 */
export async function setShowReadArticles(page, show) {
  await page.goto('/')
  await waitForTimelineShell(page)

  if ((await readShowReadChecked(page)) === show) {
    await closeUserMenu(page)
    return
  }

  if (await isShowReadShortcutActive(page)) {
    await closeUserMenu(page)
    await page.locator('body').click({ position: { x: 8, y: 8 } })
    await page.keyboard.press('r')
    await expect.poll(async () => readShowReadChecked(page), { timeout: 15_000 }).toBe(show)
    await closeUserMenu(page)
    return
  }

  const input = await openUserMenu(page)
  if (show) await input.check()
  else await input.uncheck()
  await expect.poll(async () => input.isChecked(), { timeout: 15_000 }).toBe(show)
  await closeUserMenu(page)
}

export function readerArticleCard(page, articleId) {
  return page.locator(`[data-testid="article-card"][data-article-id="${articleId}"]`).first()
}
