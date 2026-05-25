import { SourcesPage } from '../../sources-page.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function sourceFor(actor) {
  const source = actor.recall('sourceToCurate')
  if (!source) {
    throw new Error(`${actor.name} has no remembered source to inspect.`)
  }
  return source
}

function sourcesPage(actor) {
  return new SourcesPage(BrowseTheWeb.as(actor))
}

export const SourceListIsEmpty = {
  async answeredBy(actor) {
    await sourcesPage(actor).expectEmptyHint()
  },
}

export const RememberedSourceIsListed = {
  async answeredBy(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).expectListHeading()
    await sourcesPage(actor).expectListContains(source.address)
  },
}

export const RememberedSourceIsActive = {
  async answeredBy(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).expectSourceActive(source.address)
  },
}

export const RememberedSourceIsPaused = {
  async answeredBy(actor) {
    const source = sourceFor(actor)
    await sourcesPage(actor).expectSourcePaused(source.address)
  },
}

export function RememberedSourceHasHealth(expectedAttr) {
  return {
    async answeredBy(actor) {
      const source = sourceFor(actor)
      await sourcesPage(actor).expectSourceHealth(source.address, expectedAttr)
    },
  }
}

export function RememberedSourceHealthExplains(substring) {
  return {
    async answeredBy(actor) {
      const source = sourceFor(actor)
      await sourcesPage(actor).expectExpandedHealthLabel(source.address, substring)
    },
  }
}
