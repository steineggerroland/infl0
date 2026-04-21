<script setup lang="ts">
import { de, enUS } from 'date-fns/locale'
import { format } from 'date-fns'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { ArticleEngagementSegment } from '~/utils/article-engagement'

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

</script>

<template>
  <div :id="article.id" class="article-container" :class="{ 'flip-back': isDetailView, 'flip-front': !isDetailView }">
    <!-- Front: Short Summary -->
    <div class="article-content rounded-xl bg-front text-gray-100 relative transition-all">
      <!-- Corner fold -->
      <CornerFold position="top-right" :tooltip="t('article.cornerFold')" @click="toggleDetailView" />

      <div class="flex flex-col items-center justify-center max-h-4/5 h-4/5 w-full p-6 text-center">
        <!-- Title -->
        <h1 class="w-full text-end text-sm smh:text-md mdh:text-lg font-bold mb-4 tracking-tighter">{{
          article.title }}
        </h1>
        <!-- Teaser -->
        <p
class="teaser flex-1 content-center text-lg smh:text-2xl mdh:text-4xl mb-6 text-gray-200 cursor-pointer"
          tabindex="0" @click="toggleDetailView">
          {{
            article.teaser }}</p>
      </div>
      <!-- Meta Information -->
      <div class="meta max-h-1/5 h-1/5 w-full text-xs smh:text-sm mdh:text-lg px-6 py-2 text-start">
        <div class="flex items-center mb-2 mt-0 text-gray-300">
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
        <div v-if="article.category" class="mb-2 text-gray-400">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </div>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-front" direction="front" @click="toggleDetailView" />
    </div>

    <!-- Back: Detailed Summary -->
    <div class="article-detail rounded-xl bg-back text-gray-200 relative shadow-inner transition-all">
      <div class="flex flex-col items-center justify-center max-h-4/5 h-4/5 w-full p-6 text-center">
        <!-- Title -->
        <h1 class="w-full text-end text-sm smh:text-md mdh:text-lg font-bold mb-4 tracking-tighter">{{
          article.title }}
        </h1>
        <!-- Detailed Summary -->
        <p class="summary flex-1 content-center text-sm smh:text-md mdh:text-lg mb-6 text-gray-300 overflow-y-auto">
          {{ article.summary_long }}
        </p>
        <p class="m-0 w-full text-end text-xs mdh:text-sm">
          <a
            v-if="matchingPage"
            :href="article.link"
            target="_blank"
            @click.prevent="showOriginalArticle"
          >
            {{ t('article.originalArticle') }}
          </a>
          <a v-else :href="article.link" target="_blank">
            {{ t('article.originalArticle') }}
          </a>
        </p>
      </div>
      <!-- Meta Information -->
      <div class="meta text-xs smh:text-sm mdh:text-lg max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
        <div class="flex items-center mb-1 mt-0 text-gray-400">
          <TypeIcon
:type="article.source_type" class="me-1 mdh:me-3 shadow-md tooltip"
            :data-tip="article.source_type" />
          {{ formatDate(article.publishedAt) }}
        </div>
        <div class="text-gray-400 mb-1 max-w-full flex flex-nowrap">
          <div class="me-1 mdh:me-3 tooltip" :data-tip="article?.tld">
            <TldIcon v-if="article?.tld" :tld="article?.tld"/>
          </div>
          <div v-if="article?.author" class="tooltip max-w-full" :data-tip="article?.author">
            <div class="text-white me-1 mdh:me-3 truncate">{{ article?.author
              }}</div>
          </div>
        </div>
        <div v-if="article.category" class="mb-1 text-gray-400">
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
      <div class="modal-box max-w-[100vw] w-[640px] bg-white text-black">
        <form method="dialog" class="mb-2 flex justify-end">
          <button class="btn btn-sm btn-circle btn-ghost">✕</button>
        </form>
        <div class="overflow-y-auto h-full max-h-[80vh] font-serif md:p-2">
          <ContentRenderer
            v-if="modalVisible && matchingPage && !('_inline' in matchingPage && matchingPage._inline)"
            :value="matchingPage"
          />
          <!-- eslint-disable vue/no-v-html -- Markdown sanitized with DOMPurify -->
          <div
            v-else-if="modalVisible && article.rawMarkdown && renderedRawMarkdown"
            class="article-markdown prose prose-neutral prose-sm sm:prose-base max-w-none text-gray-900 prose-headings:font-semibold prose-a:text-blue-700 prose-pre:rounded-lg prose-pre:bg-gray-100 prose-code:text-pink-900 prose-code:bg-pink-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
            v-html="renderedRawMarkdown"
          />
          <!-- eslint-enable vue/no-v-html -->
          <pre
            v-else-if="modalVisible && article.rawMarkdown"
            class="whitespace-pre-wrap break-words text-sm text-gray-900 font-sans"
            >{{ article.rawMarkdown }}</pre
          >
        </div>
        <p class="mt-3 text-xs text-gray-500 select-none">
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
/* Global gradient for the front */
.bg-front-gradient {
  background: linear-gradient(135deg, #1e3a8a, #0f172a);
  /* Blue gradient */
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

/* Back: Dark and immersive */
.bg-back {
  background-color: #1a202c;
  /* Dark gray slate */
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
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
}

.action-flip-back {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
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