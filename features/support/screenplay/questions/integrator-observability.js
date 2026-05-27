import { expect } from '@playwright/test'
import { OperatorIngestPage } from '../../operator-ingest-page.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function ingestPage(actor) {
  return new OperatorIngestPage(BrowseTheWeb.as(actor))
}

export const IntegratorDashboardShowsRecentRequests = {
  async answeredBy(actor) {
    await ingestPage(actor).expectDashboard()
    await expect(BrowseTheWeb.as(actor).getByTestId('ingest-request-list')).toContainText('success')
  },
}

export const LatestTenRequestsAreGreen = {
  async answeredBy(actor) {
    await expect(BrowseTheWeb.as(actor).getByTestId('ingest-summary-latest-ten')).toContainText('Green')
  },
}

export const IngestAcceptedCountsAreVisible = {
  async answeredBy(actor) {
    await ingestPage(actor).expectAcceptedCountMetrics()
  },
}

export const RejectedAuthRequestIsVisible = {
  async answeredBy(actor) {
    const row = await ingestPage(actor).expectRejectedRequest('auth_failed')
    await expect(row).toContainText('auth_failed')
  },
}

export const CrawlerKeyIsHidden = {
  async answeredBy(actor) {
    await ingestPage(actor).expectNoCrawlerKeyIsExposed()
  },
}

export const InvalidStructureDetailsAreVisible = {
  async answeredBy(actor) {
    const row = await ingestPage(actor).expectRejectedRequest('invalid_structure')
    await expect(row).toContainText('Missing required fields')
    await expect(row.getByTestId('ingest-request-preview')).toContainText('bdd-ingo-invalid-structure')
  },
}

export const UnsupportedContentDetailsAreVisible = {
  async answeredBy(actor) {
    const row = await ingestPage(actor).expectRejectedRequest('unsupported_content')
    await expect(row).toContainText('item_kind section is not supported yet')
    await expect(row.getByTestId('ingest-request-preview')).toContainText('"item_kind": "section"')
  },
}

export const UnsupportedContentReachedInfl0 = {
  async answeredBy(actor) {
    const row = await ingestPage(actor).expectRejectedRequest('unsupported_content')
    await expect(row).toContainText('HTTP')
    await expect(row).toContainText('400')
  },
}
