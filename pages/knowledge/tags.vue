<script setup lang="ts">
definePageMeta({
  layout: 'app',
  appFooter: true,
})

const { t } = useI18n()
const requestFetch = useRequestFetch()

type TagEntry = { tag: string; count: number }

const loading = ref(true)
const error = ref<string | null>(null)
const tags = ref<TagEntry[]>([])

async function loadTags() {
  loading.value = true
  error.value = null
  try {
    tags.value = await requestFetch<TagEntry[]>('/api/knowledge/tags', {
      credentials: 'include',
    })
  } catch (e: unknown) {
    const { message } = parseFetchError(e)
    error.value = message?.trim() || t('readingNotes.errorLoad')
  } finally {
    loading.value = false
  }
}

await loadTags()
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-8">
    <h1 class="mb-2 text-xl font-semibold text-[var(--infl0-canvas-fg)]">
      {{ t('readingNotes.tagsTitle') }}
    </h1>
    <p class="mb-6 text-sm text-[var(--infl0-canvas-fg-muted)]">
      {{ t('readingNotes.tagsIntro') }}
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
        @click="loadTags"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <div
      v-else-if="tags.length === 0"
      class="py-16 text-center text-sm text-[var(--infl0-canvas-fg-muted)]"
    >
      {{ t('readingNotes.noTags') }}
    </div>

    <ul
      v-else
      class="list-none space-y-2 p-0"
    >
      <li
        v-for="(entry, idx) in tags"
        :key="entry.tag"
        :data-testid="'tag-index-row-' + entry.tag + '-' + idx"
        class="infl0-panel list-none rounded-lg border"
      >
        <NuxtLink
          :to="{ path: '/knowledge/reading-notes', query: { tag: entry.tag } }"
          class="flex items-center justify-between px-4 py-3"
        >
          <span class="text-sm font-medium text-[var(--infl0-canvas-fg)]">#{{ entry.tag }}</span>
          <span class="text-xs text-[var(--infl0-canvas-fg-muted)]">{{ Number(entry.count) }}×</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
