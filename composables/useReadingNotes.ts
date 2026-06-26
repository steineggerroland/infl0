import type { ReadingNote } from '~/generated/prisma/client'

type ReadingNoteState = {
  items: ReadingNote[]
  loadedKey: string | null
  total: number
}

export function useReadingNotes() {
  const state = useState<ReadingNoteState>('reading-notes', () => ({
    items: [],
    loadedKey: null,
    total: 0,
  }))
  const { t } = useI18n()
  const toast = useToast()
  const requestFetch = useRequestFetch()

  async function load(options: { tag?: string } = {}) {
    const key = options.tag ?? ''
    const items: ReadingNote[] = []
    let offset = 0
    let hasMore = true
    let total = 0

    while (hasMore) {
      const query: Record<string, string> = { limit: '100', offset: String(offset) }
      if (options.tag) query.tag = options.tag
      const response = await requestFetch<{ items: ReadingNote[]; total: number; hasMore: boolean }>(
        '/api/knowledge/reading-notes',
        { credentials: 'include', query },
      )
      items.push(...response.items)
      total = response.total
      hasMore = response.hasMore
      offset += response.items.length
      if (!response.items.length) break
    }

    state.value = { items, loadedKey: key, total }
  }

  async function ensureLoaded(options: { tag?: string } = {}) {
    const key = options.tag ?? ''
    if (state.value.loadedKey === key) return
    await load(options)
  }

  async function removeById(id: string) {
    try {
      await requestFetch(`/api/knowledge/reading-notes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      state.value.items = state.value.items.filter(note => note.id !== id)
      state.value.total = Math.max(0, state.value.total - 1)
      return true
    } catch {
      toast.push({ message: t('readingNotes.errorRemove'), variant: 'error' })
      return false
    }
  }

  function replaceById(readingNote: ReadingNote) {
    state.value.items = state.value.items.map(item =>
      item.id === readingNote.id ? readingNote : item,
    )
  }

  return {
    items: computed(() => state.value.items),
    total: computed(() => state.value.total),
    ensureLoaded,
    load,
    removeById,
    replaceById,
  }
}
