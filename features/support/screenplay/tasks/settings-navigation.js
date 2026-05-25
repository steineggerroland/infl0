import { SettingsNavigation } from '../../settings-navigation.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const PrepareSettingsExploration = {
  async performAs(actor) {
    await new SettingsNavigation(BrowseTheWeb.as(actor)).prepareWideLayout()
  },
}

export function OpenSettingsSection(path) {
  return {
    async performAs(actor) {
      await new SettingsNavigation(BrowseTheWeb.as(actor)).open(path)
      actor.remember('settingsPath', path)
    },
  }
}

export function FollowSettingsSection(slug) {
  return {
    async performAs(actor) {
      await new SettingsNavigation(BrowseTheWeb.as(actor)).followSection(slug)
      actor.remember('settingsPath', `/settings#${slug}`)
    },
  }
}
