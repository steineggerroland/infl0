import { Given, When, Then } from '@cucumber/cucumber'
import { postCrawlerSourceHealth } from '../support/crawler-fixtures.js'
import { waitForNuxtAppReady } from '../support/app-ready.js'
import { SourcesPage } from '../support/sources-page.js'

function sourcesPage(world) {
  return new SourcesPage(world.page)
}

When('I open the sources page', async function () {
  await sourcesPage(this).open()
})

Then('I should see the empty sources hint', async function () {
  await sourcesPage(this).expectEmptyHint()
})

When(
  'I add a source with address {string} and display name {string}',
  { timeout: 150_000 },
  async function (address, displayName) {
    await sourcesPage(this).addSource(this, address, displayName)
  },
)

Then('I should see the source list containing {string}', async function (snippet) {
  await sourcesPage(this).expectListContains(snippet)
})

When('I remove the source row for {string}', async function (snippet) {
  await sourcesPage(this).removeSource(snippet)
})

Given('the crawler API key is configured', function () {
  if (!process.env.NUXT_CRAWLER_API_KEY?.trim()) {
    throw new Error(
      'NUXT_CRAWLER_API_KEY is required for crawler BDD steps (merge .env.e2e into env for test:bdd).',
    )
  }
})

When(
  'I post crawler source health for the last added source as {string}',
  async function (healthStatus) {
    const crawlKey = this.lastCrawlKey
    if (!crawlKey) {
      throw new Error('No last added source — run the add-source step first (lastCrawlKey missing).')
    }
    await postCrawlerSourceHealth(this.page, {
      crawlKey,
      sourceStatus: 'ready',
      sourceHealthStatus: healthStatus,
    })
    await this.page.reload()
    await waitForNuxtAppReady(this.page)
  },
)

Then(
  'the feed row for {string} should have source health {string}',
  async function (snippet, expectedAttr) {
    await sourcesPage(this).expectSourceHealth(snippet, expectedAttr)
  },
)

When('I expand the source row for {string}', async function (snippet) {
  await sourcesPage(this).expandRow(snippet)
})

Then(
  'the expanded health label for {string} should include {string}',
  async function (snippet, substring) {
    await sourcesPage(this).expectExpandedHealthLabel(snippet, substring)
  },
)

When('I pause the source row for {string}', async function (snippet) {
  await sourcesPage(this).pauseSource(snippet)
})

When('I resume the source row for {string}', async function (snippet) {
  await sourcesPage(this).resumeSource(snippet)
})

Then('the source row for {string} should be active', async function (snippet) {
  await sourcesPage(this).expectSourceActive(snippet)
})

Then('the source row for {string} should be paused', async function (snippet) {
  await sourcesPage(this).expectSourcePaused(snippet)
})

Then('I should see the sources list heading', async function () {
  await sourcesPage(this).expectListHeading()
})
