import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetNuxtTestState } from '../_helpers/nuxt-globals'
import { useKnowledgeInbox } from '../../composables/useKnowledgeInbox'

const requestFetch = vi.fn()

vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
vi.stubGlobal('useToast', () => ({ push: vi.fn() }))
vi.stubGlobal('useRequestFetch', () => requestFetch)
vi.stubGlobal('parseFetchError', (e: unknown) => ({ message: e instanceof Error ? e.message : '' }))

describe('useKnowledgeInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetNuxtTestState()
  })

  it('loads every page and exposes saved ids', async () => {
    requestFetch
      .mockResolvedValueOnce({
        items: [{ id: 'i1', articleId: 'a1', episodeId: null }],
        total: 2,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{ id: 'i2', articleId: null, episodeId: 'e1' }],
        total: 2,
        hasMore: false,
      })

    const inbox = useKnowledgeInbox()
    await inbox.ensureLoaded()

    expect(requestFetch).toHaveBeenCalledTimes(2)
    expect(requestFetch).toHaveBeenNthCalledWith(1, '/api/knowledge/inbox', {
      credentials: 'include',
      query: { limit: '100', offset: '0' },
    })
    expect(requestFetch).toHaveBeenNthCalledWith(2, '/api/knowledge/inbox', {
      credentials: 'include',
      query: { limit: '100', offset: '1' },
    })
    expect(inbox.items.value.map((i) => i.id)).toEqual(['i1', 'i2'])
    expect(inbox.isSaved('a1')).toBe(true)
    expect(inbox.isEpisodeSaved('e1')).toBe(true)
  })

  it('deduplicates concurrent initial loads', async () => {
    requestFetch.mockResolvedValue({
      items: [{ id: 'i1', articleId: 'a1', episodeId: null }],
      total: 1,
      hasMore: false,
    })

    const first = useKnowledgeInbox()
    const second = useKnowledgeInbox()
    await Promise.all([first.ensureLoaded(), second.ensureLoaded()])

    expect(requestFetch).toHaveBeenCalledTimes(1)
  })
})
