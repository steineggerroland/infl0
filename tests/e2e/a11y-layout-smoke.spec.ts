import { test, expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = ['/', '/help', '/login'] as const

/** Nitro + auth + i18n can chain redirects on `/`; wait for real app markup. */
async function gotoAndSettleOnMain(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
  await page.locator('main#main').first().waitFor({ state: 'attached', timeout: 15_000 })
  await expect(page.locator('main#main')).toHaveCount(1)
}

/**
 * Ensure the first Tab moves from the document into page content. Without a
 * prior click, Chromium often keeps focus outside/inert and the skip link
 * never receives Tab.
 */
async function primeKeyboardFromPageRoot(page: Page) {
  await page.locator('body').click({ position: { x: 8, y: 8 } })
}

/** Skip link is first in DOM on some pages but not always first in tab order. */
async function focusSkipLinkWithTab(page: Page, skip: Locator) {
  await primeKeyboardFromPageRoot(page)
  for (let i = 0; i < 24; i++) {
    const onSkip = await skip.evaluate((el) => document.activeElement === el)
    if (onSkip) return
    await page.keyboard.press('Tab')
  }
  await expect(skip).toBeFocused()
}

/**
 * One keyboard path: Tab → skip link (focus + visible outline) → Enter →
 * focus lands on `<main id="main">`. Do not send a second Tab afterward while
 * focus is still on `main` — that would advance tab order past the skip link.
 */
async function expectSkipLinkFocusRingAndActivateMain(page: Page) {
  const skip = page.locator('a[href="#main"]').first()
  await expect(skip).toHaveCount(1)

  await focusSkipLinkWithTab(page, skip)

  const outline = await skip.evaluate((el) => {
    const s = window.getComputedStyle(el)
    return {
      style: s.outlineStyle,
      width: s.outlineWidth,
    }
  })
  expect(outline.style).not.toBe('none')
  expect(Number.parseFloat(outline.width)).toBeGreaterThan(0)

  await page.keyboard.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()
}

async function expectNoCriticalAxeViolations(page: Page) {
  const analysis = await new AxeBuilder({ page }).analyze()
  const critical = analysis.violations.filter((v) =>
    ['critical', 'serious'].includes(v.impact ?? ''),
  )
  expect(critical).toEqual([])
}

/** Largest duration in a comma-separated computed time list (e.g. `0s, 0.2s`). */
function maxCssTimeSeconds(value: string): number {
  const parts = value
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((n) => Number.isFinite(n))
  return parts.length === 0 ? 0 : Math.max(0, ...parts)
}

/**
 * Under `prefers-reduced-motion: reduce`, the native `dialog.modal::backdrop`
 * must not run timed motion (DaisyUI often animates it separately from
 * `.modal` / `.modal-box`). Uses a real `<dialog class="modal">` + `showModal()`
 * so we exercise `getComputedStyle(el, '::backdrop')`, not only stylesheet text.
 */
async function expectDialogModalBackdropIsMotionFree(page: Page) {
  const backdrop = await page.evaluate(() => {
    const d = document.createElement('dialog')
    d.className = 'modal'
    document.body.appendChild(d)
    d.showModal()
    const s = getComputedStyle(d, '::backdrop')
    const out = {
      animationDuration: s.animationDuration,
      transitionDuration: s.transitionDuration,
    }
    d.close()
    d.remove()
    return out
  })

  expect(maxCssTimeSeconds(backdrop.animationDuration)).toBe(0)
  expect(maxCssTimeSeconds(backdrop.transitionDuration)).toBe(0)
}

for (const route of ROUTES) {
  test(`a11y smoke on ${route}`, async ({ page }) => {
    await gotoAndSettleOnMain(page, route)
    await expectSkipLinkFocusRingAndActivateMain(page)
    await expectNoCriticalAxeViolations(page)
  })
}

test('dialog.modal ::backdrop has no timed motion under prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoAndSettleOnMain(page, '/login')
  await expect(page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).resolves.toBe(true)
  await expectDialogModalBackdropIsMotionFree(page)
})
