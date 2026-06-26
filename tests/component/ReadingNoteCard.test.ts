// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { ReadingNote } from '../../generated/prisma/client'
import ReadingNoteCard from '../../components/ReadingNoteCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
}))

vi.stubGlobal('useToast', () => ({
  push: vi.fn(),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => key,
  }))
  vi.stubGlobal('useToast', () => ({
    push: vi.fn(),
  }))
})

function readingNote(overrides: Partial<ReadingNote> = {}): ReadingNote {
  return {
    id: 'note-1',
    userId: 'user-1',
    articleId: 'article-1',
    episodeId: null,
    type: 'note',
    content: 'Original thought',
    context: 'Chapter 1',
    userTags: ['ai', 'learning'],
    anchorText: 'Original source',
    anchorStartOffset: 12,
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

function mountCard(requestFetch = vi.fn()) {
  vi.stubGlobal('useRequestFetch', () => requestFetch)
  return mount(ReadingNoteCard, {
    props: {
      readingNote: readingNote(),
      showAnchor: true,
      showType: true,
    },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

describe('ReadingNoteCard', () => {
  it('updates a reading note from edit mode', async () => {
    const updated = readingNote({
      content: 'Refined thought',
      context: 'Better context',
      userTags: ['research'],
    })
    const requestFetch = vi.fn().mockResolvedValue(updated)
    const wrapper = mountCard(requestFetch)

    await wrapper.get('[data-testid="reading-note-edit"]').trigger('click')
    await wrapper.get('[data-testid="reading-note-edit-content"]').setValue(' Refined thought ')
    await wrapper.get('[data-testid="reading-note-edit-context"]').setValue(' Better context ')
    await wrapper.get('[data-testid="reading-note-edit-tags"]').setValue(' Research, research ')
    await wrapper.get('[data-testid="reading-note-edit-form"]').trigger('submit')
    await settle()

    expect(requestFetch).toHaveBeenCalledWith('/api/knowledge/reading-notes/note-1', {
      method: 'PATCH',
      credentials: 'include',
      body: {
        content: ' Refined thought ',
        context: ' Better context ',
        tags: [' Research', ' research '],
      },
    })
    expect(wrapper.emitted('updated')?.[0]).toEqual([updated])
  })

  it('opens edit mode with the e shortcut and cancels with Escape', async () => {
    const wrapper = mountCard()

    await wrapper.get('[data-testid="reading-note-card"]').trigger('keydown', { key: 'e' })
    await settle()
    expect(wrapper.find('[data-testid="reading-note-edit-form"]').exists()).toBe(true)

    await wrapper.get('[data-testid="reading-note-card"]').trigger('keydown', { key: 'Escape' })
    await settle()
    expect(wrapper.find('[data-testid="reading-note-edit-form"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Original thought')
  })
})
