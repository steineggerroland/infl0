import { SettingsNavigation } from '../../settings-navigation.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export function SettingsSectionVisible(section) {
  return {
    async answeredBy(actor) {
      const page = new SettingsNavigation(BrowseTheWeb.as(actor))
      const path = actor.recall('settingsPath')
      if (!path) throw new Error(`${actor.name} has no remembered settings path.`)

      await page.expectLocation(path)
      if (section === 'appearance') {
        await page.expectAppearanceSection()
        return
      }
      if (section === 'sorting') {
        await page.expectSortingSection()
        return
      }
      if (section === 'theme') {
        await page.expectThemeSection()
        return
      }
      throw new Error(`Unknown settings section: ${section}`)
    },
  }
}
