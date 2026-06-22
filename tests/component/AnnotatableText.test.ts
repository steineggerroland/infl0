// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AnnotatableText from '../../components/AnnotatableText.vue'
import ReadingNoteCard from '../../components/ReadingNoteCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
}))

vi.stubGlobal('useToast', () => ({
  push: vi.fn(),
}))

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

describe('AnnotatableText', () => {
  it('keeps the full active range visible for overlapping reading notes', async () => {
    vi.stubGlobal('useRequestFetch', () => vi.fn().mockResolvedValue({
      items: [
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
      ],
    }))

    const wrapper = mount(AnnotatableText, {
      props: {
        articleId: 'a1',
        markdown: 'abcdefghi',
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
