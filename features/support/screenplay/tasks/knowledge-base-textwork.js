import { BrowseTheWeb } from '../abilities/browse-the-web.js'

export function CreateReadingNote(content, type) {
  return {
    description: `Create a ${type} reading note from "${content}"`,
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      const root = page.locator('[data-testid="annotatable-text-content"]').first()
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
      if (!selected) throw new Error(`Text "${content}" was not found in the annotatable text`)

      const action = page.locator(`[data-testid="create-reading-note-${type}"]`)
      await action.waitFor({ state: 'visible', timeout: 5_000 })
      await action.click()

      const editor = page.locator('[data-testid="reading-note-content"]')
      await editor.waitFor({ state: 'visible', timeout: 5_000 })
      await page.locator('[data-testid="reading-note-submit"]').click()
      await editor.waitFor({ state: 'hidden', timeout: 5_000 })
    },
  }
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

export function StartLearningFocus() {
  return {
    description: 'Start learning focus',
    async performAs(actor) {
      const page = BrowseTheWeb.as(actor)
      await page.locator('[data-testid="learning-focus-toggle"]').click()
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
