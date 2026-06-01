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

function detailPath(item: InboxItem) {
  if (item.articleId) return `/articles/${encodeURIComponent(item.articleId)}`
  if (item.episodeId) return `/episodes/${encodeURIComponent(item.episodeId)}`
  return null
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
        class="infl0-panel group flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-[var(--infl0-reader-link)]/60 hover:bg-[color-mix(in_srgb,var(--infl0-reader-link)_5%,transparent)]"
        :class="{ 'pointer-events-none opacity-60': removing.has(item.id) }"
        data-testid="knowledge-inbox-item"
      >
        <NuxtLink
          v-if="detailPath(item)"
          :to="detailPath(item)!"
          class="min-w-0 flex-1 cursor-pointer text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--infl0-reader-link)]"
          data-testid="knowledge-inbox-entry-link"
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
        </NuxtLink>
        <div
          v-else
          class="min-w-0 flex-1 text-start"
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
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <NuxtLink
            v-if="detailPath(item)"
            :to="detailPath(item)!"
            class="btn btn-square btn-ghost btn-sm tooltip text-[var(--infl0-reader-link)] hover:bg-[color-mix(in_srgb,var(--infl0-reader-link)_14%,transparent)]"
            :data-tip="t('knowledgeInbox.openDetails')"
            :aria-label="t('knowledgeInbox.openDetailsAria', { title: item.titleSnapshot })"
            data-testid="knowledge-inbox-details"
            @click.stop
          >
            <Infl0Icon
              name="episode.external"
              size="md"
            />
          </NuxtLink>
          <button
            type="button"
            class="btn btn-square btn-ghost btn-sm tooltip shrink-0 text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)]"
            :data-tip="t('knowledgeInbox.remove')"
            :aria-label="t('knowledgeInbox.removeAria', { title: item.titleSnapshot })"
            :disabled="removing.has(item.id)"
            data-testid="knowledge-inbox-remove"
            @click.stop="removeItem(item.id)"
          >
            <span
              v-if="removing.has(item.id)"
              class="loading loading-spinner loading-xs"
              aria-hidden="true"
            />
            <svg
              v-else
              aria-hidden="true"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v11h8V9h2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z" />
            </svg>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
