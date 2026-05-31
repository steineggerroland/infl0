import type { KnowledgeInboxItem } from '~/generated/prisma/client'

type InboxState = {
  items: KnowledgeInboxItem[]
  loaded: boolean
  total: number
  hasMore: boolean
}

export function useKnowledgeInbox() {
  const inboxState = useState<InboxState>('knowledge-inbox', () => ({ items: [], loaded: false, total: 0, hasMore: false }))
  const initPromise = useState<Promise<void> | null>('knowledge-inbox-init-promise', () => null)
  const { t } = useI18n()
  const toast = useToast()
  const requestFetch = useRequestFetch()

  async function ensureLoaded(options: { throwOnError?: boolean } = {}) {
    if (inboxState.value.loaded) return
    if (!initPromise.value) {
      initPromise.value = loadAll(options.throwOnError === true)
    }
    await initPromise.value
  }

  async function loadAll(throwOnError: boolean) {
    const items: KnowledgeInboxItem[] = []
    let offset = 0
    let hasMore = true
    let total = 0
    try {
      while (hasMore) {
        const res = await requestFetch<{ items: KnowledgeInboxItem[], total: number, hasMore: boolean }>('/api/knowledge/inbox', {
          credentials: 'include',
          query: { limit: '100', offset: String(offset) },
        })
        items.push(...res.items)
        total = res.total
        hasMore = res.hasMore
        offset += res.items.length
        if (res.items.length === 0) break
      }
      inboxState.value = { items, loaded: true, total, hasMore: false }
    } catch {
      inboxState.value = { ...inboxState.value, loaded: true }
      if (throwOnError) throw new Error(t('knowledgeInbox.errorLoad'))
    } finally {
      initPromise.value = null
    }
  }

  function resetLoaded() {
    inboxState.value.loaded = false
    initPromise.value = null
  }

  const savedArticleIds = computed(() => new Set(inboxState.value.items.filter((i) => i.articleId).map((i) => i.articleId!)))

  const savedEpisodeIds = computed(() => new Set(inboxState.value.items.filter((i) => i.episodeId).map((i) => i.episodeId!)))

  function isSaved(articleId: string): boolean {
    return savedArticleIds.value.has(articleId)
  }

  function isEpisodeSaved(episodeId: string): boolean {
    return savedEpisodeIds.value.has(episodeId)
  }

  async function save(articleId: string): Promise<boolean> {
    await ensureLoaded()
    if (isSaved(articleId)) return true
    try {
      const item = await requestFetch<KnowledgeInboxItem>('/api/knowledge/inbox', {
        method: 'POST',
        credentials: 'include',
        body: { articleId },
      })
      inboxState.value.items.unshift(item)
      inboxState.value.total += 1
      return true
    } catch (e: unknown) {
      const { message } = parseFetchError(e)
      toast.push({
        message: message?.trim() || t('knowledgeInbox.errorSave'),
        variant: 'error',
      })
      return false
    }
  }

  async function saveEpisode(episodeId: string): Promise<boolean> {
    await ensureLoaded()
    if (isEpisodeSaved(episodeId)) return true
    try {
      const item = await requestFetch<KnowledgeInboxItem>('/api/knowledge/inbox', {
        method: 'POST',
        credentials: 'include',
        body: { episodeId },
      })
      inboxState.value.items.unshift(item)
      inboxState.value.total += 1
      return true
    } catch (e: unknown) {
      const { message } = parseFetchError(e)
      toast.push({
        message: message?.trim() || t('knowledgeInbox.errorSave'),
        variant: 'error',
      })
      return false
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await requestFetch(`/api/knowledge/inbox/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const before = inboxState.value.items.length
      inboxState.value.items = inboxState.value.items.filter((i) => i.id !== id)
      if (inboxState.value.items.length < before) {
        inboxState.value.total = Math.max(0, inboxState.value.total - 1)
      }
      return true
    } catch (e: unknown) {
      const { message } = parseFetchError(e)
      toast.push({
        message: message?.trim() || t('knowledgeInbox.errorRemove'),
        variant: 'error',
      })
      return false
    }
  }

  return {
    ensureLoaded,
    resetLoaded,
    savedArticleIds,
    savedEpisodeIds,
    isSaved,
    isEpisodeSaved,
    save,
    saveEpisode,
    remove,
    items: computed(() => inboxState.value.items as KnowledgeInboxItem[]),
    loaded: computed(() => inboxState.value.loaded),
    total: computed(() => inboxState.value.total),
  }
}
