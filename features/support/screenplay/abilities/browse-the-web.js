export class BrowseTheWeb {
  static async withFreshSession(actor) {
    const { world } = actor
    if (world.page) await world.page.close()
    if (world.context) await world.context.close()
    world.context = await world.browser.newContext({
      baseURL: world.baseURL,
      locale: 'en-US',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    world.page = await world.context.newPage()
    return world.page
  }

  static as(actor) {
    if (!actor.page) {
      throw new Error(`${actor.name} cannot browse because no Playwright page is active.`)
    }
    return actor.page
  }
}
