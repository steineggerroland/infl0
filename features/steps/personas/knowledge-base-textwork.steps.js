import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'
import { BrowseTheWeb } from '../../support/screenplay/abilities/browse-the-web.js'
import { PrepareArticleForKnowledgeInbox, PrepareEpisodeForKnowledgeInbox } from '../../support/screenplay/tasks/knowledge-content.js'
import { CreateReadingNote, CreateReadingNoteInSource, CreateReadingNoteViaApi, DeleteReadingNote, FilterReadingNotesByTag, HoverReadingNoteCard, NavigateToGlobalReadingNotes, NavigateToTagsIndex, StartLearningFocus } from '../../support/screenplay/tasks/knowledge-base-textwork.js'
import { ActiveReadingNoteHighlightTextIs, LearningFocusGuidanceIsVisible, ReadingNoteCountIs, ReadingNoteHighlightCount, ReadingNoteHighlightIsNotVisible, ReadingNoteHighlightIsVisible, TagsIndexShowsTag } from '../../support/screenplay/questions/knowledge-base-textwork.js'

const KB_ARTICLE_CONTENT = `# The Future of AI

Body for The Future of AI.

Artificial intelligence will transform all industries. AI has the potential to revolutionize healthcare and education. Need to explore the ethical implications further.

AI will change everything. AI has potential in healthcare and education. This is an Interesting perspective. AI will transform industries. AI is the future. Thought provoking.`

const KB_EPISODE_CONTENT = `# The Science of Sound

Body for The Science of Sound.

Sound waves propagate through air. This is a fascinating episode about the physics of sound and how we perceive audio.`

const KB_RICH_EPISODE_CONTENT = `# The Detailed Sound

Body for The Detailed Sound.

Sound changes when it meets a room.`

const KB_RICH_EPISODE_SHOWNOTES = `## Shownotes

- Mentioned tool: Tuning Fork
- Related article about listening practice`

const KB_RICH_EPISODE_TRANSCRIPT = `Welcome to The Detailed Sound.

Transcript insight about resonance appears during the second chapter.`

Given('{word} is logged in as a knowledge-base user', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0)
})

Given('{word} has an article {string} in her timeline for knowledge-base', async function (name, title) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(PrepareArticleForKnowledgeInbox(this, title, {
    teaser: 'About the future of artificial intelligence.',
    contentMd: KB_ARTICLE_CONTENT,
  }))
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
  await actor.attemptsTo(CreateReadingNote(content, 'quote'))
})

When('{word} writes a summary {string} for the article', async function (name, content) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(CreateReadingNote(content, 'summary'))
})

When('{word} adds a note {string} to the article', async function (name, content) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(CreateReadingNote(content, 'note'))
})

Then('{word} should see a quote highlighted in the article', async function (name) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightIsVisible('quote'))
})

Then('{word} should see a summary highlighted in the article', async function (name) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightIsVisible('summary'))
})

Then('{word} should see a note highlighted in the article', async function (name) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightIsVisible('note'))
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
      await actor.attemptsTo(CreateReadingNote(row.content, row.type))
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
  await actor.attemptsTo(DeleteReadingNote(content))
})

When('{word} starts learning focus', async function (name) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(StartLearningFocus())
})

Then('{word} should see learning focus guidance', async function (name) {
  const actor = currentActor(this, name)
  await actor.asksFor(LearningFocusGuidanceIsVisible())
})

When('{word} hovers the reading note card {string}', async function (name, content) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(HoverReadingNoteCard(content))
})

Then('{word} should see the active reading note highlight text {string}', async function (name, content) {
  const actor = currentActor(this, name)
  await actor.asksFor(ActiveReadingNoteHighlightTextIs(content))
})

Then('{word} should not see the highlighted quote {string}', async function (name, content) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightIsNotVisible(content))
})

Then('{word} should see {int} highlighted quote', async function (name, count) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightCount('quote', count))
})

Then('{word} should see {int} highlighted summary', async function (name, count) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightCount('summary', count))
})

Then('{word} should see {int} highlighted note', async function (name, count) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightCount('note', count))
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
      await actor.attemptsTo(CreateReadingNoteViaApi(row.content, 'note', row.tags))
    }
  }
})

When('{word} navigates to the reading notes page filtered by tag {string}', async function (name, tag) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(FilterReadingNotesByTag(tag))
})

Then('{word} should see {int} reading note card', async function (name, count) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteCountIs(count))
})

Then('{word} should see {int} reading note cards', async function (name, count) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteCountIs(count))
})

When('{word} navigates to the tags index', async function (name) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(NavigateToTagsIndex())
})

Then('{word} should see a tag {string} with usage count {int}', async function (name, tag, count) {
  const actor = currentActor(this, name)
  await actor.asksFor(TagsIndexShowsTag(tag, count))
})

Given('{word} has an episode {string} in her timeline', async function (name, title) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(PrepareEpisodeForKnowledgeInbox(this, title, {
    teaser: 'A fascinating podcast episode.',
    contentMd: KB_EPISODE_CONTENT,
  }))
})

Given('{word} has a rich episode {string} in her timeline', async function (name, title) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(PrepareEpisodeForKnowledgeInbox(this, title, {
    teaser: 'A detailed podcast episode with chapters, shownotes, and transcript.',
    contentMd: KB_RICH_EPISODE_CONTENT,
    shownotesMd: KB_RICH_EPISODE_SHOWNOTES,
    transcriptMd: KB_RICH_EPISODE_TRANSCRIPT,
    transcriptUrl: `https://example.com/bdd/kb/transcripts/${encodeURIComponent(title)}.txt`,
    transcriptType: 'text/plain',
    chapters: [
      { start_seconds: 0, title: 'Opening sound' },
      { start_seconds: 312, title: 'Resonance chapter' },
    ],
  }))
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
  await actor.attemptsTo(CreateReadingNote(content, 'quote'))
})

When('{word} extracts a quote {string} from the episode source {string}', async function (name, content, source) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(CreateReadingNoteInSource(content, 'quote', source))
})

Then('{word} should see a quote highlighted in the episode', async function (name) {
  const actor = currentActor(this, name)
  await actor.asksFor(ReadingNoteHighlightIsVisible('quote'))
})

Then('{word} should see episode chapters, shownotes, and transcript text work', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await expect(page.getByTestId('episode-chapters')).toBeVisible()
  await expect(page.getByTestId('episode-chapters')).toContainText('Resonance chapter')
  await expect(page.locator('[data-testid="annotatable-text"][data-content-source="body"]')).toBeVisible()
  await expect(page.locator('[data-testid="annotatable-text"][data-content-source="shownotes"]')).toBeVisible()
  await expect(page.locator('[data-testid="annotatable-text"][data-content-source="transcript"]')).toBeVisible()
})

When('{word} navigates to the global reading notes page', async function (name) {
  const actor = currentActor(this, name)
  await actor.attemptsTo(NavigateToGlobalReadingNotes())
})
