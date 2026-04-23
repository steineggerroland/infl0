import { test, expect, type Page } from '@playwright/test'

const UI_PREFS_KEY = 'infl0.uiPrefs.v1'

async function readCardFrontSize(page: Page): Promise<number | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const o = JSON.parse(raw) as { surfaces?: { 'card-front'?: { fontSize?: number } } }
    return o.surfaces?.['card-front']?.fontSize ?? null
  }, UI_PREFS_KEY)
}

async function readCardFrontFont(page: Page): Promise<string | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const o = JSON.parse(raw) as { surfaces?: { 'card-front'?: { fontFamily?: string } } }
    return o.surfaces?.['card-front']?.fontFamily ?? null
  }, UI_PREFS_KEY)
}

/**
 * Timeline shortcuts (`ArticleView` when a card is selected) mirror prefs into
 * `localStorage` immediately. Requires a non-empty timeline (seeded dev data).
 */
test.describe('readability keyboard (signed in, timeline)', () => {
  test('+= 0 and Shift+L change card-front font size / family in localStorage', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.article').first()).toBeVisible({ timeout: 30_000 })

    let size = await readCardFrontSize(page)
    expect(size).not.toBeNull()

    if (size === 47) {
      await page.keyboard.press('Minus')
      size = await readCardFrontSize(page)
    }
    expect(size).toBeLessThan(47)

    await page.keyboard.press('Equal')
    const afterEqual = await readCardFrontSize(page)
    expect(afterEqual).toBe((size as number) + 1)

    await page.keyboard.press('Digit0')
    const after0 = await readCardFrontSize(page)
    expect(after0).toBe(45)

    const fontBefore = await readCardFrontFont(page)
    expect(fontBefore).toBeTruthy()
    await page.keyboard.press('Shift+KeyL')
    const fontAfter = await readCardFrontFont(page)
    expect(fontAfter).not.toBe(fontBefore)
  })
})
