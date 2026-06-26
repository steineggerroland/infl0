<script setup lang="ts">
import type { ReadingNote } from '~/generated/prisma/client'

defineProps<{
  readingNote: ReadingNote
  deleting?: boolean
  showType?: boolean
  showAnchor?: boolean
  active?: boolean
}>()

defineEmits<{
  delete: [id: string]
  focusAnchor: [id: string]
  clearAnchor: []
}>()

const { t } = useI18n()
</script>

<template>
  <article
    class="infl0-panel group relative rounded-lg border p-3 text-sm"
    :class="{ 'ring-2 ring-[var(--infl0-reader-link)]': active }"
    data-testid="reading-note-card"
    @mouseenter="$emit('focusAnchor', readingNote.id)"
    @mouseleave="$emit('clearAnchor')"
    @focusin="$emit('focusAnchor', readingNote.id)"
    @focusout="$emit('clearAnchor')"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-1">
        <span
          v-if="showType"
          class="inline-block rounded border border-[var(--infl0-panel-border)] px-1.5 py-0.5 text-xs font-medium uppercase text-[var(--infl0-panel-muted)]"
        >
          {{ t(`readingNotes.types.${readingNote.type}`) }}
        </span>
        <p class="whitespace-pre-wrap text-[var(--infl0-panel-text)]">
          {{ readingNote.content }}
        </p>
        <p
          v-if="showAnchor && readingNote.anchorText && readingNote.anchorText !== readingNote.content"
          class="rounded bg-[color-mix(in_srgb,var(--infl0-reader-link)_8%,transparent)] px-2 py-1 text-xs text-[var(--infl0-panel-muted)]"
        >
          <span class="sr-only">{{ t('readingNotes.sourceTextLabel') }}: </span>
          {{ readingNote.anchorText }}
        </p>
        <p
          v-if="readingNote.context"
          class="text-xs italic text-[var(--infl0-panel-muted)]"
        >
          {{ readingNote.context }}
        </p>
        <div
          v-if="readingNote.userTags.length"
          class="flex flex-wrap gap-1 pt-1"
        >
          <NuxtLink
            v-for="tag in readingNote.userTags"
            :key="tag"
            :to="{ path: '/knowledge/reading-notes', query: { tag } }"
            class="inline-block rounded bg-[color-mix(in_srgb,var(--infl0-reader-link)_10%,transparent)] px-1.5 py-0.5 text-xs text-[var(--infl0-reader-link)] hover:underline"
          >
            #{{ tag }}
          </NuxtLink>
        </div>
      </div>
      <button
        type="button"
        class="btn btn-square btn-ghost btn-sm shrink-0 text-[var(--color-error)]"
        :aria-label="t('readingNotes.delete')"
        :disabled="deleting"
        data-testid="reading-note-delete"
        @click="$emit('delete', readingNote.id)"
      >
        <span v-if="deleting" class="loading loading-spinner loading-xs" aria-hidden="true" />
        <svg v-else aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v11h8V9h2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z" />
        </svg>
      </button>
    </div>
  </article>
</template>
