<script setup lang="ts">
import type { ReadingNote } from '~/generated/prisma/client'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

definePageMeta({
  layout: 'app',
  appFooter: true,
})

const { t, locale } = useI18n()
const route = useRoute()
const readingNotes = useReadingNotes()
const loading = ref(true)
const error = ref<string | null>(null)
const removing = ref<Set<string>>(new Set())
const activeTag = computed(() => typeof route.query.tag === 'string' ? route.query.tag : undefined)
const dateLocale = computed(() => locale.value === 'de' ? de : enUS)

async function loadReadingNotes() {
  loading.value = true
  error.value = null
  try {
    await readingNotes.load({ tag: activeTag.value })
  } catch (caught: unknown) {
    const { message } = parseFetchError(caught)
    error.value = message?.trim() || t('readingNotes.errorLoad')
  } finally {
    loading.value = false
  }
}

async function removeReadingNote(id: string) {
  removing.value.add(id)
  try {
    await readingNotes.removeById(id)
  } finally {
    removing.value.delete(id)
  }
}

function contentPath(readingNote: ReadingNote) {
  if (readingNote.articleId) return `/articles/${encodeURIComponent(readingNote.articleId)}`
  if (readingNote.episodeId) return `/episodes/${encodeURIComponent(readingNote.episodeId)}`
  return null
}

await loadReadingNotes()
watch(activeTag, loadReadingNotes)
</script>

<template>
  <main class="mx-auto w-full max-w-2xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-[var(--infl0-canvas-fg)]">
          {{ t('readingNotes.title') }}
        </h1>
        <p class="mt-2 text-sm text-[var(--infl0-canvas-fg-muted)]">
          {{ t('readingNotes.intro') }}
        </p>
      </div>
      <NuxtLink to="/knowledge/tags" class="btn btn-ghost btn-sm">
        {{ t('readingNotes.browseTags') }}
      </NuxtLink>
    </div>

    <div v-if="activeTag" class="mb-4">
      <span class="rounded border border-[var(--infl0-panel-border)] px-2 py-0.5 text-xs font-medium text-[var(--infl0-reader-link)]">
        #{{ activeTag }}
      </span>
      <NuxtLink to="/knowledge/reading-notes" class="ml-2 text-xs text-[var(--infl0-reader-link)] underline">
        {{ t('common.close') }}
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-md" />
    </div>
    <div v-else-if="error" role="alert" class="alert alert-error">
      <span>{{ error }}</span>
      <button type="button" class="btn btn-ghost btn-sm" @click="loadReadingNotes">
        {{ t('common.retry') }}
      </button>
    </div>
    <p v-else-if="!readingNotes.items.value.length" class="py-16 text-center text-sm text-[var(--infl0-canvas-fg-muted)]">
      {{ t('readingNotes.empty') }}
    </p>
    <ul v-else class="list-none space-y-3 p-0">
      <li v-for="readingNote in readingNotes.items.value" :key="readingNote.id" class="list-none">
        <ReadingNoteCard
          :reading-note="readingNote"
          :deleting="removing.has(readingNote.id)"
          :show-type="true"
          :show-anchor="true"
          @delete="removeReadingNote"
          @updated="readingNotes.replaceById"
        />
        <div class="mt-1 flex items-center justify-between px-2 text-xs text-[var(--infl0-canvas-fg-muted)]">
          <time :datetime="new Date(readingNote.createdAt).toISOString()">
            {{ format(new Date(readingNote.createdAt), 'PPP', { locale: dateLocale }) }}
          </time>
          <NuxtLink
            v-if="contentPath(readingNote)"
            :to="contentPath(readingNote)!"
            class="font-medium text-[var(--infl0-reader-link)]"
          >
            {{ t('readingNotes.openSource') }}
          </NuxtLink>
        </div>
      </li>
    </ul>
  </main>
</template>
