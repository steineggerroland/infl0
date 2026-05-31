import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'
import { KnowledgeInboxPage } from '../../support/knowledge-inbox.js'
import { BrowseTheWeb } from '../../support/screenplay/abilities/browse-the-web.js'
import { ingestKnowledgeInboxArticle, ingestKnowledgeInboxEpisode } from '../../support/knowledge-inbox-fixtures.js'
import { SaveToKnowledgeInbox } from '../../support/screenplay/tasks/knowledge-inbox.js'

Given('{word} is logged in', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0)
})

Given('{word} is on the timeline', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
})

When('{word} saves an article {string} to the knowledge inbox', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await ingestKnowledgeInboxArticle(page, this, title, { teaser: 'About the future of artificial intelligence.' })
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('article-card')
    .filter({ hasText: title })
    .first()
   await timeline.focusCard(card)
   actor.remember('currentReaderArticleId', await card.getAttribute('data-article-id'))
   await SaveToKnowledgeInbox().performAs(actor)
})

Then('{word} should see a calm confirmation that it was saved', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const alert = page.getByRole('alert').filter({ hasText: /saved/i })
  await expect(alert).toBeVisible({ timeout: 10_000 })
})

Then('{word} should see the article marked as {string} in the timeline', async function (name, status) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const button = page.getByTestId('article-save-inbox').first()
  await expect(button).toBeVisible()
  if (status === 'saved') {
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  }
})

Then('{word} should see the article {string} marked as {string} in the timeline', async function (name, title, status) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('article-card')
    .filter({ hasText: title })
    .first()
  await timeline.focusCard(card)
  const button = card.getByTestId('article-save-inbox')
  await expect(button).toBeVisible()
  await expect(button).toHaveAttribute('aria-pressed', status === 'saved' ? 'true' : 'false')
})

Given('{word} has saved articles in the following order:', async function (name, dataTable) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const rows = dataTable.hashes()
  for (const row of rows) {
    await ingestKnowledgeInboxArticle(page, this, row.title, {
      teaser: `Teaser for ${row.title}.`,
      publishedAt: new Date(row.date).toISOString(),
    })
  }
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  for (const row of rows) {
    const card = page
      .getByTestId('article-card')
      .filter({ hasText: row.title })
      .first()
    await timeline.focusCard(card)
    actor.remember('currentReaderArticleId', await card.getAttribute('data-article-id'))
    await SaveToKnowledgeInbox().performAs(actor)
  }
})

When('{word} navigates to the knowledge inbox', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const inbox = new KnowledgeInboxPage(page)
  await inbox.open()
  await inbox.waitForList()
})

Then('{word} should see {string} as the first item in the list', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const firstItem = page.getByTestId('knowledge-inbox-item').first()
  await expect(firstItem).toContainText(title)
})

Then('{word} should see {string} as the last item in the list', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const lastItem = page.getByTestId('knowledge-inbox-item').last()
  await expect(lastItem).toContainText(title)
})

Then('{word} should see a teaser snippet for each entry', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const items = page.getByTestId('knowledge-inbox-item')
  const count = await items.count()
  expect(count).toBeGreaterThanOrEqual(1)
  for (let i = 0; i < count; i++) {
    const teaser = items.nth(i).locator('p')
    await expect(teaser).toBeVisible()
  }
})

Given('{word} has an article {string} in the knowledge inbox', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await ingestKnowledgeInboxArticle(page, this, title, { teaser: `Teaser for ${title}.` })
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('article-card')
    .filter({ hasText: title })
    .first()
   await timeline.focusCard(card)
   actor.remember('currentReaderArticleId', await card.getAttribute('data-article-id'))
   await SaveToKnowledgeInbox().performAs(actor)
})

When('{word} clicks on the entry for {string}', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const inbox = new KnowledgeInboxPage(page)
  await inbox.itemByTitle(title).click()
})

Then('{word} should be taken to the full reader view of that article', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await expect(page).toHaveURL(/\/articles\//u, { timeout: 15_000 })
  await expect(page.getByTestId('article-detail')).toBeVisible({ timeout: 15_000 })
})

When('{word} removes {string} from the inbox', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const inbox = new KnowledgeInboxPage(page)
  await inbox.removeItem(title)
})

Then('{word} should no longer see {string} in the knowledge inbox list', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await expect(page.getByTestId('knowledge-inbox-item').filter({ hasText: title })).toHaveCount(0)
})

Then('the original article should still be available in the system', async function () {
  const page = this.page
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page.getByTestId('article-card').first()
  await expect(card).toBeVisible({ timeout: 10_000 })
})

When('{word} removes the article {string} from the knowledge inbox on its card', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('article-card')
    .filter({ hasText: title })
    .first()
  await timeline.focusCard(card)
  const button = card.getByTestId('article-save-inbox')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 })
})

When('{word} saves an episode {string} to the knowledge inbox', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await ingestKnowledgeInboxEpisode(page, this, title, { teaser: 'A fascinating podcast episode.' })
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('episode-card')
    .filter({ hasText: title })
    .first()
  await timeline.focusCard(card)
  actor.remember('currentReaderArticleId', await card.getAttribute('data-episode-id'))
  await SaveToKnowledgeInbox('episode').performAs(actor)
})

Then('{word} should see the episode marked as {string} in the timeline', async function (name, status) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const button = page.getByTestId('episode-save-inbox').first()
  await expect(button).toBeVisible()
  if (status === 'saved') {
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  }
})

Then('{word} should see the episode {string} marked as {string} in the timeline', async function (name, title, status) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('episode-card')
    .filter({ hasText: title })
    .first()
  await timeline.focusCard(card)
  const button = card.getByTestId('episode-save-inbox')
  await expect(button).toBeVisible()
  await expect(button).toHaveAttribute('aria-pressed', status === 'saved' ? 'true' : 'false')
})

Given('{word} has saved an episode {string} in the knowledge inbox', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await ingestKnowledgeInboxEpisode(page, this, title, { teaser: `Teaser for ${title}.` })
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('episode-card')
    .filter({ hasText: title })
    .first()
  await timeline.focusCard(card)
  actor.remember('currentReaderArticleId', await card.getAttribute('data-episode-id'))
  await SaveToKnowledgeInbox('episode').performAs(actor)
})

When('{word} removes the episode {string} from the knowledge inbox on its card', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  const card = page
    .getByTestId('episode-card')
    .filter({ hasText: title })
    .first()
  await timeline.focusCard(card)
  const button = card.getByTestId('episode-save-inbox')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'false', { timeout: 10_000 })
})

Then('{word} should see an entry for {string} in the knowledge inbox list', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await expect(page.getByTestId('knowledge-inbox-item').filter({ hasText: title })).toBeVisible()
})

Given('{word} has saved the following items in the knowledge inbox:', async function (name, dataTable) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const rows = dataTable.hashes()
  for (const row of rows) {
    if (row.type === 'article') {
      await ingestKnowledgeInboxArticle(page, this, row.title, {
        teaser: `Teaser for ${row.title}.`,
        publishedAt: new Date(row.date).toISOString(),
      })
    } else {
      await ingestKnowledgeInboxEpisode(page, this, row.title, {
        teaser: `Teaser for ${row.title}.`,
        publishedAt: new Date(row.date).toISOString(),
      })
    }
  }
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  for (const row of rows) {
    if (row.type === 'article') {
      const card = page
        .getByTestId('article-card')
        .filter({ hasText: row.title })
        .first()
      await timeline.focusCard(card)
      actor.remember('currentReaderArticleId', await card.getAttribute('data-article-id'))
      await SaveToKnowledgeInbox().performAs(actor)
    } else {
      const card = page
        .getByTestId('episode-card')
        .filter({ hasText: row.title })
        .first()
      await timeline.focusCard(card)
      actor.remember('currentReaderArticleId', await card.getAttribute('data-episode-id'))
      await SaveToKnowledgeInbox('episode').performAs(actor)
    }
  }
})
