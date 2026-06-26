<script setup lang="ts">
import type { ReadingNote } from '~/generated/prisma/client'
import { isEditableTarget } from '~/utils/editable-target'

const props = defineProps<{
  readingNote: ReadingNote
  deleting?: boolean
  showType?: boolean
  showAnchor?: boolean
  active?: boolean
}>()

const emit = defineEmits<{
  delete: [id: string]
  updated: [readingNote: ReadingNote]
  focusAnchor: [id: string]
  clearAnchor: []
}>()

const { t } = useI18n()
const toast = useToast()
const requestFetch = useRequestFetch()
const isEditing = ref(false)
const saving = ref(false)
const editContent = ref('')
const editContext = ref('')
const editTags = ref('')
const contentInput = ref<HTMLTextAreaElement | null>(null)

function resetEditFields() {
  editContent.value = props.readingNote.content
  editContext.value = props.readingNote.context ?? ''
  editTags.value = props.readingNote.userTags.join(', ')
}

function startEditing() {
  resetEditFields()
  isEditing.value = true
  nextTick(() => contentInput.value?.focus())
}

function cancelEditing() {
  resetEditFields()
  isEditing.value = false
}

async function saveReadingNote() {
  if (!editContent.value.trim()) return
  saving.value = true
  try {
    const readingNote = await requestFetch<ReadingNote>(
      `/api/knowledge/reading-notes/${encodeURIComponent(props.readingNote.id)}`,
      {
        method: 'PATCH',
        credentials: 'include',
        body: {
          content: editContent.value,
          context: editContext.value,
          tags: editTags.value.split(','),
        },
      },
    )
    isEditing.value = false
    emit('updated', readingNote)
    toast.push({ message: t('readingNotes.updateSuccess'), variant: 'success' })
  } catch {
    toast.push({ message: t('readingNotes.errorUpdate'), variant: 'error' })
  } finally {
    saving.value = false
  }
}

function deleteReadingNote() {
  cancelEditing()
  emit('delete', props.readingNote.id)
}

function onCardKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isEditing.value) {
    event.preventDefault()
    cancelEditing()
    return
  }
  if (event.key.toLowerCase() !== 'e' || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
  if (isEditing.value || isEditableTarget(event.target)) return
  event.preventDefault()
  startEditing()
}

watch(() => props.readingNote, () => {
  if (!isEditing.value) resetEditFields()
}, { immediate: true })
</script>

<template>
  <article
    class="infl0-panel group relative rounded-lg border p-3 text-sm"
    :class="{ 'ring-2 ring-[var(--infl0-reader-link)]': active }"
    tabindex="0"
    data-testid="reading-note-card"
    @mouseenter="$emit('focusAnchor', readingNote.id)"
    @mouseleave="$emit('clearAnchor')"
    @focusin="$emit('focusAnchor', readingNote.id)"
    @focusout="$emit('clearAnchor')"
    @keydown="onCardKeydown"
  >
    <div class="flex items-start justify-between gap-3">
      <div v-if="!isEditing" class="min-w-0 flex-1 space-y-1">
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
      <form
        v-else
        class="min-w-0 flex-1 space-y-2"
        data-testid="reading-note-edit-form"
        @submit.prevent="saveReadingNote"
      >
        <label class="sr-only" :for="`reading-note-edit-content-${readingNote.id}`">
          {{ t('readingNotes.contentLabel') }}
        </label>
        <textarea
          :id="`reading-note-edit-content-${readingNote.id}`"
          ref="contentInput"
          v-model="editContent"
          rows="4"
          class="textarea textarea-bordered w-full bg-[var(--infl0-panel-bg)] text-[var(--infl0-panel-text)]"
          data-testid="reading-note-edit-content"
        />
        <label class="sr-only" :for="`reading-note-edit-context-${readingNote.id}`">
          {{ t('readingNotes.contextLabel') }}
        </label>
        <input
          :id="`reading-note-edit-context-${readingNote.id}`"
          v-model="editContext"
          class="input input-bordered input-sm w-full bg-[var(--infl0-panel-bg)] text-[var(--infl0-panel-text)]"
          :placeholder="t('readingNotes.contextPlaceholder')"
          data-testid="reading-note-edit-context"
        >
        <label class="sr-only" :for="`reading-note-edit-tags-${readingNote.id}`">
          {{ t('readingNotes.tagsLabel') }}
        </label>
        <input
          :id="`reading-note-edit-tags-${readingNote.id}`"
          v-model="editTags"
          class="input input-bordered input-sm w-full bg-[var(--infl0-panel-bg)] text-[var(--infl0-panel-text)]"
          :placeholder="t('readingNotes.tagsPlaceholder')"
          data-testid="reading-note-edit-tags"
        >
        <div class="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            data-testid="reading-note-edit-cancel"
            @click="cancelEditing"
          >
            {{ t('readingNotes.cancelEdit') }}
          </button>
          <button
            type="submit"
            class="btn btn-primary btn-sm"
            :disabled="saving || !editContent.trim()"
            data-testid="reading-note-edit-save"
          >
            {{ saving ? t('common.loading') : t('readingNotes.saveEdit') }}
          </button>
        </div>
      </form>
      <button
        v-if="!isEditing"
        type="button"
        class="btn btn-square btn-ghost btn-sm shrink-0 text-[var(--infl0-reader-link)]"
        :aria-label="t('readingNotes.edit')"
        data-testid="reading-note-edit"
        @click="startEditing"
      >
        <svg aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 17.25V20h2.75L17.8 8.95 15.05 6.2 4 17.25ZM19.7 7.05a1 1 0 0 0 0-1.4L18.35 4.3a1 1 0 0 0-1.4 0l-1.05 1.05 2.75 2.75 1.05-1.05Z" />
        </svg>
      </button>
      <button
        type="button"
        class="btn btn-square btn-ghost btn-sm shrink-0 text-[var(--color-error)]"
        :aria-label="t('readingNotes.delete')"
        :disabled="deleting"
        data-testid="reading-note-delete"
        @click="deleteReadingNote"
      >
        <span v-if="deleting" class="loading loading-spinner loading-xs" aria-hidden="true" />
        <svg v-else aria-hidden="true" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v11h8V9h2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z" />
        </svg>
      </button>
    </div>
  </article>
</template>
