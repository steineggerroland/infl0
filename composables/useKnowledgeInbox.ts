import type { KnowledgeInboxItem } from '~/generated/prisma/client'

type InboxState = {
  items: KnowledgeInboxItem[]
  loaded: boolean
}

export function useKnowledgeInbox() {
  const inboxState = useState<InboxState>('knowledge-inbox', () => ({ items: [], loaded: false }))
  const { t } = useI18n()
  const toast = useToast()
  const requestFetch = useRequestFetch()

  async function ensureLoaded() {
    if (inboxState.value.loaded) return
    try {
      const res = await requestFetch<{ items: KnowledgeInboxItem[] }>('/api/knowledge/inbox', {
        credentials: 'include',
        query: { limit: '1000' },
      })
      inboxState.value = { items: res.items, loaded: true }
    } catch {
      inboxState.value.loaded = true
    }
  }

  const savedArticleIds = computed(() => new Set(inboxState.value.items.map((i) => i.articleId)))

  function isSaved(articleId: string): boolean {
    return savedArticleIds.value.has(articleId)
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

  return {
    ensureLoaded,
    savedArticleIds,
    isSaved,
    save,
    items: computed(() => inboxState.value.items as KnowledgeInboxItem[]),
    loaded: computed(() => inboxState.value.loaded),
  }
}
