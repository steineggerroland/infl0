import { expect } from '@playwright/test'
import { DisplaySettingsPanel } from '../../display-settings-panel.js'
import { browserFetchJson } from '../../crawler-fixtures.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

const WIDE_VIEWPORT = { width: 1440, height: 900 }

export const PrepareDisplaySettings = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await page.setViewportSize(WIDE_VIEWPORT)
    await new DisplaySettingsPanel(page).open()
  },
}

export const ChooseLowStimulationDisplayPreferences = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    const panel = new DisplaySettingsPanel(page)
    await panel.chooseAppearance('Always dark')
    await panel.choosePalette('Warm · red')
    await panel.chooseMotion('Reduced')
    await panel.setCardFrontTypeface('Lexend')
    await panel.setCardFrontTextSize(40)
    await panel.expectMotion('Reduced')
    await panel.expectAppearance('Always dark')
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced')
    await expect.poll(async () => {
      const res = await browserFetchJson(page, '/api/me/ui-prefs')
      return res.ok ? res.data?.motion : `failed:${res.status}`
    }, {
      message: 'low-stimulation motion preference should be persisted before leaving settings',
      timeout: 10_000,
    }).toBe('reduced')
    actor.remember('displayPreferences', {
      appearance: 'Always dark',
      palette: 'Warm · red',
      motion: 'Reduced',
      typeface: 'Lexend',
      textSize: 40,
    })
  },
}

export function ChooseCustomCardFrontBackground(hex) {
  return {
    async performAs(actor) {
      const panel = new DisplaySettingsPanel(BrowseTheWeb.as(actor))
      await panel.chooseCustomColours()
      await panel.expectCardFrontColourControls()
      await panel.setCardFrontBackground(hex)
      actor.remember('cardFrontBackground', hex)
    },
  }
}
