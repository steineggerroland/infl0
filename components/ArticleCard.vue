<script setup lang="ts">
import { de, enUS } from 'date-fns/locale'
import { format } from 'date-fns'
import SafeMarkdown from './SafeMarkdown.vue'
import type { ArticleEngagementSegment } from '~/utils/article-engagement'
import { ARTICLE_READ_VISIBILITY_MS } from '~/utils/read-state'
import {
  clampFontSizePxForSurface,
  cycleFontFamilyId,
  SURFACE_DEFAULT_FONT_PX,
  type SurfaceId,
} from '~/utils/ui-prefs'

const { t, locale } = useI18n()
const dateLocale = computed(() => (locale.value === 'de' ? de : enUS))

// Define the props for the component
const props = defineProps({
  article: {
    type: Object as () => {
      id: string
      title: string
      teaser: string
      summary_long: string
      link: string
      publishedAt: string
      category?: string[]
      source_type: string
      /** Full article body from DB (`content_md`); drives the in-app reader modal */
      rawMarkdown?: string
      readAt?: string | null
      tld?: string
      author?: string
    },
    required: true,
  },
  isSelected: Boolean,
})

const emit = defineEmits<{
  (e: 'commit'): void
}>()

function formatDate(dateString: string) {
  return format(new Date(dateString), 'PPP', { locale: dateLocale.value })
}

// State for toggling the detail view
const isDetailView = ref(false)
const readAt = ref<string | null>(props.article.readAt ?? null)
const articleIsRead = computed(() => readAt.value != null)
const readStateBusy = ref(false)
const readStatusTip = computed(() =>
  articleIsRead.value ? t('article.markUnread') : t('article.markRead'),
)

watch(
  () => props.article.readAt,
  (next) => {
    readAt.value = next ?? null
    syncReadVisibilityTimer()
  },
)

function toggleDetailView() {
  isDetailView.value = !isDetailView.value
}

// Track modal visibility. Keep it in sync with native <dialog> close paths
// (Escape, backdrop, form[method=dialog]) via onDialogClose.
const modalVisible = ref(false)
const modal = ref<HTMLDialogElement | null>(null)
const lastDialogTrigger = ref<HTMLElement | null>(null)

const safeArticleDomId = computed(
  () => props.article.id.replace(/[^A-Za-z0-9_-]+/g, '-') || 'article',
)
const dialogTitleId = computed(() => `${safeArticleDomId.value}-reader-title`)
const dialogContentId = computed(() => `${safeArticleDomId.value}-reader-content`)

function showOriginalArticle(event?: Event) {
  if (!hasReaderModal.value) return
  emit('commit')
  const trigger = event?.currentTarget
  lastDialogTrigger.value =
    trigger instanceof HTMLElement
      ? trigger
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  modal.value?.showModal()
  modalVisible.value = true
  void nextTick(() => {
    const panel = document.getElementById(dialogContentId.value)
    panel?.focus()
  })
}

function toggleOriginalArticle() {
  if (!hasReaderModal.value) return
  if (modal.value?.open) {
    modal.value.close()
  } else {
    showOriginalArticle()
  }
}

function onDialogClose() {
  modalVisible.value = false
  lastDialogTrigger.value?.focus()
  lastDialogTrigger.value = null
}

/** In-app reader modal (sanitized markdown from DB). */
const hasReaderModal = computed(
  () => props.article.rawMarkdown != null && props.article.rawMarkdown.trim() !== '',
)

watch(hasReaderModal, (ok) => {
  if (!ok && modalVisible.value) modalVisible.value = false
})

const engagement = useEngagementTrackingPrefs()
const readState = useArticleReadState()

let dwellStartMs: number | null = null
let dwellSegment: ArticleEngagementSegment | null = null
let readVisibilityTimer: ReturnType<typeof setTimeout> | null = null
let readRequestId = 0
let autoReadSuppressedForArticleId: string | null = null

function resolveEngagementSegment(): ArticleEngagementSegment | null {
  if (!engagement.loaded.value || !engagement.enabled.value) return null
  if (!props.isSelected) return null
  if (import.meta.server) return null
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return null
  if (modalVisible.value) return 'body'
  if (isDetailView.value) return 'summary'
  return 'teaser'
}

async function flushEngagementDwell() {
  if (dwellStartMs == null || dwellSegment == null) return
  const ms = performance.now() - dwellStartMs
  const seg = dwellSegment
  dwellStartMs = null
  dwellSegment = null
  await engagement.reportDwell(props.article.id, seg, ms)
}

function syncEngagementDwell() {
  const next = resolveEngagementSegment()
  if (next === dwellSegment && dwellStartMs != null) return
  void flushEngagementDwell()
  if (next != null) {
    dwellSegment = next
    dwellStartMs = performance.now()
  }
}

function onVisibilityForEngagement() {
  syncEngagementDwell()
  syncReadVisibilityTimer()
}

function clearReadVisibilityTimer() {
  if (readVisibilityTimer == null) return
  clearTimeout(readVisibilityTimer)
  readVisibilityTimer = null
}

function canAutoMarkRead(): boolean {
  if (import.meta.server) return false
  if (!props.isSelected || articleIsRead.value) return false
  if (autoReadSuppressedForArticleId === props.article.id) return false
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
  return true
}

async function setReadState(read: boolean, opts: { manual?: boolean } = {}) {
  const previous = readAt.value
  const optimisticReadAt = read ? new Date().toISOString() : null
  const requestId = ++readRequestId

  if (opts.manual && !read) {
    autoReadSuppressedForArticleId = props.article.id
  } else if (read) {
    autoReadSuppressedForArticleId = null
  }

  readAt.value = optimisticReadAt
  readStateBusy.value = true
  syncReadVisibilityTimer()

  try {
    const res = await readState.setReadState(props.article.id, read)
    if (requestId === readRequestId) {
      readAt.value = res.readAt
    }
  } catch {
    if (requestId === readRequestId) {
      readAt.value = previous
      if (opts.manual && !read) {
        autoReadSuppressedForArticleId = null
      }
    }
  } finally {
    if (requestId === readRequestId) {
      readStateBusy.value = false
      syncReadVisibilityTimer()
    }
  }
}

function syncReadVisibilityTimer() {
  const canMark = canAutoMarkRead()
  if (readVisibilityTimer != null || !canMark) {
    if (!canMark) clearReadVisibilityTimer()
    return
  }

  readVisibilityTimer = setTimeout(() => {
    readVisibilityTimer = null
    if (canAutoMarkRead()) {
      void setReadState(true)
    }
  }, ARTICLE_READ_VISIBILITY_MS)
}

function toggleReadState() {
  void setReadState(!articleIsRead.value, { manual: true })
}

onMounted(async () => {
  await engagement.ensureLoaded()
  await ensureLoaded()
  if (import.meta.client) {
    document.addEventListener('visibilitychange', onVisibilityForEngagement)
    syncEngagementDwell()
    syncReadVisibilityTimer()
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', onVisibilityForEngagement)
  }
  void flushEngagementDwell()
  clearReadVisibilityTimer()
})

watch(
  [isDetailView, modalVisible, () => props.isSelected, engagement.enabled, engagement.loaded],
  () => {
    syncEngagementDwell()
    syncReadVisibilityTimer()
  },
  { flush: 'post' },
)

watch(
  () => props.isSelected,
  async (selected) => {
    if (!selected) {
      void flushEngagementDwell()
      clearReadVisibilityTimer()
      if (autoReadSuppressedForArticleId === props.article.id) {
        autoReadSuppressedForArticleId = null
      }
      return
    }
    await engagement.ensureLoaded()
    syncEngagementDwell()
    syncReadVisibilityTimer()
  },
  { flush: 'post', immediate: true },
)

watch(
  () => props.article.id,
  () => {
    clearReadVisibilityTimer()
    autoReadSuppressedForArticleId = null
    syncReadVisibilityTimer()
  },
)

useModalStackRegistration(modalVisible)

const { anyOpen: anyModalOpen } = useModalStack()

defineShortcuts(
  {
    'e': () => { if (props.isSelected) toggleDetailView() },
    'm': () => { if (props.isSelected) toggleReadState() },
    'escape': () => { if (props.isSelected) { isDetailView.value = false } },
  },
  { when: () => !anyModalOpen.value },
)

defineShortcuts({
  'q': () => {
    if (!props.isSelected || !hasReaderModal.value) return
    toggleOriginalArticle()
  },
})

const { prefs, update } = useUiPrefs()

const { isSaved: isSavedInbox, save: saveToInboxApi, ensureLoaded } = useKnowledgeInbox()
const toast = useToast()
const inboxSaveBusy = ref(false)

const isArticleSavedInInbox = computed(() => isSavedInbox(props.article.id))

async function saveToInbox() {
  if (isSavedInbox(props.article.id)) return
  inboxSaveBusy.value = true
  try {
    const ok = await saveToInboxApi(props.article.id)
    if (ok) {
      toast.push({
        message: t('knowledgeInbox.savedToInbox'),
        variant: 'success',
        durationMs: 2000,
      })
    }
  } finally {
    inboxSaveBusy.value = false
  }
}

function activeSurfaceId(): SurfaceId {
  if (modalVisible.value) return 'reader'
  if (isDetailView.value) return 'card-back'
  return 'card-front'
}

function bumpFontSize(step: 1 | -1) {
  const s = activeSurfaceId()
  const cur = prefs.value.surfaces[s].fontSize
  const next = clampFontSizePxForSurface(cur + step, s)
  if (next == null || next === cur) return
  update({ surfaces: { [s]: { fontSize: next } } })
}

function resetFontSizeToSurfaceDefault() {
  const s = activeSurfaceId()
  const d = SURFACE_DEFAULT_FONT_PX[s]
  if (prefs.value.surfaces[s].fontSize === d) return
  update({ surfaces: { [s]: { fontSize: d } } })
}

function cycleSurfaceFont(delta: 1 | -1) {
  const s = activeSurfaceId()
  const cur = prefs.value.surfaces[s].fontFamily
  const next = cycleFontFamilyId(cur, delta)
  update({ surfaces: { [s]: { fontFamily: next } } })
}

defineShortcuts(
  {
    '+': (e) => {
      e.preventDefault()
      bumpFontSize(1)
    },
    '=': (e) => {
      e.preventDefault()
      bumpFontSize(1)
    },
    '-': (e) => {
      e.preventDefault()
      bumpFontSize(-1)
    },
    numpadadd: (e) => {
      e.preventDefault()
      bumpFontSize(1)
    },
    numpadsubtract: (e) => {
      e.preventDefault()
      bumpFontSize(-1)
    },
    '0': (e) => {
      e.preventDefault()
      resetFontSizeToSurfaceDefault()
    },
    numpad0: (e) => {
      e.preventDefault()
      resetFontSizeToSurfaceDefault()
    },
    'shift+k': (e) => {
      e.preventDefault()
      cycleSurfaceFont(-1)
    },
    'shift+l': (e) => {
      e.preventDefault()
      cycleSurfaceFont(1)
    },
  },
  { when: () => props.isSelected },
)
</script>

<template>
  <div
    :id="article.id"
    class="article-container"
    :class="{ 'flip-back': isDetailView, 'flip-front': !isDetailView, 'article-read': articleIsRead }"
    data-testid="article-card"
    :data-article-id="article.id"
    :data-reader-selected="isSelected ? 'true' : 'false'"
  >
    <!-- Front: Short Summary -->
    <div class="article-content infl0-surface-front rounded-xl bg-front relative transition-all">
      <!-- Corner fold -->
      <CornerFold position="top-right" :tooltip="t('article.cornerFold')" @click="toggleDetailView" />

      <div class="flex min-h-0 h-4/5 max-h-4/5 w-full flex-col items-stretch px-6 pt-6 pb-2 text-center">
        <div class="infl0-surface-typo-front flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <!-- Title: slightly smaller than teaser so the teaser line stays the reading anchor. -->
          <h1
            class="mb-2 w-full shrink-0 text-end text-[length:max(0.7rem,0.78em)] font-bold leading-tight tracking-tighter"
          >
            {{ article.title }}
          </h1>
          <!-- Teaser: primary line size; scrolls if the chosen px size does not fit the card. -->
          <p
            class="teaser min-h-0 min-w-0 flex-1 cursor-pointer overflow-y-auto text-start text-[1em] text-[var(--infl0-article-front-fg-dim)] [overflow-wrap:anywhere] sm:text-center"
            tabindex="0"
            @click="toggleDetailView"
          >
            {{ article.teaser }}
          </p>
        </div>
      </div>
      <!-- Meta: `infl0-article-meta-front` ties chip text to the front surface (see tailwind.css). -->
      <div class="meta infl0-article-meta-front max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
        <div class="flex items-center mb-2 mt-0 text-[var(--infl0-article-front-fg-dim)]">
          <TypeIcon :type="article.source_type" class="shadow-md tooltip" :data-tip="article.source_type" />
          <FreshnessIndicator
v-if="article.publishedAt" class="ms-1 mdh:ms-3 tooltip"
            :data-tip="formatDate(article.publishedAt)" :published-at="article.publishedAt" />
          <TldIcon v-if="article?.tld" class="ms-1 mdh:ms-3 tooltip" :data-tip="article.tld" :tld="article.tld"/>
          <span v-else class="ms-1 mdh:ms-3 h-[1em] w-[1em]"/>
          <NameIcon
v-if="article?.author" class="ms-1 mdh:ms-3 tooltip" :data-tip="article.author"
            :name="article.author"/>
          <span v-else class="ms-1 mdh:ms-3 h-[1em] w-[1em]"/>
          <button
            type="button"
            class="read-status badge badge-sm tooltip ms-auto"
            :class="{ 'read-status--read': articleIsRead }"
            :data-tip="readStatusTip"
            :aria-label="readStatusTip"
            :aria-pressed="articleIsRead ? 'true' : 'false'"
            :disabled="readStateBusy"
            data-testid="article-read-status"
            @click.stop="toggleReadState"
          >
            <span class="read-status-eye" aria-hidden="true" />
            <span class="sr-only">{{ readStatusTip }}</span>
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs ms-1 tooltip inline-flex items-center justify-center p-0.5 text-[var(--infl0-article-front-fg-dim)] hover:text-[var(--infl0-article-front-fg)]"
            :class="{ 'text-[var(--infl0-card-grad-a)] hover:text-[var(--infl0-card-grad-a)]': isSavedInbox }"
            :data-tip="isArticleSavedInInbox ? t('knowledgeInbox.savedToInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-label="isArticleSavedInInbox ? t('knowledgeInbox.savedToInbox') : t('knowledgeInbox.saveToInbox')"
            :disabled="inboxSaveBusy"
            data-testid="article-save-inbox"
            @click.stop="saveToInbox"
          >
            <svg
              v-if="isArticleSavedInInbox"

              aria-hidden="true"
              class="h-3.5 w-3.5 fill-current"
              viewBox="0 0 16 16"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <svg
              v-else
              aria-hidden="true"
              class="h-3.5 w-3.5 stroke-current fill-none"
              viewBox="0 0 16 16"
              stroke-width="1.5"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
          </button>
        </div>
        <div v-if="article.category" class="mb-2 text-[var(--infl0-article-front-fg-mute)]">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </div>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-front" direction="front" @click="toggleDetailView" />
    </div>

    <!-- Back: Detailed Summary -->
    <div class="article-detail infl0-surface-back rounded-xl bg-back relative shadow-inner transition-all text-[var(--infl0-article-back-fg)]">
      <div class="flex min-h-0 h-4/5 max-h-4/5 w-full flex-col items-stretch px-6 pt-6 pb-2 text-center">
        <div class="infl0-surface-typo-back flex min-h-0 w-full min-w-0 flex-1 flex-col text-[var(--infl0-article-back-fg)]">
          <h1
            class="mb-2 w-full shrink-0 text-end text-[length:max(0.7rem,0.78em)] font-bold leading-tight tracking-tighter text-[var(--infl0-article-back-fg)]"
          >
            {{ article.title }}
          </h1>
          <p
            class="summary min-h-0 min-w-0 flex-1 overflow-y-auto text-start text-[1em] text-[var(--infl0-article-back-fg-dim)] [overflow-wrap:anywhere] sm:text-center"
          >
            {{ article.summary_long }}
          </p>
          <p class="m-0 w-full shrink-0 pt-1 text-end text-[0.88em] text-[var(--infl0-article-back-fg-mute)]">
            <a
              v-if="hasReaderModal"
              ref="originalArticleLink"
              :href="article.link"
              target="_blank"
              rel="noopener noreferrer"
              class="article-back-link font-bold"
              @click.prevent="showOriginalArticle($event)"
            >
              {{ t('article.originalArticle') }}
            </a>
            <a
              v-else
              :href="article.link"
              target="_blank"
              rel="noopener noreferrer"
              class="article-back-link font-bold"
              @click="emit('commit')"
            >
              {{ t('article.originalArticle') }}
            </a>
          </p>
        </div>
      </div>
      <div class="meta infl0-article-meta-back max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
        <div class="flex items-center mb-1 mt-0 text-[var(--infl0-article-back-fg-mute)]">
          <TypeIcon
:type="article.source_type" class="me-1 mdh:me-3 shadow-md tooltip"
            :data-tip="article.source_type" />
          {{ formatDate(article.publishedAt) }}
        </div>
        <div class="mb-1 max-w-full flex flex-nowrap text-[var(--infl0-article-back-fg-mute)]">
          <div class="me-1 mdh:me-3 tooltip" :data-tip="article?.tld">
            <TldIcon v-if="article?.tld" :tld="article?.tld"/>
          </div>
          <div v-if="article?.author" class="tooltip max-w-full" :data-tip="article?.author">
            <div class="me-1 mdh:me-3 truncate text-[var(--infl0-article-back-fg)]">{{
              article?.author
            }}</div>
          </div>
          <button
            type="button"
            class="read-status badge badge-sm tooltip ms-auto"
            :class="{ 'read-status--read': articleIsRead }"
            :data-tip="readStatusTip"
            :aria-label="readStatusTip"
            :aria-pressed="articleIsRead ? 'true' : 'false'"
            :disabled="readStateBusy"
            data-testid="article-read-status"
            @click.stop="toggleReadState"
          >
            <span class="read-status-eye" aria-hidden="true" />
            <span class="sr-only">{{ readStatusTip }}</span>
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs ms-1 tooltip inline-flex items-center justify-center p-0.5 text-[var(--infl0-article-back-fg-dim)] hover:text-[var(--infl0-article-back-fg)]"
            :class="{ 'text-[var(--infl0-card-grad-a)] hover:text-[var(--infl0-card-grad-a)]': isSavedInbox }"
            :data-tip="isArticleSavedInInbox ? t('knowledgeInbox.savedToInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-label="isArticleSavedInInbox ? t('knowledgeInbox.savedToInbox') : t('knowledgeInbox.saveToInbox')"
            :disabled="inboxSaveBusy"
            data-testid="article-save-inbox-back"
            @click.stop="saveToInbox"
          >
            <svg
              v-if="isArticleSavedInInbox"
              aria-hidden="true"
              class="h-3.5 w-3.5 fill-current"
              viewBox="0 0 16 16"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <svg
              v-else
              aria-hidden="true"
              class="h-3.5 w-3.5 stroke-current fill-none"
              viewBox="0 0 16 16"
              stroke-width="1.5"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
          </button>
        </div>
        <div v-if="article.category" class="mb-1 text-[var(--infl0-article-back-fg-mute)]">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </div>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-back" direction="back" @click="toggleDetailView" />
    </div>
    <dialog
      v-if="hasReaderModal"
      ref="modal"
      class="modal"
      :aria-labelledby="dialogTitleId"
      @close="onDialogClose"
      @cancel="onDialogClose"
    >
      <div
        class="modal-box max-w-[100vw] w-[640px] border border-[var(--infl0-surface-reader-border)] bg-[var(--infl0-surface-reader-bg)] text-[var(--infl0-surface-reader-text)]"
      >
        <form method="dialog" class="mb-2 flex items-center justify-between">
          <button
            type="button"
            class="btn btn-ghost btn-xs tooltip inline-flex items-center gap-1.5 text-[var(--infl0-surface-reader-text)]/70 hover:text-[var(--infl0-surface-reader-text)]"
            :class="{ 'text-[var(--infl0-card-grad-a)] hover:text-[var(--infl0-card-grad-a)]': isSavedInbox }"
            :data-tip="isArticleSavedInInbox ? t('knowledgeInbox.savedToInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-label="isArticleSavedInInbox ? t('knowledgeInbox.savedToInbox') : t('knowledgeInbox.saveToInbox')"
            :disabled="inboxSaveBusy"
            @click.stop="saveToInbox"
          >
            <svg
              v-if="isArticleSavedInInbox"
              aria-hidden="true"
              class="h-4 w-4 fill-current"
              viewBox="0 0 16 16"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <svg
              v-else
              aria-hidden="true"
              class="h-4 w-4 stroke-current fill-none"
              viewBox="0 0 16 16"
              stroke-width="1.5"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <span class="text-xs">{{ isArticleSavedInInbox ? t('knowledgeInbox.savedToInbox') : t('knowledgeInbox.saveToInbox') }}</span>
          </button>
          <button
            class="btn btn-sm btn-circle btn-ghost"
            type="submit"
            :aria-label="t('article.closeModal')"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </form>

        <h2 :id="dialogTitleId" class="mb-3 text-lg font-semibold">
          {{ article.title }}
        </h2>

        <div
          :id="dialogContentId"
          tabindex="-1"
          class="max-h-[80vh] h-full w-full min-w-0 overflow-y-auto infl0-surface-reader infl0-surface-typo-reader prose max-w-none md:p-2 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-li:marker:text-[var(--infl0-reader-prose-muted)] prose-a:text-[var(--infl0-reader-link)] prose-pre:rounded-lg prose-pre:bg-[var(--infl0-reader-code-bg)] prose-pre:text-[var(--infl0-reader-code-fg)] prose-code:text-[var(--infl0-reader-code-fg)] prose-code:bg-[var(--infl0-reader-code-bg)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
        >
          <SafeMarkdown
            v-if="modalVisible && article.rawMarkdown"
            :markdown="article.rawMarkdown"
            content-class="article-markdown"
            fallback-class="whitespace-pre-wrap break-words text-[1em] text-[var(--infl0-surface-reader-text)]"
          />
        </div>
        <p class="mt-3 select-none text-xs text-[var(--infl0-reader-prose-muted)]">
          {{ t('article.modalKeyboardHint') }}
        </p>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit">{{ t('article.closeModal') }}</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.article-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.flip-back {
  animation: flip-back 0.5s cubic-bezier(0.445, 0.050, 0.550, 0.950) both;
}

.flip-front {
  animation: flip-front 0.5s cubic-bezier(0.455, 0.030, 0.515, 0.955) both;
}
</style>

<style scoped>
/* Timeline card front — gradient + text colours follow `html[data-infl0-theme]`. */
.bg-front {
  background: linear-gradient(135deg, var(--infl0-card-grad-a), var(--infl0-card-grad-b));
  color: var(--infl0-article-front-fg);
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

.bg-back {
  background-color: var(--infl0-card-back);
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

.article-back-link {
  color: var(--infl0-article-back-fg-dim);
  text-decoration: underline;
}
.article-back-link:hover {
  color: var(--infl0-article-back-fg);
}

.article-read .article-content,
.article-read .article-detail {
  filter: saturate(0.9);
}

.read-status {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.65rem;
  width: 1.65rem;
  height: 1.35rem;
  padding: 0;
  border: 2px solid currentColor;
  color: var(--infl0-article-front-fg);
  background: transparent;
  cursor: pointer;
  opacity: 1;
}

.read-status--read {
  border-color: var(--infl0-article-front-fg);
  color: var(--infl0-card-grad-a);
  background: var(--infl0-article-front-fg);
}

.read-status:disabled {
  cursor: wait;
  opacity: 0.7;
}

.read-status:not(.read-status--read) .read-status-eye::after {
  display: none;
}

.read-status-eye {
  position: relative;
  display: block;
  width: 0.9em;
  height: 0.52em;
  border: 1.5px solid currentColor;
  border-radius: 999px 999px;
  transform: rotate(-8deg);
}

.read-status-eye::after {
  content: "";
  position: absolute;
  inset: 50% auto auto 50%;
  width: 0.22em;
  height: 0.22em;
  border-radius: 999px;
  background: currentColor;
  transform: translate(-50%, -50%);
}

/* SVG Icon shadow for visibility */
TypeIcon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}

/* Back content inner shadow for depth */
.article-detail {
  box-shadow: inset 0px 8px 15px rgba(0, 0, 0, 0.2);
}

/* Base container for the flipping animation */
.article-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  perspective: 10px;
}

/* Front and back content setup */
.article-content,
.article-detail {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

/* Specific setup for the back of the card */
.article-detail {
  transform: rotateY(180deg);
}

.flip-back {
  animation: flip-back 0.5s cubic-bezier(0.445, 0.050, 0.550, 0.950) both;
}

.flip-front {
  animation: flip-front 0.5s cubic-bezier(0.455, 0.030, 0.515, 0.955) both;
}

/* ----------------------------------------------
 * Generated by Animista on 2024-12-25 13:59:16
 * Licensed under FreeBSD License.
 * See http://animista.net/license for more info. 
 * w: http://animista.net, t: @cssanimista
 * ---------------------------------------------- */

/**
 * ----------------------------------------
 * animation flip-2-hor-top-1
 * ----------------------------------------
 */
@keyframes flip-back {
  0% {
    transform: translateX(0) rotateY(0);
    transform-origin: 0% 50%;
  }

  100% {
    transform: translateX(-100%) rotateY(-180deg);
    transform-origin: 100% 50%;
  }
}

@keyframes flip-front {
  0% {
    transform: translateX(100%) rotateY(-180deg);
    transform-origin: 0% 50%;
  }

  100% {
    transform: translateX(0) rotateY(0);
    transform-origin: 100% 50%;
  }
}

.action-flip-front {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  color: var(--infl0-article-front-fg-mute);
}

.action-flip-back {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  color: var(--infl0-article-back-fg-mute);
}

@media (prefers-reduced-motion: reduce) {
  .modal,
  .modal-box,
  .modal-backdrop {
    animation: none !important;
    transition: none !important;
  }

  /* Native top layer; DaisyUI often styles `::backdrop` separately from `.modal`. */
  dialog.modal::backdrop {
    animation: none !important;
    transition: none !important;
  }

  .modal-box {
    transform: none !important;
  }

  .article-container {
    perspective: none;
    transform-style: flat;
    animation: none !important;
  }

  .article-container.flip-back,
  .article-container.flip-front {
    animation: none !important;
  }

  .article-content,
  .article-detail {
    transition: none !important;
  }

  .article-container.flip-front .article-detail {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: none;
  }

  .article-container.flip-front .article-content {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .article-container.flip-back .article-content {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .article-container.flip-back .article-detail {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: none;
  }
}
</style>
