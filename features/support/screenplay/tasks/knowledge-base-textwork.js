import { expect } from '@playwright/test'
import { waitForNuxtAppReady } from '../../app-ready.js'
import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export function CreateReadingNote(content, type) {
  return {
    description: `Create a ${type} reading note from "${content}"`,
    async performAs(actor) {
      await createReadingNoteFromRoot(actor, content, type, '[data-testid="annotatable-text"]')
    },
  }
}

export function CreateReadingNoteInSource(content, type, source) {
  return {
    description: `Create a ${type} reading note from "${content}" in ${source}`,
    async performAs(actor) {
      await createReadingNoteFromRoot(
        actor,
        content,
        type,
        `[data-testid="annotatable-text"][data-content-source="${source}"]`,
      )
    },
  }
}

async function createReadingNoteFromRoot(actor, content, type, rootSelector) {
  const page = BrowseTheWeb.as(actor)
  const annotatableText = page.locator(rootSelector).first()
  const root = annotatableText.locator('[data-testid="annotatable-text-content"]')
  await root.waitFor({ state: 'visible', timeout: 5_000 })

  const selected = await root.evaluate((element, text) => {
    const textNodes = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let fullText = ''
    while (walker.nextNode()) {
      const node = walker.currentNode
      const nodeText = node.textContent || ''
      textNodes.push({ node, start: fullText.length, end: fullText.length + nodeText.length })
      fullText += nodeText
    }

    const start = fullText.indexOf(text)
    if (start === -1) return false
    const end = start + text.length
    const startNode = textNodes.find(entry => start >= entry.start && start <= entry.end)
    const endNode = textNodes.find(entry => end >= entry.start && end <= entry.end)
    if (!startNode || !endNode) return false

    const range = new Range()
    range.setStart(startNode.node, start - startNode.start)
    range.setEnd(endNode.node, end - endNode.start)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    return true
  }, content)
  if (!selected) throw new Error(`Text "${content}" was not found in ${rootSelector}`)

  const action = page.locator(`[data-testid="create-reading-note-${type}"]`)
  await action.waitFor({ state: 'visible', timeout: 5_000 })
  await action.click()

  const editor = annotatableText.locator('[data-testid="reading-note-content"]')
  await editor.waitFor({ state: 'visible', timeout: 5_000 })
  await annotatableText.locator('[data-testid="reading-note-submit"]').click()
  await editor.waitFor({ state: 'hidden', timeout: 5_000 })
}

export function DeleteReadingNote(content) {
  return {
    description: `Delete the reading note "${content}"`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const highlight = page.locator('[data-reading-note-id]').filter({ hasText: content }).first()
      await highlight.waitFor({ state: 'visible', timeout: 5_000 })
      await highlight.click()
      const popover = page.locator('[data-testid="reading-note-popover"]')
      await popover.waitFor({ state: 'visible', timeout: 5_000 })
      await popover.locator('[data-testid="reading-note-delete"]').click()
      await popover.waitFor({ state: 'hidden', timeout: 10_000 })
    },
  }
}

export function HoverReadingNoteCard(content) {
  return {
    description: `Hover the reading note card "${content}"`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const card = page.locator('[data-testid="reading-note-card"]').filter({ hasText: content }).first()
      await card.waitFor({ state: 'visible', timeout: 5_000 })
      await card.hover()
    },
  }
}

export function EditReadingNoteCard(content, updatedContent) {
  return {
    description: `Edit the reading note card "${content}"`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const card = page.locator('[data-testid="reading-note-card"]').filter({ hasText: content }).first()
      await card.waitFor({ state: 'visible', timeout: 5_000 })
      await card.focus()
      await page.keyboard.press('e')
      const editor = page.locator('[data-testid="reading-note-edit-content"]').first()
      if (!await editor.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await card.locator('[data-testid="reading-note-edit"]').click()
      }
      await editor.waitFor({ state: 'visible', timeout: 5_000 })
      await editor.fill(updatedContent)
      await page.locator('[data-testid="reading-note-edit-save"]').first().click()
      await expect(page.locator('[data-testid="reading-note-card"]').filter({ hasText: updatedContent }).first())
        .toBeVisible({ timeout: 10_000 })
    },
  }
}

export function StartLearningFocus() {
  return {
    description: 'Start learning focus',
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await waitForNuxtAppReady(page)
      const toggle = page.locator('[data-testid="learning-focus-toggle"]').first()
      await toggle.waitFor({ state: 'visible', timeout: 10_000 })

      if (await toggle.getAttribute('aria-pressed') !== 'true') {
        await toggle.click()
      }

      await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
      await expect(page.locator('[data-testid="learning-focus-status"]')).toBeVisible({ timeout: 10_000 })
    },
  }
}

export function NavigateToGlobalReadingNotes() {
  return {
    description: 'Navigate to the global reading notes page',
    async performAs(actor) {
      await BrowseTheWeb.as(actor).goto('/knowledge/reading-notes')
    },
  }
}

export function NavigateToTagsIndex() {
  return {
    description: 'Navigate to the reading note tags index',
    async performAs(actor) {
      await BrowseTheWeb.as(actor).goto('/knowledge/tags')
    },
  }
}

export function FilterReadingNotesByTag(tag) {
  return {
    description: `Filter reading notes by tag "${tag}"`,
    async performAs(actor) {
      await BrowseTheWeb.as(actor).goto(`/knowledge/reading-notes?tag=${encodeURIComponent(tag)}`)
    },
  }
}

export function CreateReadingNoteViaApi(content, type, tags) {
  return {
    description: `Create a ${type} reading note via API`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const articleId = actor.recall('currentReaderArticleId')
      const body = {
        articleId,
        content,
        type,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      }
      const result = await page.evaluate(async (requestBody) => {
        const response = await fetch('/api/knowledge/reading-notes', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })
        return { ok: response.ok, status: response.status, text: await response.text() }
      }, body)
      if (!result.ok) {
        throw new Error(`API create reading note failed (${result.status}): ${result.text}`)
      }
    },
  }
}
