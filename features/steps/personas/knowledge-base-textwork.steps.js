import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'
import { BrowseTheWeb } from '../../support/screenplay/abilities/browse-the-web.js'
import { ingestKnowledgeInboxArticle, ingestKnowledgeInboxEpisode } from '../../support/knowledge-inbox-fixtures.js'
import { CreateReadingNote, CreateReadingNoteViaApi, DeleteReadingNote, FilterReadingNotesByTag, HoverReadingNoteCard, NavigateToGlobalReadingNotes, NavigateToTagsIndex, StartLearningFocus } from '../../support/screenplay/tasks/knowledge-base-textwork.js'
import { ActiveReadingNoteHighlightTextIs, LearningFocusGuidanceIsVisible, ReadingNoteCountIs, ReadingNoteHighlightCount, ReadingNoteHighlightIsNotVisible, ReadingNoteHighlightIsVisible, TagsIndexShowsTag } from '../../support/screenplay/questions/knowledge-base-textwork.js'

const KB_ARTICLE_CONTENT = `# The Future of AI

Body for The Future of AI.

Artificial intelligence will transform all industries. AI has the potential to revolutionize healthcare and education. Need to explore the ethical implications further.

AI will change everything. AI has potential in healthcare and education. This is an Interesting perspective. AI will transform industries. AI is the future. Thought provoking.`

const KB_EPISODE_CONTENT = `# The Science of Sound

Body for The Science of Sound.

Sound waves propagate through air. This is a fascinating episode about the physics of sound and how we perceive audio.`

Given('{word} is logged in as a knowledge-base user', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0)
})

Given('{word} has an article {string} in her timeline for knowledge-base', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await ingestKnowledgeInboxArticle(page, this, title, { teaser: 'About the future of artificial intelligence.', contentMd: KB_ARTICLE_CONTENT })
})

Given('{word} has opened the article {string} for reading in knowledge-base', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()

  const card = page.getByTestId('article-card').filter({ hasText: title }).first()
  await timeline.focusCard(card)
  const articleId = await card.getAttribute('data-article-id')
  actor.remember('currentReaderArticleId', articleId)

  if (articleId) {
    await page.goto(`/articles/${encodeURIComponent(articleId)}`)
    await expect(page.getByTestId('article-detail')).toBeVisible({ timeout: 10_000 })
  }
})

When('{word} extracts a quote {string} from the article', async function (name, content) {
  const actor = currentActor(this, name)
  await CreateReadingNote(content, 'quote').performAs(actor)
})

When('{word} writes a summary {string} for the article', async function (name, content) {
  const actor = currentActor(this, name)
  await CreateReadingNote(content, 'summary').performAs(actor)
})

When('{word} adds a note {string} to the article', async function (name, content) {
  const actor = currentActor(this, name)
  await CreateReadingNote(content, 'note').performAs(actor)
})

Then('{word} should see a quote highlighted in the article', async function (name) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightIsVisible('quote').answeredBy(actor)
})

Then('{word} should see a summary highlighted in the article', async function (name) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightIsVisible('summary').answeredBy(actor)
})

Then('{word} should see a note highlighted in the article', async function (name) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightIsVisible('note').answeredBy(actor)
})

Given('{word} has extracted the following from {string}:', async function (name, title, dataTable) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const rows = dataTable.hashes()

  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()

  const card = page.getByTestId('article-card').filter({ hasText: title }).first()
  await timeline.focusCard(card)
  const articleId = await card.getAttribute('data-article-id')
  actor.remember('currentReaderArticleId', articleId)

  if (articleId) {
    await page.goto(`/articles/${encodeURIComponent(articleId)}`)
    await expect(page.getByTestId('article-detail')).toBeVisible({ timeout: 10_000 })

    for (const row of rows) {
      await CreateReadingNote(row.content, row.type).performAs(actor)
    }
  }
})

// eslint-disable-next-line no-unused-vars -- parameter required by Cucumber pattern
When('{word} opens the article {string} again', async function (name, _unused) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const articleId = actor.recall('currentReaderArticleId')
  if (articleId) {
    await page.goto(`/articles/${encodeURIComponent(articleId)}`)
    await expect(page.getByTestId('article-detail')).toBeVisible({ timeout: 10_000 })
  }
})

When('{word} deletes the highlighted quote {string}', async function (name, content) {
  const actor = currentActor(this, name)
  await DeleteReadingNote(content).performAs(actor)
})

When('{word} starts learning focus', async function (name) {
  const actor = currentActor(this, name)
  await StartLearningFocus().performAs(actor)
})

Then('{word} should see learning focus guidance', async function (name) {
  const actor = currentActor(this, name)
  await LearningFocusGuidanceIsVisible().answeredBy(actor)
})

When('{word} hovers the reading note card {string}', async function (name, content) {
  const actor = currentActor(this, name)
  await HoverReadingNoteCard(content).performAs(actor)
})

Then('{word} should see the active reading note highlight text {string}', async function (name, content) {
  const actor = currentActor(this, name)
  await ActiveReadingNoteHighlightTextIs(content).answeredBy(actor)
})

Then('{word} should not see the highlighted quote {string}', async function (name, content) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightIsNotVisible(content).answeredBy(actor)
})

Then('{word} should see {int} highlighted quote', async function (name, count) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightCount('quote', count).answeredBy(actor)
})

Then('{word} should see {int} highlighted summary', async function (name, count) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightCount('summary', count).answeredBy(actor)
})

Then('{word} should see {int} highlighted note', async function (name, count) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightCount('note', count).answeredBy(actor)
})

Given('{word} has reading notes with the following tags:', async function (name, dataTable) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const rows = dataTable.hashes()

  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()

  const card = page.getByTestId('article-card').first()
  await timeline.focusCard(card)
  const articleId = await card.getAttribute('data-article-id')
  actor.remember('currentReaderArticleId', articleId)

  if (articleId) {
    for (const row of rows) {
      await CreateReadingNoteViaApi(row.content, 'note', row.tags).performAs(actor)
    }
  }
})

When('{word} navigates to the reading notes page filtered by tag {string}', async function (name, tag) {
  const actor = currentActor(this, name)
  await FilterReadingNotesByTag(tag).performAs(actor)
})

Then('{word} should see {int} reading note card', async function (name, count) {
  const actor = currentActor(this, name)
  await ReadingNoteCountIs(count).answeredBy(actor)
})

Then('{word} should see {int} reading note cards', async function (name, count) {
  const actor = currentActor(this, name)
  await ReadingNoteCountIs(count).answeredBy(actor)
})

When('{word} navigates to the tags index', async function (name) {
  const actor = currentActor(this, name)
  await NavigateToTagsIndex().performAs(actor)
})

Then('{word} should see a tag {string} with usage count {int}', async function (name, tag, count) {
  const actor = currentActor(this, name)
  await TagsIndexShowsTag(tag, count).answeredBy(actor)
})

Given('{word} has an episode {string} in her timeline', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await ingestKnowledgeInboxEpisode(page, this, title, { teaser: 'A fascinating podcast episode.', contentMd: KB_EPISODE_CONTENT })
})

When('{word} opens the episode {string} for reading', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()

  const card = page.getByTestId('episode-card').filter({ hasText: title }).first()
  await timeline.focusCard(card)
  const episodeId = await card.getAttribute('data-episode-id')
  actor.remember('currentReaderEpisodeId', episodeId)

  if (episodeId) {
    await page.goto(`/episodes/${encodeURIComponent(episodeId)}`)
    await expect(page.getByTestId('episode-detail')).toBeVisible({ timeout: 10_000 })
  }
})

When('{word} extracts a quote {string} from the episode', async function (name, content) {
  const actor = currentActor(this, name)
  await CreateReadingNote(content, 'quote').performAs(actor)
})

Then('{word} should see a quote highlighted in the episode', async function (name) {
  const actor = currentActor(this, name)
  await ReadingNoteHighlightIsVisible('quote').answeredBy(actor)
})

When('{word} navigates to the global reading notes page', async function (name) {
  const actor = currentActor(this, name)
  await NavigateToGlobalReadingNotes().performAs(actor)
})
