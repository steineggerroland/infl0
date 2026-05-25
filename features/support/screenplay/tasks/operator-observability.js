import { waitForNuxtAppReady } from '../../app-ready.js'
import { postCrawlerSourceHealth } from '../../crawler-fixtures.js'
import { OperatorSourcesPage } from '../../operator-sources-page.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

const operatorSourceFixtures = [
  {
    crawlKey: 'https://example.com/operator-blocked.xml',
    sourceStatus: 'ready',
    sourceHealthStatus: 'blocked',
    operatorAttention: true,
    operatorAttentionReason: 'blocked fixture',
    crawlCandidateCount: 4,
    crawlProcessedCount: 0,
    crawlSkippedCount: 0,
    crawlFetchErrorCount: 4,
    crawlLlmFailedCount: 1,
    sourceHealthJson: { statusCode: 403, retryAfter: '600', cacheControl: 'no-store' },
  },
  {
    crawlKey: 'https://example.com/operator-healthy.xml',
    sourceStatus: 'ready',
    sourceHealthStatus: 'healthy',
    operatorAttention: false,
    operatorAttentionReason: null,
    crawlCandidateCount: 8,
    crawlProcessedCount: 8,
    crawlSkippedCount: 0,
    crawlFetchErrorCount: 0,
    crawlLlmFailedCount: 0,
  },
  {
    crawlKey: 'https://example.com/operator-quiet.xml',
    sourceStatus: 'ready',
    sourceHealthStatus: 'quiet',
    operatorAttention: false,
    operatorAttentionReason: null,
    crawlCandidateCount: 1,
    crawlProcessedCount: 1,
    crawlSkippedCount: 0,
    crawlFetchErrorCount: 0,
    crawlLlmFailedCount: 0,
  },
]

function operatorPage(actor) {
  return new OperatorSourcesPage(BrowseTheWeb.as(actor))
}

export const SignInAsSeededOperator = {
  async performAs(actor) {
    if (!actor.world.browser) throw new Error('Browser not initialized.')
    await BrowseTheWeb.withFreshSession(actor)

    const email = process.env.OPERATOR_LOGIN_EMAIL?.trim()
    const password = process.env.OPERATOR_LOGIN_PASSWORD?.trim()
    if (!email || !password) {
      throw new Error(
        'OPERATOR_LOGIN_EMAIL and OPERATOR_LOGIN_PASSWORD are required for seeded operator login.',
      )
    }

    const page = BrowseTheWeb.as(actor)
    await page.goto('/login')
    await waitForNuxtAppReady(page)
    await page.getByLabel('Email').fill(email)
    await page.locator('input[autocomplete="current-password"]').fill(password)
    await Promise.all([
      page.waitForURL(/\/(\?|$)/u, { timeout: 60_000 }),
      page.getByRole('button', { name: 'Sign in' }).click(),
    ])
  },
}

export const ReportOperatorSourceHealth = {
  async performAs(actor) {
    if (!process.env.NUXT_CRAWLER_API_KEY?.trim()) {
      throw new Error('NUXT_CRAWLER_API_KEY is not set')
    }
    for (const body of operatorSourceFixtures) {
      await postCrawlerSourceHealth(BrowseTheWeb.as(actor), body)
    }
  },
}

export const OpenOperatorSourceObservability = {
  async performAs(actor) {
    await operatorPage(actor).open()
  },
}

export function FilterOperatorSources(label) {
  return {
    async performAs(actor) {
      await operatorPage(actor).activateFilter(label)
    },
  }
}
