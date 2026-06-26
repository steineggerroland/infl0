<script setup lang="ts">
import type { ReadingNote, ReadingNoteType } from '~/generated/prisma/client'
import { renderSafeMarkdown } from '~/utils/safe-markdown'

const props = withDefaults(defineProps<{
  articleId?: string
  episodeId?: string
  markdown: string
  contentSource?: string
  heading?: string
}>(), {
  contentSource: 'body',
  heading: '',
})

const emit = defineEmits<{
  countChange: [count: number]
}>()

const { t } = useI18n()
const requestFetch = useRequestFetch()
const toast = useToast()
const contentRef = ref<HTMLElement | null>(null)
const editorDialog = ref<HTMLDialogElement | null>(null)
const editorContentRef = ref<HTMLTextAreaElement | null>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const readingNotes = ref<ReadingNote[]>([])
const loaded = ref(false)
const deletingId = ref<string | null>(null)
const creating = ref(false)
const selectedReadingNote = ref<ReadingNote | null>(null)
const selectedReadingNotePosition = ref<{ top: number, left: number } | null>(null)
const activeReadingNoteId = ref<string | null>(null)
const editorReturnFocusElement = ref<HTMLElement | null>(null)
const popoverReturnFocusElement = ref<HTMLElement | null>(null)

type SelectionDraft = {
  text: string
  offset: number
  top: number
  left: number
}

type AnchoredReadingNote = {
  note: ReadingNote
  start: number
  end: number
}

const selectionDraft = ref<SelectionDraft | null>(null)
const editorType = ref<ReadingNoteType>('quote')
const editorContent = ref('')
const editorContext = ref('')
const editorTags = ref('')
const editorAnchorText = ref<string | null>(null)
const editorAnchorOffset = ref<number | null>(null)

const byType = computed(() => ({
  quote: readingNotes.value.filter(note => note.type === 'quote'),
  summary: readingNotes.value.filter(note => note.type === 'summary'),
  note: readingNotes.value.filter(note => note.type === 'note'),
}))

function endpointQuery() {
  const query = new URLSearchParams({ limit: '100', contentSource: props.contentSource })
  if (props.articleId) query.set('articleId', props.articleId)
  if (props.episodeId) query.set('episodeId', props.episodeId)
  return query
}

async function loadReadingNotes() {
  try {
    const response = await requestFetch<{ items: ReadingNote[] }>(
      `/api/knowledge/reading-notes?${endpointQuery()}`,
      { credentials: 'include' },
    )
    readingNotes.value = response.items
    emit('countChange', response.items.length)
  } catch {
    toast.push({ message: t('readingNotes.errorLoad'), variant: 'error' })
  } finally {
    loaded.value = true
  }
}

function highlightElementsFor(id: string) {
  return Array.from(contentRef.value?.querySelectorAll<HTMLElement>('[data-reading-note-ids]') ?? [])
    .filter(element => element.dataset.readingNoteIds?.split(' ').includes(id))
}

function focusAnchor(id: string) {
  activeReadingNoteId.value = id
  highlightElementsFor(id).forEach(element => element.classList.add('reading-note-highlight--active'))
}

function clearAnchorFocus() {
  activeReadingNoteId.value = null
  contentRef.value?.querySelectorAll('.reading-note-highlight--active')
    .forEach(element => element.classList.remove('reading-note-highlight--active'))
}

function textNodesWithOffsets(root: HTMLElement) {
  const result: Array<{ node: Text; start: number; end: number }> = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let offset = 0
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const length = node.textContent?.length ?? 0
    result.push({
      node,
      start: offset,
      end: offset + length,
    })
    offset += length
  }
  return result
}

function anchoredRangeFor(readingNote: ReadingNote, fullText: string): AnchoredReadingNote | null {
  if (!readingNote.anchorText) return null
  let start = readingNote.anchorStartOffset ?? -1
  if (start < 0 || fullText.slice(start, start + readingNote.anchorText.length) !== readingNote.anchorText) {
    start = fullText.indexOf(readingNote.anchorText)
  }
  if (start < 0) return null
  return {
    note: readingNote,
    start,
    end: start + readingNote.anchorText.length,
  }
}

function readingNotesForSegment(start: number, end: number, ranges: AnchoredReadingNote[]) {
  return ranges.filter(range => range.start < end && range.end > start)
}

function createHighlightSegment(text: string, notes: AnchoredReadingNote[]) {
  const highlight = document.createElement('span')
  const primary = notes[notes.length - 1]!.note
  const ids = notes.map(({ note }) => note.id)
  highlight.className = 'reading-note-highlight'
  highlight.dataset.readingNoteId = primary.id
  highlight.dataset.readingNoteIds = ids.join(' ')
  highlight.dataset.readingNoteType = primary.type
  highlight.tabIndex = 0
  highlight.setAttribute('role', 'button')
  highlight.setAttribute('aria-label', `${t('readingNotes.openReadingNote')}: ${primary.content}`)
  highlight.textContent = text
  if (ids.includes(activeReadingNoteId.value ?? '')) {
    highlight.classList.add('reading-note-highlight--active')
  }
  return highlight
}

function highlightReadingNotes(ranges: AnchoredReadingNote[]) {
  const root = contentRef.value
  if (!root || ranges.length === 0) return

  const boundaries = new Set<number>()
  ranges.forEach((range) => {
    boundaries.add(range.start)
    boundaries.add(range.end)
  })

  const textNodes = textNodesWithOffsets(root)
  for (const entry of textNodes) {
    const source = entry.node.textContent ?? ''
    if (!source) continue

    const localBoundaries = Array.from(boundaries)
      .filter(boundary => boundary > entry.start && boundary < entry.end)
      .map(boundary => boundary - entry.start)
    const points = Array.from(new Set([0, ...localBoundaries, source.length])).sort((a, b) => a - b)
    if (points.length < 2) continue

    const fragment = document.createDocumentFragment()
    for (let index = 0; index < points.length - 1; index += 1) {
      const localStart = points[index]!
      const localEnd = points[index + 1]!
      const text = source.slice(localStart, localEnd)
      if (!text) continue

      const segmentStart = entry.start + localStart
      const segmentEnd = entry.start + localEnd
      const notes = readingNotesForSegment(segmentStart, segmentEnd, ranges)
      fragment.append(notes.length > 0 ? createHighlightSegment(text, notes) : document.createTextNode(text))
    }
    entry.node.parentNode?.replaceChild(fragment, entry.node)
  }
}

function renderHighlights() {
  if (!loaded.value || !contentRef.value) return
  renderMarkdown()
  const fullText = contentRef.value.textContent ?? ''
  const ranges = readingNotes.value
    .map(note => anchoredRangeFor(note, fullText))
    .filter((range): range is AnchoredReadingNote => Boolean(range))
  highlightReadingNotes(ranges)
}

function renderMarkdown() {
  if (!contentRef.value) return
  const html = renderSafeMarkdown(props.markdown)
  contentRef.value.innerHTML = html || ''
}

function selectionOffset(range: Range, root: HTMLElement) {
  const prefix = range.cloneRange()
  prefix.selectNodeContents(root)
  prefix.setEnd(range.startContainer, range.startOffset)
  return prefix.toString().length
}

function focusElement(element: HTMLElement | null) {
  if (!element?.isConnected) return
  element.focus({ preventScroll: true })
}

function focusToolbarFirstButton() {
  const button = toolbarRef.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')
  focusElement(button ?? null)
}

function focusToolbarButton(offset: number) {
  const buttons = Array.from(toolbarRef.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
  if (!buttons.length) return
  const currentIndex = buttons.findIndex(button => button === document.activeElement)
  const nextIndex = currentIndex >= 0
    ? (currentIndex + offset + buttons.length) % buttons.length
    : 0
  focusElement(buttons[nextIndex] ?? null)
}

function updateSelectionToolbar(input: 'pointer' | 'keyboard' = 'pointer') {
  nextTick(() => {
    const selection = window.getSelection()
    const root = contentRef.value
    if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !root) {
      selectionDraft.value = null
      return
    }

    const range = selection.getRangeAt(0)
    if (!root.contains(range.commonAncestorContainer)) {
      selectionDraft.value = null
      return
    }

    const rawText = selection.toString()
    const text = rawText.trim()
    if (text.length < 2) {
      selectionDraft.value = null
      return
    }

    const leadingWhitespace = rawText.length - rawText.trimStart().length
    const rect = range.getBoundingClientRect()
    const toolbarWidth = Math.min(544, window.innerWidth - 16)
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - toolbarWidth / 2),
      Math.max(8, window.innerWidth - toolbarWidth - 8),
    )
    const top = Math.min(rect.bottom + 8, window.innerHeight - 52)
    selectionDraft.value = {
      text,
      offset: selectionOffset(range, root) + leadingWhitespace,
      top,
      left,
    }
    if (input === 'keyboard') {
      nextTick(focusToolbarFirstButton)
    }
  })
}

function openEditor(type: ReadingNoteType, selection = selectionDraft.value, returnFocusElement?: HTMLElement | null) {
  editorType.value = type
  editorReturnFocusElement.value = selection ? contentRef.value : returnFocusElement ?? contentRef.value
  if (selection) {
    editorContent.value = selection.text
    editorAnchorText.value = selection.text
    editorAnchorOffset.value = selection.offset
  } else {
    editorAnchorText.value = null
    editorAnchorOffset.value = null
  }
  selectionDraft.value = null
  editorDialog.value?.showModal()
  nextTick(() => editorContentRef.value?.focus())
}

function closeEditor() {
  editorDialog.value?.close()
}

function onEditorClose() {
  nextTick(() => focusElement(editorReturnFocusElement.value ?? contentRef.value))
}

async function createReadingNote() {
  if (!editorContent.value.trim()) return
  creating.value = true
  try {
    const body: Record<string, unknown> = {
      type: editorType.value,
      content: editorContent.value,
      context: editorContext.value,
      tags: editorTags.value.split(','),
      anchorText: editorAnchorText.value,
      anchorStartOffset: editorAnchorOffset.value,
      contentSource: props.contentSource,
    }
    if (props.articleId) body.articleId = props.articleId
    if (props.episodeId) body.episodeId = props.episodeId

    const readingNote = await requestFetch<ReadingNote>('/api/knowledge/reading-notes', {
      method: 'POST',
      credentials: 'include',
      body,
    })
    readingNotes.value = [readingNote, ...readingNotes.value]
    emit('countChange', readingNotes.value.length)
    editorContent.value = ''
    editorContext.value = ''
    editorTags.value = ''
    editorAnchorText.value = null
    editorAnchorOffset.value = null
    closeEditor()
    await nextTick()
    renderHighlights()
    toast.push({ message: t('readingNotes.createSuccess'), variant: 'success' })
  } catch {
    toast.push({ message: t('readingNotes.errorCreate'), variant: 'error' })
  } finally {
    creating.value = false
  }
}

async function deleteReadingNote(id: string) {
  deletingId.value = id
  try {
    await requestFetch(`/api/knowledge/reading-notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    readingNotes.value = readingNotes.value.filter(note => note.id !== id)
    selectedReadingNote.value = null
    selectedReadingNotePosition.value = null
    clearAnchorFocus()
    emit('countChange', readingNotes.value.length)
    await nextTick()
    renderHighlights()
  } catch {
    toast.push({ message: t('readingNotes.errorRemove'), variant: 'error' })
  } finally {
    deletingId.value = null
  }
}

function activateHighlight(target: EventTarget | null) {
  const element = target instanceof HTMLElement
    ? target.closest<HTMLElement>('[data-reading-note-ids]')
    : null
  if (!element) return
  popoverReturnFocusElement.value = element
  const readingNoteId = element.dataset.readingNoteId
  selectedReadingNote.value = readingNotes.value.find(note => note.id === readingNoteId) ?? null
  if (!selectedReadingNote.value) return

  focusAnchor(selectedReadingNote.value.id)
  const rect = element.getBoundingClientRect()
  const popoverWidth = 360
  const left = Math.min(
    Math.max(8, rect.left + rect.width / 2 - popoverWidth / 2),
    Math.max(8, window.innerWidth - popoverWidth - 8),
  )
  const top = rect.bottom + 12
  selectedReadingNotePosition.value = {
    top: Math.min(Math.max(8, top), Math.max(8, window.innerHeight - 260)),
    left,
  }
}

function closeReadingNotePopover() {
  selectedReadingNote.value = null
  selectedReadingNotePosition.value = null
  clearAnchorFocus()
  nextTick(() => focusElement(popoverReturnFocusElement.value))
}

function onContentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    window.getSelection()?.removeAllRanges()
    closeReadingNotePopover()
    selectionDraft.value = null
    return
  }
  if ((event.key === 'Enter' || event.key === ' ') && (event.target as HTMLElement).closest('[data-reading-note-ids]')) {
    event.preventDefault()
    activateHighlight(event.target)
  }
}

function onContentKeyup(event: KeyboardEvent) {
  if (event.key === 'Escape') return
  updateSelectionToolbar('keyboard')
}

function onToolbarKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    window.getSelection()?.removeAllRanges()
    selectionDraft.value = null
    nextTick(() => focusElement(contentRef.value))
    return
  }
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    focusToolbarButton(1)
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    focusToolbarButton(-1)
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (
    target.closest('.reading-note-toolbar')
    || target.closest('.reading-note-popover')
    || contentRef.value?.contains(target)
  ) return
  selectionDraft.value = null
  closeReadingNotePopover()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  window.getSelection()?.removeAllRanges()
  selectionDraft.value = null
  closeReadingNotePopover()
}

onMounted(async () => {
  renderMarkdown()
  await loadReadingNotes()
  await nextTick()
  renderHighlights()
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})

watch(() => props.markdown, async () => {
  renderMarkdown()
  await nextTick()
  renderHighlights()
})
</script>

<template>
  <section
    class="space-y-4"
    data-testid="annotatable-text"
    :data-content-source="contentSource"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--infl0-panel-border)] bg-[color-mix(in_srgb,var(--infl0-reader-link)_5%,transparent)] px-3 py-2">
      <p class="text-sm text-[var(--infl0-canvas-fg-muted)]">
        {{ t('readingNotes.selectionHint') }}
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        data-testid="reading-note-free-note"
        @click="openEditor('note', null, $event.currentTarget as HTMLElement)"
      >
        {{ t('readingNotes.actions.note') }}
      </button>
    </div>

    <div
      class="infl0-surface-reader infl0-surface-typo-reader prose max-w-none rounded-xl border border-[var(--infl0-surface-reader-border)] p-4 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-li:marker:text-[var(--infl0-reader-prose-muted)] prose-a:text-[var(--infl0-reader-link)] prose-pre:rounded-lg prose-pre:bg-[var(--infl0-reader-code-bg)] prose-pre:text-[var(--infl0-reader-code-fg)] prose-code:rounded prose-code:bg-[var(--infl0-reader-code-bg)] prose-code:px-1 prose-code:py-0.5 prose-code:text-[var(--infl0-reader-code-fg)]"
    >
      <h2 v-if="heading">{{ heading }}</h2>
      <div
        ref="contentRef"
        tabindex="0"
        role="article"
        :aria-label="t('readingNotes.textRegionLabel')"
        data-testid="annotatable-text-content"
        @click="activateHighlight($event.target)"
        @keydown="onContentKeydown"
        @mouseup="updateSelectionToolbar('pointer')"
        @keyup="onContentKeyup"
        @pointerup="updateSelectionToolbar('pointer')"
      />
    </div>

    <div v-if="loaded" class="space-y-3" data-testid="reading-notes">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-[var(--infl0-canvas-fg)]">
          {{ t('readingNotes.sectionTitle') }}
          <span class="font-normal text-[var(--infl0-canvas-fg-muted)]">({{ readingNotes.length }})</span>
        </h2>
      </div>
      <p v-if="!readingNotes.length" class="text-sm text-[var(--infl0-canvas-fg-muted)]">
        {{ t('readingNotes.emptyInline') }}
      </p>
      <details
        v-for="type in (['quote', 'summary', 'note'] as const)"
        v-else
        :key="type"
        class="infl0-panel rounded-xl border"
        :open="byType[type].length > 0"
      >
        <summary class="cursor-pointer list-none px-4 py-3 font-medium text-[var(--infl0-panel-text)]">
          {{ t(`readingNotes.sections.${type}`) }} ({{ byType[type].length }})
        </summary>
        <div class="space-y-2 border-t border-[var(--infl0-panel-border)] p-3">
          <p v-if="!byType[type].length" class="text-sm text-[var(--infl0-panel-muted)]">
            {{ t('readingNotes.emptyType') }}
          </p>
          <ReadingNoteCard
            v-for="readingNote in byType[type]"
            :key="readingNote.id"
            :reading-note="readingNote"
            :deleting="deletingId === readingNote.id"
            :show-anchor="true"
            :active="activeReadingNoteId === readingNote.id"
            @focus-anchor="focusAnchor"
            @clear-anchor="clearAnchorFocus"
            @delete="deleteReadingNote"
          />
        </div>
      </details>
    </div>

    <Teleport to="body">
      <div
        ref="toolbarRef"
        v-if="selectionDraft"
        class="reading-note-toolbar"
        role="toolbar"
        :aria-label="t('readingNotes.toolbarLabel')"
        :style="{ top: `${selectionDraft.top}px`, left: `${selectionDraft.left}px` }"
        @keydown="onToolbarKeydown"
      >
        <button type="button" data-testid="create-reading-note-quote" @click="openEditor('quote', selectionDraft, $event.currentTarget as HTMLElement)">
          {{ t('readingNotes.actions.quote') }}
        </button>
        <button type="button" data-testid="create-reading-note-summary" @click="openEditor('summary', selectionDraft, $event.currentTarget as HTMLElement)">
          {{ t('readingNotes.actions.summary') }}
        </button>
        <button type="button" data-testid="create-reading-note-note" @click="openEditor('note', selectionDraft, $event.currentTarget as HTMLElement)">
          {{ t('readingNotes.actions.note') }}
        </button>
      </div>
    </Teleport>

    <dialog
      ref="editorDialog"
      class="modal"
      :aria-labelledby="`reading-note-editor-${contentSource}`"
      :aria-describedby="editorAnchorText ? `reading-note-editor-hint-${contentSource}` : undefined"
      @close="onEditorClose"
    >
      <div class="modal-box infl0-panel max-w-xl border border-[var(--infl0-panel-border)] text-[var(--infl0-panel-text)]">
        <h2 :id="`reading-note-editor-${contentSource}`" class="text-lg font-semibold text-[var(--infl0-canvas-fg)]">
          {{ t(`readingNotes.editorTitle.${editorType}`) }}
        </h2>
        <p
          v-if="editorAnchorText"
          :id="`reading-note-editor-hint-${contentSource}`"
          class="mt-1 text-sm text-[var(--infl0-canvas-fg-muted)]"
        >
          {{ t(`readingNotes.editorHint.${editorType}`) }}
        </p>
        <div class="mt-4 space-y-3">
          <textarea
            ref="editorContentRef"
            v-model="editorContent"
            rows="5"
            class="textarea textarea-bordered w-full bg-[var(--infl0-panel-bg)] text-[var(--infl0-panel-text)]"
            :aria-label="t('readingNotes.contentLabel')"
            data-testid="reading-note-content"
          />
          <input
            v-model="editorContext"
            class="input input-bordered w-full bg-[var(--infl0-panel-bg)] text-[var(--infl0-panel-text)]"
            :aria-label="t('readingNotes.contextLabel')"
            :placeholder="t('readingNotes.contextPlaceholder')"
            data-testid="reading-note-context"
          >
          <input
            v-model="editorTags"
            class="input input-bordered w-full bg-[var(--infl0-panel-bg)] text-[var(--infl0-panel-text)]"
            :aria-label="t('readingNotes.tagsLabel')"
            :placeholder="t('readingNotes.tagsPlaceholder')"
            data-testid="reading-note-tags"
          >
        </div>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" data-testid="reading-note-cancel" @click="closeEditor">
            {{ t('common.close') }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!editorContent.trim() || creating"
            data-testid="reading-note-submit"
            @click="createReadingNote"
          >
            {{ creating ? t('common.loading') : t('readingNotes.save') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>{{ t('common.close') }}</button>
      </form>
    </dialog>

    <dialog
      :open="Boolean(selectedReadingNote)"
      class="reading-note-popover"
      data-testid="reading-note-popover"
      :aria-label="selectedReadingNote ? `${t('readingNotes.openReadingNote')}: ${selectedReadingNote.content}` : undefined"
      :style="selectedReadingNotePosition ? {
        top: `${selectedReadingNotePosition.top}px`,
        left: `${selectedReadingNotePosition.left}px`,
      } : undefined"
    >
      <ReadingNoteCard
        v-if="selectedReadingNote"
        :reading-note="selectedReadingNote"
        :deleting="deletingId === selectedReadingNote.id"
        :show-type="true"
        :show-anchor="true"
        :active="true"
        @delete="deleteReadingNote"
      />
      <button type="button" class="btn btn-ghost btn-sm mt-2" @click="closeReadingNotePopover">
        {{ t('common.close') }}
      </button>
    </dialog>
  </section>
</template>

<style scoped>
:deep(.reading-note-highlight) {
  cursor: pointer;
  border-radius: 0.2rem;
  padding: 0 0.08rem;
  outline-offset: 2px;
}

:deep(.reading-note-highlight[data-reading-note-type="quote"]) {
  background: color-mix(in srgb, #3b82f6 22%, transparent);
  border-bottom: 2px solid #3b82f6;
}

:deep(.reading-note-highlight[data-reading-note-type="summary"]) {
  background: color-mix(in srgb, #d69e00 24%, transparent);
  border-bottom: 2px solid #b77900;
}

:deep(.reading-note-highlight[data-reading-note-type="note"]) {
  background: color-mix(in srgb, #22a447 20%, transparent);
  border-bottom: 2px solid #198b39;
}

:deep(.reading-note-highlight--active) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--infl0-reader-link) 32%, transparent);
  background: color-mix(in srgb, var(--infl0-reader-link) 28%, transparent) !important;
}

.reading-note-toolbar {
  position: fixed;
  z-index: 9999;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
  width: min(34rem, calc(100vw - 1rem));
  max-width: calc(100vw - 1rem);
  border: 1px solid color-mix(in srgb, var(--infl0-panel-text) 24%, var(--infl0-panel-border));
  border-radius: 0.6rem;
  padding: 0.3rem;
  background: var(--infl0-panel-bg);
  color: var(--infl0-panel-text);
  box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.35);
}

.reading-note-toolbar button {
  border-radius: 0.35rem;
  padding: 0.35rem 0.6rem;
  color: var(--infl0-panel-text);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
}

.reading-note-toolbar button:hover,
.reading-note-toolbar button:focus-visible {
  background: color-mix(in srgb, var(--infl0-reader-link) 18%, transparent);
}

.reading-note-popover {
  position: fixed;
  z-index: 9998;
  width: min(24rem, calc(100vw - 2rem));
  border: 1px solid color-mix(in srgb, var(--infl0-panel-text) 24%, var(--infl0-panel-border));
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: var(--infl0-panel-bg);
  color: var(--infl0-panel-text);
  box-shadow: 0 0.75rem 2rem rgb(0 0 0 / 0.35);
}
</style>
