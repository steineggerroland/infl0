import { DisplaySettingsPanel } from '../../display-settings-panel.js'
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
    const panel = new DisplaySettingsPanel(BrowseTheWeb.as(actor))
    await panel.chooseAppearance('Always dark')
    await panel.choosePalette('Warm · red')
    await panel.chooseMotion('Reduced')
    await panel.setCardFrontTypeface('Lexend')
    await panel.setCardFrontTextSize(40)
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
