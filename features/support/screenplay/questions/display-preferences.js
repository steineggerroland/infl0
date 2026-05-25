import { DisplaySettingsPanel } from '../../display-settings-panel.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const DisplayPreferencesPersist = {
  async answeredBy(actor) {
    const preferences = actor.recall('displayPreferences')
    if (!preferences) throw new Error(`${actor.name} has no remembered display preferences.`)

    const panel = new DisplaySettingsPanel(BrowseTheWeb.as(actor))
    await panel.reload()
    await panel.expectAppearance(preferences.appearance)
    await panel.expectPalette(preferences.palette)
    await panel.expectMotion(preferences.motion)
    await panel.expectCardFrontTypeface(preferences.typeface)
    await panel.expectCardFrontTextSize(preferences.textSize)
  },
}

export const CardFrontBackgroundPersists = {
  async answeredBy(actor) {
    const hex = actor.recall('cardFrontBackground')
    if (!hex) throw new Error(`${actor.name} has no remembered card front background.`)

    const panel = new DisplaySettingsPanel(BrowseTheWeb.as(actor))
    await panel.reload()
    await panel.expectCardFrontColourControls()
    await panel.expectCardFrontBackground(hex)
  },
}
