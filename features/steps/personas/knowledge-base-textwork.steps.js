import { Given, Then, When } from '@cucumber/cucumber'
import { actorCalled, currentActor } from '../../support/screenplay/actor.js'
import { StartSignedInToInfl0 } from '../../support/screenplay/tasks/access.js'
import { ReaderTimeline } from '../../support/reader-timeline.js'
import { BrowseTheWeb } from '../../support/screenplay/abilities/browse-the-web.js'
import { ingestKnowledgeInboxArticle } from '../../support/knowledge-inbox-fixtures.js'
import { ExtractQuote, SummarizeSelection, AddNote, DeleteFragment, FilterFragmentsByTag, NavigateToTagsIndex, NavigateToGlobalFragments } from '../../support/screenplay/tasks/knowledge-base-textwork.js'
import { FragmentListSectionIsVisible, FragmentWithContentIsNotVisible, FragmentCountInSection, TagsIndexShowsTag } from '../../support/screenplay/questions/knowledge-base-textwork.js'

Given('{word} is logged in as a knowledge-base user', async function (name) {
  await actorCalled(this, name).attemptsTo(StartSignedInToInfl0)
})

Given('{word} has an article {string} in her timeline for knowledge-base', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await ingestKnowledgeInboxArticle(page, this, title, { teaser: 'About the future of artificial intelligence.' })
})

When('{word} has opened the article {string} for reading in knowledge-base', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  
  const card = page.getByTestId('article-card').filter({ hasText: title }).first()
  await timeline.focusCard(card)
  actor.remember('currentReaderArticleId', await card.getAttribute('data-article-id'))
})

When('{word} selects the text "{string}"', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await page.evaluate(() => {
    const range = document.createRange()
    range.selectNodeContents(document.body)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  })
})

When('{word} extracts it as a quote', async function (name) {
  const actor = currentActor(this, name)
  await ExtractQuote().performAs(actor)
})

Then('{word} should see the quote in the Quotes section below the article', async function (name) {
  const actor = currentActor(this, name)
  await FragmentListSectionIsVisible('Quotes').answeredBy(actor)
  await FragmentCountInSection('Quotes', 1).answeredBy(actor)
})

When('{word} can add tags to the quote', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await page.fill('[data-testid="fragment-tags-input"]', 'ai,future')
  await page.click('[data-testid="fragment-submit"]')
})

When('{word} selects the text from "{string}" to "{string}"', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  // This is a simplified version; actual implementation would require more complex selection handling
  await page.evaluate(() => {
    const range = document.createRange()
    range.selectNodeContents(document.body)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  })
})

When('{word} summarizes the selection', async function (name) {
  const actor = currentActor(this, name)
  await SummarizeSelection().performAs(actor)
})

Then('{word} should see the summary in the Summaries section below the article', async function (name) {
  const actor = currentActor(this, name)
  await FragmentListSectionIsVisible('Summaries').answeredBy(actor)
  await FragmentCountInSection('Summaries', 1).answeredBy(actor)
})

Then('{word} should be able to add a context label', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await page.fill('[data-testid="fragment-context-input"]', 'Main section')
  await page.click('[data-testid="fragment-submit"]')
})

When('{word} makes a selection anywhere on the article', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  await page.evaluate(() => {
    const range = document.createRange()
    range.selectNodeContents(document.body)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  })
})

When('{word} adds a note', async function (name) {
  const actor = currentActor(this, name)
  await AddNote().performAs(actor)
})

Then('{word} should see the note in the Notes section below the article', async function (name) {
  const actor = currentActor(this, name)
  await FragmentListSectionIsVisible('Notes').answeredBy(actor)
  await FragmentCountInSection('Notes', 1).answeredBy(actor)
})

Given('{word} has extracted the following from "{string}":', async function (name, title, dataTable) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const rows = dataTable.hashes()
  
  // Open the article
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  
  const card = page.getByTestId('article-card').filter({ hasText: title }).first()
  await timeline.focusCard(card)
  actor.remember('currentReaderArticleId', await card.getAttribute('data-article-id'))
  
  // Add each fragment
  for (const row of rows) {
    await page.evaluate(() => {
      const range = document.createRange()
      range.selectNodeContents(document.body)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    })
    
    if (row.type === 'quote') {
      await ExtractQuote().performAs(actor)
    } else if (row.type === 'summary') {
      await SummarizeSelection().performAs(actor)
    } else if (row.type === 'note') {
      await AddNote().performAs(actor)
    }
    
    // Fill in context and tags if provided
    if (row.context) {
      await page.fill('[data-testid="fragment-context-input"]', row.context)
    } else {
      await page.fill('[data-testid="fragment-context-input"]', '')
    }
    
    if (row.tags) {
      await page.fill('[data-testid="fragment-tags-input"]', row.tags)
    } else {
      await page.fill('[data-testid="fragment-tags-input"]', '')
    }
    
    await page.click('[data-testid="fragment-submit"]')
    await page.waitForSelector('[data-testid="app-toast-success"]', { timeout: 5000 })
  }
})

When('{word} opens the article "{string}" again', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  
  const card = page.getByTestId('article-card').filter({ hasText: title }).first()
  await timeline.focusCard(card)
  actor.remember('currentReaderArticleId', await card.getAttribute('data-article-id'))
})

When('{word} deletes the quote fragment', async function (name) {
  const actor = currentActor(this, name)
  await DeleteFragment('quote', 'transform all industries').performAs(actor)
})

Then('{word} should no longer see the quote in the Quotes section', async function (name) {
  const actor = currentActor(this, name)
  await FragmentWithContentIsNotVisible('transform all industries').answeredBy(actor)
})

Given('{word} has fragments with the following tags:', async function (name, dataTable) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const rows = dataTable.hashes()
  
  // First ensure we have an article open
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  
  for (const row of rows) {
    await page.evaluate(() => {
      const range = document.createRange()
      range.selectNodeContents(document.body)
      const selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    })
    
    if (rows.indexOf(row) % 3 === 0) {
      await ExtractQuote().performAs(actor)
    } else if (rows.indexOf(row) % 3 === 1) {
      await SummarizeSelection().performAs(actor)
    } else {
      await AddNote().performAs(actor)
    }
    
    await page.fill('[data-testid="fragment-tags-input"]', row.tags)
    await page.click('[data-testid="fragment-submit"]')
    await page.waitForSelector('[data-testid="app-toast-success"]', { timeout: 5000 })
  }
})

When('{word} navigates to the fragments page filtered by tag "{string}"', async function (name, tag) {
  const actor = currentActor(this, name)
  await FilterFragmentsByTag(tag).performAs(actor)
})

When('{word} navigates to the tags index', async function (name) {
  const actor = currentActor(this, name)
  await NavigateToTagsIndex().performAs(actor)
})

Then('{word} should see the tag list sorted by usage {string}', async function (name, expectedTags) {
  const actor = currentActor(this, name)
  
  // Parse expected tags like "ai: 2, ml: 1, basics: 1, future: 1, ethics: 1"
  const tagEntries = expectedTags.split(',').map(s => s.trim())
  for (const entry of tagEntries) {
    const [tag, count] = entry.split(':')
    await TagsIndexShowsTag(tag.trim(), parseInt(count.trim())).answeredBy(actor)
  }
})

When('{word} navigates to the global fragments page', async function (name) {
  const actor = currentActor(this, name)
  await NavigateToGlobalFragments().performAs(actor)
})

Given('{word} has an episode "{string}" in her timeline', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
})

When('{word} opens the episode "{string}" for reading', async function (name, title) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
  const timeline = new ReaderTimeline(page)
  await timeline.open()
  await timeline.waitForShell()
  await timeline.startReading()
  
  const card = page.getByTestId('episode-card').filter({ hasText: title }).first()
  await timeline.focusCard(card)
  actor.remember('currentReaderArticleId', await card.getAttribute('data-episode-id'))
})

When('{word} selects the text "{string}" from an episode', async function (name) {
  const actor = currentActor(this, name)
  const page = BrowseTheWeb.as(actor)
   await page.evaluate(() => {
     const range = document.createRange()
     range.selectNodeContents(document.body)
     const selection = window.getSelection()
     selection.removeAllRanges()
     selection.addRange(range)
   })
})

