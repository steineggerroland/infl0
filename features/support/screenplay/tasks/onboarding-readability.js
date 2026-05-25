import { expect } from '@playwright/test'
import { OnboardingJourney } from '../../onboarding-journey.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function onboarding(actor) {
  return new OnboardingJourney(BrowseTheWeb.as(actor))
}

function normalizeShortcut(shortcut) {
  if (shortcut === 'Shift+K') return 'Shift+K'
  if (shortcut === 'Shift+L') return 'Shift+L'
  if (shortcut === '+') return '+'
  if (shortcut === '-') return '-'
  if (shortcut === '0') return '0'
  return shortcut
}

async function ensureSurface(actor, topic, surface) {
  const journey = onboarding(actor)
  if (surface === 'front') {
    await journey.focusTopic(topic)
    await expect(journey.front(topic)).toBeVisible()
    return journey.front(topic)
  }
  if (surface === 'back') {
    await journey.flipTopic(topic)
    return journey.back(topic)
  }
  if (surface === 'full-text') {
    await journey.openFullText(topic)
    return journey.fullText(topic)
  }
  throw new Error(`Unknown onboarding surface: ${surface}`)
}

async function readFontSizePx(locator) {
  return locator.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
}

async function readFontFamily(locator) {
  return locator.evaluate((el) => getComputedStyle(el).fontFamily)
}

export const PrepareOnboardingReadability = {
  async performAs(actor) {
    await onboarding(actor).expectCardsVisible()
  },
}

export function UseOnboardingReadabilityShortcut(topic, surface, shortcut) {
  return {
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const target = await ensureSurface(actor, topic, surface)
      await expect(target).toBeVisible()
      await target.click({ force: true })

      const before = {
        fontSize: await readFontSizePx(target),
        fontFamily: await readFontFamily(target),
      }
      const key = normalizeShortcut(shortcut)
      await page.keyboard.press(key)

      if (shortcut === 'Shift+L' || shortcut === 'Shift+K') {
        let tries = 0
        while (tries < 2 && (await readFontFamily(target)) === before.fontFamily) {
          await page.keyboard.press(key)
          tries += 1
        }
      }

      actor.remember('onboardingReadability', {
        topic,
        surface,
        shortcut,
        before,
        after: {
          fontSize: await readFontSizePx(target),
          fontFamily: await readFontFamily(target),
        },
      })
    },
  }
}
