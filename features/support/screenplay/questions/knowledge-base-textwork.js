import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export function ReadingNoteHighlightIsVisible(type) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      const hl = page.locator(`[data-reading-note-type="${type}"]`)
      await expect(hl.first()).toBeVisible()
    },
  }
}

export function ReadingNoteHighlightCount(type, count) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      const hl = page.locator(`[data-reading-note-type="${type}"]`)
      await expect(hl).toHaveCount(count)
    },
  }
}

export function ReadingNoteHighlightIsNotVisible(content) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      const hl = page.locator('[data-reading-note-id]').filter({ hasText: content })
      await expect(hl).toHaveCount(0, { timeout: 10_000 })
    },
  }
}

export function ActiveReadingNoteHighlightTextIs(text) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      await expect.poll(async () => {
        return page.locator('.reading-note-highlight--active').evaluateAll(elements =>
          elements.map(element => element.textContent || '').join(''),
        )
      }).toBe(text)
    },
  }
}

export function LearningFocusGuidanceIsVisible() {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      await expect(page.locator('[data-testid="learning-focus-status"]')).toBeVisible()
    },
  }
}

export function ReadingNoteCountIs(count) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      const cards = page.locator('[data-testid="reading-note-card"]')
      await expect(cards).toHaveCount(count)
    },
  }
}

export function ReadingNoteCardIsVisible(content) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      const card = page.locator('[data-testid="reading-note-card"]').filter({ hasText: content }).first()
      await expect(card).toBeVisible()
    },
  }
}

export function TagsIndexShowsTag(tag, count) {
  return {
    async answeredBy(actor) {
      const page = BrowseTheWeb.as(actor)
      const tagEntry = page.locator(`[data-testid^="tag-index-row-${tag}-"]`)
      await expect(tagEntry).toBeVisible()
      await expect(tagEntry).toContainText(`${count}`)
    },
  }
}
