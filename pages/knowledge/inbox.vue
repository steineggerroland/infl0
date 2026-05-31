<script setup lang="ts">
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

definePageMeta({
  layout: 'app',
  appFooter: true,
})

type InboxItem = {
  id: string
  contentKind: 'article' | 'episode'
  articleId: string | null
  episodeId: string | null
  capturedAt: string | Date
  titleSnapshot: string
  sourceSnapshot: string
  teaserSnapshot: string
}

const { t, locale } = useI18n()
const router = useRouter()
const inbox = useKnowledgeInbox()

const loading = ref(true)
const error = ref<string | null>(null)
const removing = ref<Set<string>>(new Set())

const dateLocale = computed(() => (locale.value === 'de' ? de : enUS))
const items = computed(() => inbox.items.value as InboxItem[])

async function loadInbox() {
  loading.value = true
  error.value = null
  try {
    inbox.resetLoaded()
    await inbox.ensureLoaded({ throwOnError: true })
  } catch (e: unknown) {
    const { message } = parseFetchError(e)
    error.value = message?.trim() || t('knowledgeInbox.errorLoad')
  } finally {
    loading.value = false
  }
}

async function removeItem(id: string) {
  removing.value.add(id)
  try {
    await inbox.remove(id)
  } finally {
    removing.value.delete(id)
  }
}

function openItem(item: InboxItem) {
  if (item.articleId) {
    void router.push(`/articles/${encodeURIComponent(item.articleId)}`)
  }
}

function capturedDateTime(value: string | Date) {
  return new Date(value).toISOString()
}

function formatCaptured(value: string | Date) {
  return format(new Date(value), 'PPP', { locale: dateLocale.value })
}

await loadInbox()
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-8">
    <h1 class="mb-2 text-xl font-semibold text-[var(--infl0-canvas-fg)]">
      {{ t('knowledgeInbox.title') }}
    </h1>
    <p class="mb-6 text-sm text-[var(--infl0-canvas-fg-muted)]">
      {{ t('knowledgeInbox.intro') }}
    </p>

    <div
      v-if="loading"
      class="flex items-center justify-center py-16"
    >
      <span class="loading loading-spinner loading-md text-[var(--infl0-canvas-fg-muted)]" />
    </div>

    <div
      v-else-if="error"
      role="alert"
      class="alert alert-error"
    >
      <span>{{ error }}</span>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="loadInbox"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <div
      v-else-if="items.length === 0"
      class="py-16 text-center text-sm text-[var(--infl0-canvas-fg-muted)]"
      data-testid="knowledge-inbox-empty"
    >
      {{ t('knowledgeInbox.empty') }}
    </div>

    <ul
      v-else
      class="space-y-3"
      data-testid="knowledge-inbox-list"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="infl0-panel group relative flex flex-col gap-1 rounded-xl border p-4 transition-colors hover:border-[var(--infl0-panel-border)]/80"
        :class="{ 'pointer-events-none opacity-60': removing.has(item.id) }"
        data-testid="knowledge-inbox-item"
      >
        <button
          v-if="item.articleId"
          type="button"
          class="w-full text-start"
          @click="openItem(item)"
        >
          <h2 class="text-base font-semibold leading-snug text-[var(--infl0-panel-text)]">
            {{ item.titleSnapshot }}
          </h2>
          <div class="mt-1 flex items-center gap-2 text-xs text-[var(--infl0-panel-muted)]">
            <span>{{ item.sourceSnapshot }}</span>
            <span aria-hidden="true">·</span>
            <time :datetime="capturedDateTime(item.capturedAt)">{{ formatCaptured(item.capturedAt) }}</time>
          </div>
          <p
            v-if="item.teaserSnapshot"
            class="mt-2 text-sm leading-relaxed text-[var(--infl0-panel-text-dim)] line-clamp-2"
          >
            {{ item.teaserSnapshot }}
          </p>
        </button>
        <div
          v-else
          class="w-full text-start"
          :aria-label="t('knowledgeInbox.episodePending')"
        >
          <h2 class="text-base font-semibold leading-snug text-[var(--infl0-panel-text)]">
            {{ item.titleSnapshot }}
          </h2>
          <div class="mt-1 flex items-center gap-2 text-xs text-[var(--infl0-panel-muted)]">
            <span>{{ item.sourceSnapshot }}</span>
            <span aria-hidden="true">·</span>
            <time :datetime="capturedDateTime(item.capturedAt)">{{ formatCaptured(item.capturedAt) }}</time>
            <span aria-hidden="true">·</span>
            <span>{{ t('knowledgeInbox.episodePending') }}</span>
          </div>
          <p
            v-if="item.teaserSnapshot"
            class="mt-2 text-sm leading-relaxed text-[var(--infl0-panel-text-dim)] line-clamp-2"
          >
            {{ item.teaserSnapshot }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs absolute end-2 top-2 text-[var(--infl0-panel-muted)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="t('knowledgeInbox.removeAria', { title: item.titleSnapshot })"
          :disabled="removing.has(item.id)"
          @click="removeItem(item.id)"
        >
          {{ t('knowledgeInbox.remove') }}
        </button>
      </li>
    </ul>
  </div>
</template>
