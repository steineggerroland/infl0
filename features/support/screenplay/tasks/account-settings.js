import { SettingsPage } from '../../settings-page.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export const OpenAccountSettings = {
  async performAs(actor) {
    const page = BrowseTheWeb.as(actor)
    await new SettingsPage(page).openAccount()
    await page.locator('#account').scrollIntoViewIfNeeded()
  },
}
