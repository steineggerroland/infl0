// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AnnotatableText from '../../components/AnnotatableText.vue'
import ReadingNoteCard from '../../components/ReadingNoteCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
}))

vi.stubGlobal('useToast', () => ({
  push: vi.fn(),
}))

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
  }))
  vi.stubGlobal('useToast', () => ({
    push: vi.fn(),
  }))
})

function readingNote(overrides: Record<string, unknown>) {
  return {
    id: 'note',
    userId: 'u1',
    articleId: 'a1',
    episodeId: null,
    type: 'quote',
    content: 'note',
    context: null,
    userTags: [],
    anchorText: null,
    anchorStartOffset: null,
    contentSource: 'body',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

async function settle() {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function mountAnnotatableText(
  items: ReturnType<typeof readingNote>[] = [],
  markdown = 'Alpha beta gamma',
  requestFetch = vi.fn().mockResolvedValue({ items }),
) {
  vi.stubGlobal('useRequestFetch', () => requestFetch)

  return mount(AnnotatableText, {
    attachTo: document.body,
    props: {
      articleId: 'a1',
      markdown,
    },
    global: {
      components: { ReadingNoteCard },
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
        Teleport: true,
      },
    },
  })
}

function selectText(root: HTMLElement, text: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode
    const index = (node.textContent || '').indexOf(text)
    if (index === -1) continue
    const range = new Range()
    range.setStart(node, index)
    range.setEnd(node, index + text.length)
    range.getBoundingClientRect = () => ({
      bottom: 24,
      height: 16,
      left: 16,
      right: 96,
      top: 8,
      width: 80,
      x: 16,
      y: 8,
      toJSON: () => ({}),
    })
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
    return
  }
  throw new Error(`Text "${text}" was not found`)
}

describe('AnnotatableText', () => {
  it('creates a reading note from selected text and keeps the anchor visible', async () => {
    const requestFetch = vi.fn(async (url: string, options?: { body?: Record<string, unknown>, method?: string }) => {
      if (url === '/api/knowledge/reading-notes' && options?.method === 'POST') {
        return readingNote({
          id: 'created',
          type: options.body?.type,
          content: options.body?.content,
          context: options.body?.context,
          userTags: options.body?.tags,
          anchorText: options.body?.anchorText,
          anchorStartOffset: options.body?.anchorStartOffset,
          contentSource: options.body?.contentSource,
        })
      }
      return { items: [] }
    })
    const wrapper = mountAnnotatableText([], 'Alpha beta gamma', requestFetch)
    await settle()

    const content = wrapper.get('[data-testid="annotatable-text-content"]')
    selectText(content.element as HTMLElement, 'Alpha beta')
    await content.trigger('mouseup')
    await settle()

    await wrapper.get('[data-testid="create-reading-note-quote"]').trigger('click')
    await settle()
    await wrapper.get('[data-testid="reading-note-context"]').setValue('important concept')
    await wrapper.get('[data-testid="reading-note-tags"]').setValue('ai,safety')
    await wrapper.get('[data-testid="reading-note-submit"]').trigger('click')
    await settle()

    expect(requestFetch).toHaveBeenCalledWith('/api/knowledge/reading-notes', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        articleId: 'a1',
        type: 'quote',
        content: 'Alpha beta',
        context: 'important concept',
        tags: ['ai', 'safety'],
        anchorText: 'Alpha beta',
        anchorStartOffset: 0,
        contentSource: 'body',
      }),
    }))
    expect(wrapper.emitted('countChange')).toEqual([[0], [1]])
    expect(wrapper.get('[data-reading-note-ids="created"]').text()).toBe('Alpha beta')
  })

  it('moves keyboard users from a text selection into the editor and returns focus on cancel', async () => {
    const wrapper = mountAnnotatableText()
    await settle()

    const content = wrapper.get('[data-testid="annotatable-text-content"]')
    ;(content.element as HTMLElement).focus()
    selectText(content.element as HTMLElement, 'Alpha beta')
    await content.trigger('keyup', { key: 'ArrowRight' })
    await settle()

    const quoteAction = wrapper.get('[data-testid="create-reading-note-quote"]')
    const summaryAction = wrapper.get('[data-testid="create-reading-note-summary"]')
    expect(document.activeElement).toBe(quoteAction.element)

    await quoteAction.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(document.activeElement).toBe(summaryAction.element)

    await summaryAction.trigger('click')
    await settle()

    const editor = wrapper.get('[data-testid="reading-note-content"]')
    expect(document.activeElement).toBe(editor.element)
    expect((editor.element as HTMLTextAreaElement).value).toBe('Alpha beta')

    await wrapper.get('[data-testid="reading-note-cancel"]').trigger('click')
    await settle()

    expect(document.activeElement).toBe(content.element)
  })

  it('keeps the selection toolbar closed when Escape clears a selected text range', async () => {
    const wrapper = mountAnnotatableText()
    await settle()

    const content = wrapper.get('[data-testid="annotatable-text-content"]')
    selectText(content.element as HTMLElement, 'Alpha beta')
    await content.trigger('keyup', { key: 'ArrowRight' })
    await settle()

    expect(wrapper.find('[data-testid="create-reading-note-quote"]').exists()).toBe(true)

    await content.trigger('keydown', { key: 'Escape' })
    await content.trigger('keyup', { key: 'Escape' })
    await settle()

    expect(window.getSelection()?.rangeCount).toBe(0)
    expect(wrapper.find('[data-testid="create-reading-note-quote"]').exists()).toBe(false)
  })

  it('opens a reading-note popover from the keyboard and returns focus to the highlight', async () => {
    const wrapper = mountAnnotatableText([
      readingNote({
        id: 'highlighted',
        content: 'keyboard note',
        anchorText: 'Alpha beta',
        anchorStartOffset: 0,
      }),
    ])
    await settle()

    const highlight = wrapper.get('[data-reading-note-ids="highlighted"]')
    ;(highlight.element as HTMLElement).focus()
    await highlight.trigger('keydown', { key: 'Enter' })
    await settle()

    expect(wrapper.get('[data-testid="reading-note-popover"]').attributes('open')).toBe('')
    expect(wrapper.get('.reading-note-highlight--active').text()).toBe('Alpha beta')
    const popoverCard = wrapper.get('[data-testid="reading-note-popover"] [data-testid="reading-note-card"]')
    expect(document.activeElement).toBe(popoverCard.element)

    await popoverCard.trigger('keydown', { key: 'e' })
    await settle()
    expect(wrapper.find('[data-testid="reading-note-edit-content"]').exists()).toBe(true)

    await highlight.trigger('keydown', { key: 'Escape' })
    await settle()

    expect(wrapper.get('[data-testid="reading-note-popover"]').attributes('open')).toBeUndefined()
    expect(document.activeElement).toBe(highlight.element)
  })

  it('renders anchored reading notes as accessible text highlights', async () => {
    const wrapper = mountAnnotatableText([
      readingNote({
        id: 'highlighted',
        content: 'visible note',
        type: 'summary',
        anchorText: 'Alpha beta',
        anchorStartOffset: 0,
      }),
    ])
    await settle()

    const highlight = wrapper.get('[data-reading-note-ids="highlighted"]')
    expect(highlight.text()).toBe('Alpha beta')
    expect(highlight.attributes('role')).toBe('button')
    expect(highlight.attributes('tabindex')).toBe('0')
    expect(highlight.attributes('data-reading-note-type')).toBe('summary')
    expect(highlight.attributes('aria-label')).toContain('visible note')
  })

  it('uses anchor offsets to highlight repeated text at the intended occurrence', async () => {
    const wrapper = mountAnnotatableText([
      readingNote({
        id: 'second-occurrence',
        content: 'second target',
        anchorText: 'Repeat target',
        anchorStartOffset: 15,
      }),
    ], 'Repeat target. Repeat target.')
    await settle()

    const highlight = wrapper.get('[data-reading-note-ids="second-occurrence"]')
    expect(highlight.text()).toBe('Repeat target')
    expect(highlight.element.previousSibling?.textContent).toBe('Repeat target. ')
  })

  it('keeps the full active range visible for overlapping reading notes', async () => {
    const wrapper = mountAnnotatableText([
      readingNote({
        id: 'first',
        content: 'first note',
        anchorText: 'abcdef',
        anchorStartOffset: 0,
      }),
      readingNote({
        id: 'second',
        content: 'second note',
        anchorText: 'cdefgh',
        anchorStartOffset: 2,
      }),
    ], 'abcdefghi')

    await settle()

    const segments = wrapper.findAll('[data-reading-note-ids]')
    expect(segments.map(segment => segment.text())).toEqual(['ab', 'cdef', 'gh'])
    expect(segments.map(segment => segment.attributes('data-reading-note-ids'))).toEqual([
      'first',
      'first second',
      'second',
    ])

    const firstCard = wrapper.findAll('[data-testid="reading-note-card"]')
      .find(card => card.text().includes('first note'))
    expect(firstCard).toBeTruthy()
    await firstCard!.trigger('mouseenter')

    const activeText = wrapper.findAll('.reading-note-highlight--active')
      .map(segment => segment.text())
      .join('')
    expect(activeText).toBe('abcdef')
  })
})
