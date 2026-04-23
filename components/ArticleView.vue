<script setup lang="ts">
import { de, enUS } from 'date-fns/locale'
import { format } from 'date-fns'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { ArticleEngagementSegment } from '~/utils/article-engagement'
import {
  clampFontSizePxForSurface,
  cycleFontFamilyId,
  SURFACE_DEFAULT_FONT_PX,
  type SurfaceId,
} from '~/utils/ui-prefs'

const { t, locale } = useI18n()
const dateLocale = computed(() => (locale.value === 'de' ? de : enUS))

marked.setOptions({ gfm: true })

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
      /** When set (e.g. from DB), Nuxt Content markdown file is not required */
      rawMarkdown?: string
      tld?: string
      author?: string
    },
    required: true,
  },
  isSelected: Boolean,
})

function formatDate(dateString: string) {
  return format(new Date(dateString), 'PPP', { locale: dateLocale.value })
}

// State for toggling the detail view
const isDetailView = ref(false)

function toggleDetailView() {
  isDetailView.value = !isDetailView.value
}

// Track modal visibility. Keep it in sync with native <dialog> close paths
// (Escape, backdrop, form[method=dialog]) via onDialogClose.
const modalVisible = ref(false)

function showOriginalArticle() {
  modal.value?.showModal()
  modalVisible.value = true
}

function toggleOriginalArticle() {
  if (modal.value?.open) {
    modal.value.close()
  } else {
    showOriginalArticle()
  }
}

function onDialogClose() {
  modalVisible.value = false
}

const matchingPage = ref<{ _inline?: boolean } | Record<string, unknown> | null>(null)
const modal = ref()

/** DB-sourced markdown: parse + sanitize (client only — DOMPurify needs DOM). */
const renderedRawMarkdown = computed(() => {
  const md = props.article.rawMarkdown
  if (md == null || md.trim() === '') return ''
  if (import.meta.server) return ''
  try {
    const html = marked.parse(md) as string
    return DOMPurify.sanitize(html)
  } catch {
    return ''
  }
})

async function loadRawArticle() {
  const md = props.article.rawMarkdown
  if (md != null && md !== '') {
    matchingPage.value = { _inline: true }
    return
  }
  const id =
    props.article.id.split('/').pop()?.replace(/\.json$/u, '') ?? props.article.id
  const page = await queryCollection('rawArticles').path(`/raw/articles/${id}`).first()
  matchingPage.value =
    page == null ? null : (page as unknown as Record<string, unknown>)
}

watch(
  () => props.article.id,
  () => {
    loadRawArticle()
  },
)

const engagement = useEngagementTrackingPrefs()

let dwellStartMs: number | null = null
let dwellSegment: ArticleEngagementSegment | null = null

function resolveEngagementSegment(): ArticleEngagementSegment | null {
  if (!engagement.loaded.value || !engagement.enabled.value) return null
  if (!props.isSelected) return null
  if (import.meta.server) return null
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return null
  if (modalVisible.value) return 'body'
  if (isDetailView.value) return 'summary'
  return 'teaser'
}

function flushEngagementDwell() {
  if (dwellStartMs == null || dwellSegment == null) return
  const ms = performance.now() - dwellStartMs
  const seg = dwellSegment
  dwellStartMs = null
  dwellSegment = null
  void engagement.reportDwell(props.article.id, seg, ms)
}

function syncEngagementDwell() {
  const next = resolveEngagementSegment()
  if (next === dwellSegment && dwellStartMs != null) return
  flushEngagementDwell()
  if (next != null) {
    dwellSegment = next
    dwellStartMs = performance.now()
  }
}

function onVisibilityForEngagement() {
  syncEngagementDwell()
}

onMounted(async () => {
  loadRawArticle()
  await engagement.ensureLoaded()
  if (import.meta.client) {
    document.addEventListener('visibilitychange', onVisibilityForEngagement)
    syncEngagementDwell()
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', onVisibilityForEngagement)
  }
  flushEngagementDwell()
})

watch(
  [isDetailView, modalVisible, () => props.isSelected, engagement.enabled, engagement.loaded],
  () => {
    syncEngagementDwell()
  },
  { flush: 'post' },
)

useModalStackRegistration(modalVisible)

const { anyOpen: anyModalOpen } = useModalStack()

defineShortcuts(
  {
    'e': () => { if (props.isSelected) toggleDetailView() },
    'escape': () => { if (props.isSelected) { isDetailView.value = false } },
  },
  { when: () => !anyModalOpen.value },
)

defineShortcuts({
  'q': () => { if (props.isSelected) toggleOriginalArticle() },
})

const { prefs, update } = useUiPrefs()

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
  <div :id="article.id" class="article-container" :class="{ 'flip-back': isDetailView, 'flip-front': !isDetailView }">
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
              v-if="matchingPage"
              :href="article.link"
              target="_blank"
              class="article-back-link font-bold"
              @click.prevent="showOriginalArticle"
            >
              {{ t('article.originalArticle') }}
            </a>
            <a v-else :href="article.link" target="_blank" class="article-back-link font-bold">
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
        </div>
        <div v-if="article.category" class="mb-1 text-[var(--infl0-article-back-fg-mute)]">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </div>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-back" direction="back" @click="toggleDetailView" />
    </div>
    <dialog
      v-if="matchingPage"
      ref="modal"
      class="modal"
      @close="onDialogClose"
      @cancel="onDialogClose"
    >
      <div
        class="modal-box max-w-[100vw] w-[640px] border border-[var(--infl0-surface-reader-border)] bg-[var(--infl0-surface-reader-bg)] text-[var(--infl0-surface-reader-text)]"
      >
        <form method="dialog" class="mb-2 flex justify-end">
          <button class="btn btn-sm btn-circle btn-ghost">✕</button>
        </form>
        <div
          class="max-h-[80vh] h-full w-full min-w-0 overflow-y-auto infl0-surface-reader infl0-surface-typo-reader prose max-w-none md:p-2 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-li:marker:text-[var(--infl0-reader-prose-muted)] prose-a:text-[var(--infl0-reader-link)] prose-pre:rounded-lg prose-pre:bg-[var(--infl0-reader-code-bg)] prose-pre:text-[var(--infl0-reader-code-fg)] prose-code:text-[var(--infl0-reader-code-fg)] prose-code:bg-[var(--infl0-reader-code-bg)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
        >
          <ContentRenderer
            v-if="modalVisible && matchingPage && !('_inline' in matchingPage && matchingPage._inline)"
            :value="matchingPage"
          />
          <!-- eslint-disable vue/no-v-html -- Markdown sanitized with DOMPurify -->
          <div
            v-else-if="modalVisible && article.rawMarkdown && renderedRawMarkdown"
            class="article-markdown"
            v-html="renderedRawMarkdown"
          />
          <!-- eslint-enable vue/no-v-html -->
          <pre
            v-else-if="modalVisible && article.rawMarkdown"
            class="whitespace-pre-wrap break-words text-[1em] text-[var(--infl0-surface-reader-text)]"
            >{{ article.rawMarkdown }}</pre
          >
        </div>
        <p class="mt-3 select-none text-xs text-[var(--infl0-reader-prose-muted)]">
          {{ t('article.modalKeyboardHint') }}
        </p>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>{{ t('article.closeModal') }}</button>
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