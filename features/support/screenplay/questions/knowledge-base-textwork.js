import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function currentArticleCard(actor) {
  const id = actor.recall('currentReaderArticleId')
  if (!id) throw new Error(`${actor.name} has no current reader article.`)
  return timeline(actor).articleCard(id)
}

function timeline(actor) {
  return BrowseTheWeb.as(actor)
}

export const CurrentReaderArticleHasNoFragmentToolbar = {
  async answeredBy(actor) {
    const toolbar = currentArticleCard(actor).locator('[data-testid="fragment-selection-toolbar"]')
    await expect(toolbar).toBeHidden()
  },
}

export const FragmentExtractionButtonsAreVisible = {
  async answeredBy(actor) {
    const card = currentArticleCard(actor)
    await expect(card.getByTestId('fragment-extract-quote')).toBeVisible()
    await expect(card.getByTestId('fragment-summarize')).toBeVisible()
    await expect(card.getByTestId('fragment-add-note')).toBeVisible()
  },
}

export function FragmentListSectionIsVisible(sectionName) {
  return {
    async answeredBy(actor) {
      const sectionTitle =sectionName === 'Quotes' ? 'Quotes' : sectionName === 'Summaries' ? 'Summaries' : 'Notes'
      const section = BrowseTheWeb.as(actor).getByRole('region').filter({ hasText: sectionTitle })
      await expect(section).toBeVisible()
    },
  }
}

export function FragmentWithContentIsVisible(content) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      await expect(page.getByTestId('knowledge-fragment-card').filter({ hasText: content })).toBeVisible()
    },
  }
}

export function FragmentWithContentIsNotVisible(content) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      await expect(page.getByTestId('knowledge-fragment-card').filter({ hasText: content })).toHaveCount(0)
    },
  }
}

export function FragmentCountInSection(sectionName, count) {
  return {
    async answeredBy(actor) {
      const sectionTitle = sectionName === 'Quotes' ? 'Quotes' : sectionName === 'Summaries' ? 'Summaries' : 'Notes'
      const section = BrowseTheWeb.as(actor).getByRole('region').filter({ hasText: sectionTitle })
      const fragments = section.getByTestId('knowledge-fragment-card')
      await expect(fragments).toHaveCount(count)
    },
  }
}

export function TagsIndexShowsTag(tag, count) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      const tagRow = page.locator('[data-testid="tag-index-row"]').filter({ hasText: tag })
      await expect(tagRow).toBeVisible()
      await expect(tagRow).toContainText(`${count}`)
    },
  }
}

export function FragmentCountIs(count) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      await expect(page.getByTestId('knowledge-fragment-card')).toHaveCount(count)
    },
  }
}
