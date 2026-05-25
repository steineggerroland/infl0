import { OperatorSourcesPage } from '../../operator-sources-page.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function operatorPage(actor) {
  return new OperatorSourcesPage(BrowseTheWeb.as(actor))
}

export const OperatorAccessIsDenied = {
  async answeredBy(actor) {
    await operatorPage(actor).expectAccessDenied()
  },
}

export const OperatorHealthSummaryIsVisible = {
  async answeredBy(actor) {
    await operatorPage(actor).expectSummaryBand()
  },
}

export const OperatorAttentionSourcesAreFirst = {
  async answeredBy(actor) {
    await operatorPage(actor).expectAttentionFirst()
  },
}

export const OperatorSourcesHaveRows = {
  async answeredBy(actor) {
    await operatorPage(actor).expectRows()
  },
}

export function OperatorTableIncludesSource(crawlKey) {
  return {
    async answeredBy(actor) {
      await operatorPage(actor).expectIncludesSource(crawlKey)
    },
  }
}

export function OperatorTableExcludesSource(crawlKey) {
  return {
    async answeredBy(actor) {
      await operatorPage(actor).expectExcludesSource(crawlKey)
    },
  }
}
