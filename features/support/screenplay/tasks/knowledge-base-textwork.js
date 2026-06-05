import { expect } from '@playwright/test'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

function getSelectionText() {
  return window.getSelection().toString()
}

export function ExtractQuote() {
  return {
    description: 'Extract the selected text as a quote',
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      
      // Get the selected text
      const selectedText = await page.evaluate(getSelectionText)
      if (!selectedText.trim()) {
        throw new Error('No text selected')
      }
      
      // Click the quote extraction button (should appear on text selection)
      const quoteButton = page.locator('[data-testid="fragment-extract-quote"]')
      await expect(quoteButton).toBeVisible({ timeout: 5000 })
      await quoteButton.click()
      
      // Fill in the context modal
      await page.fill('[data-testid="fragment-context-input"]', '')
      await page.fill('[data-testid="fragment-tags-input"]', '')
      await page.click('[data-testid="fragment-submit"]')
      
      // Wait for success toast
      await page.waitForSelector('[data-testid="app-toast-success"]', { timeout: 5000 })
    },
  }
}

export function SummarizeSelection() {
  return {
    description: 'Summarize the selected text',
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      
      const selectedText = await page.evaluate(getSelectionText)
      if (!selectedText.trim()) {
        throw new Error('No text selected')
      }
      
      const summarizeButton = page.locator('[data-testid="fragment-summarize"]')
      await expect(summarizeButton).toBeVisible({ timeout: 5000 })
      await summarizeButton.click()
      
      await page.fill('[data-testid="fragment-context-input"]', '')
      await page.fill('[data-testid="fragment-tags-input"]', '')
      await page.click('[data-testid="fragment-submit"]')
      
      await page.waitForSelector('[data-testid="app-toast-success"]', { timeout: 5000 })
    },
  }
}

export function AddNote() {
  return {
    description: 'Add a personal note',
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      
      const noteButton = page.locator('[data-testid="fragment-add-note"]')
      await expect(noteButton).toBeVisible({ timeout: 5000 })
      await noteButton.click()
      
      await page.fill('[data-testid="fragment-context-input"]', '')
      await page.fill('[data-testid="fragment-tags-input"]', '')
      await page.click('[data-testid="fragment-submit"]')
      
      await page.waitForSelector('[data-testid="app-toast-success"]', { timeout: 5000 })
    },
  }
}

export function DeleteFragment(type, content) {
  return {
    description: `Delete a ${type} fragment`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const fragmentCard = page
        .getByTestId('knowledge-fragment-card')
        .filter({ hasText: content })
        .first()
      
      await expect(fragmentCard).toBeVisible({ timeout: 5000 })
      
      const deleteButton = fragmentCard.getByTestId('fragment-delete')
      await deleteButton.click()
    },
  }
}

export function FilterFragmentsByTag(tag) {
  return {
    description: `Filter fragments by tag "${tag}"`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await page.goto(`/knowledge/fragments?tag=${encodeURIComponent(tag)}`)
    },
  }
}

export function NavigateToTagsIndex() {
  return {
    description: 'Navigate to the tags index page',
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await page.goto('/knowledge/tags')
    },
  }
}

export function NavigateToGlobalFragments() {
  return {
    description: 'Navigate to the global fragments page',
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await page.goto('/knowledge/fragments')
    },
  }
}
