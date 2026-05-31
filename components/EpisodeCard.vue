<script setup lang="ts">
import { de, enUS } from 'date-fns/locale'
import { format } from 'date-fns'
import SafeMarkdown from './SafeMarkdown.vue'
import type { InflowEpisodeChapter } from '~/utils/inflow-episode'
import { formatEpisodeDuration } from '~/utils/inflow-episode'
import {
  chapterJumpHref,
  formatChapterTimestamp,
  isLikelyPlayableAudioUrl,
} from '~/utils/episode-playback'
import { ARTICLE_READ_VISIBILITY_MS } from '~/utils/read-state'
import {
  clampFontSizePxForSurface,
  cycleFontFamilyId,
  SURFACE_DEFAULT_FONT_PX,
  type SurfaceId,
} from '~/utils/ui-prefs'

export type EpisodeCardModel = {
  id: string
  title: string
  teaser: string
  summary_long: string
  link: string
  publishedAt: string
  source_type: string
  tld?: string
  author?: string
  category?: string[]
  rawMarkdown?: string
  readAt?: string | null
  shownotes_md?: string
  media_url?: string
  media_type?: string
  duration_seconds?: number
  episode_number?: number | null
  season_number?: number | null
  episode_type?: string
  explicit?: boolean
  subtitle?: string
  image_url?: string
  chapters?: InflowEpisodeChapter[]
  crawl_key?: string
  transcript_md?: string
  transcript_url?: string
}

const props = defineProps<{
  episode: EpisodeCardModel
  isSelected: boolean
  /** Subscription display title for this episode’s crawl key. */
  podcastTitle?: string | null
  /** Subscribed feed page URL (podcast home). */
  feedUrl?: string | null
}>()

const emit = defineEmits<{
  (e: 'commit'): void
}>()

const { t, locale } = useI18n()
const dateLocale = computed(() => (locale.value === 'de' ? de : enUS))

const isDetailView = ref(false)
const readAt = ref<string | null>(props.episode.readAt ?? null)
const episodeIsRead = computed(() => readAt.value != null)
const readStateBusy = ref(false)
const readStatusTip = computed(() =>
  episodeIsRead.value ? t('article.markUnread') : t('article.markRead'),
)

watch(
  () => props.episode.readAt,
  (next) => {
    readAt.value = next ?? null
    syncReadVisibilityTimer()
  },
)

function formatDate(dateString: string) {
  return format(new Date(dateString), 'PPP', { locale: dateLocale.value })
}

function toggleDetailView() {
  isDetailView.value = !isDetailView.value
}

const durationLabel = computed(() =>
  formatEpisodeDuration(props.episode.duration_seconds),
)

const seasonEpisodeLabel = computed(() => {
  const s = props.episode.season_number
  const e = props.episode.episode_number
  if (s != null && e != null) return t('episode.seasonEpisode', { season: s, episode: e })
  if (e != null) return t('episode.episodeNumber', { episode: e })
  return null
})

const seasonEpisodeTooltip = computed(() => {
  const s = props.episode.season_number
  const e = props.episode.episode_number
  if (s != null && e != null) {
    return t('episode.seasonEpisodeTooltip', { season: s, episode: e })
  }
  if (e != null) return t('episode.episodeNumberTooltip', { episode: e })
  return null
})

const durationTooltip = computed(() =>
  durationLabel.value ? t('episode.durationTooltip', { duration: durationLabel.value }) : null,
)

const episodeTypeKind = computed(() => {
  const k = props.episode.episode_type?.trim().toLowerCase()
  if (k === 'trailer' || k === 'bonus') return k
  return null
})

const episodeTypeTooltip = computed(() => {
  const k = episodeTypeKind.value
  if (k === 'trailer') return t('episode.typeTooltip.trailer')
  if (k === 'bonus') return t('episode.typeTooltip.bonus')
  return null
})

const podcastLabel = computed(
  () => props.podcastTitle?.trim() || props.episode.author?.trim() || props.episode.tld || '',
)

const playbackUrl = computed(() =>
  isLikelyPlayableAudioUrl(props.episode.media_url, props.episode.media_type)
    ? props.episode.media_url!.trim()
    : null,
)

const hasDetailsModal = computed(
  () =>
    (props.episode.rawMarkdown != null && props.episode.rawMarkdown.trim() !== '') ||
    (props.episode.transcript_md != null && props.episode.transcript_md.trim() !== ''),
)

const modalVisible = ref(false)
const detailsTab = ref<'content' | 'transcript'>('content')
const modal = ref<HTMLDialogElement | null>(null)
const detailsLink = ref<HTMLAnchorElement | null>(null)
const contentTabButton = ref<HTMLButtonElement | null>(null)
const transcriptTabButton = ref<HTMLButtonElement | null>(null)
const lastDialogTrigger = ref<HTMLElement | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)

const safeEpisodeDomId = computed(
  () => props.episode.id.replace(/[^A-Za-z0-9_-]+/g, '-') || 'episode',
)
const dialogTitleId = computed(() => `${safeEpisodeDomId.value}-details-title`)
const tablistLabelId = computed(() => `${safeEpisodeDomId.value}-details-tabs-label`)
const contentTabId = computed(() => `${safeEpisodeDomId.value}-tab-content`)
const transcriptTabId = computed(() => `${safeEpisodeDomId.value}-tab-transcript`)
const contentPanelId = computed(() => `${safeEpisodeDomId.value}-panel-content`)
const transcriptPanelId = computed(() => `${safeEpisodeDomId.value}-panel-transcript`)

const availableDetailTabs = computed<Array<'content' | 'transcript'>>(() => {
  const tabs: Array<'content' | 'transcript'> = []
  if (props.episode.rawMarkdown?.trim()) tabs.push('content')
  if (props.episode.transcript_md?.trim()) tabs.push('transcript')
  return tabs
})

function selectDetailsTab(tab: 'content' | 'transcript') {
  if (!availableDetailTabs.value.includes(tab)) return
  detailsTab.value = tab
}

async function focusSelectedTab() {
  await nextTick()
  const button =
    detailsTab.value === 'content' ? contentTabButton.value : transcriptTabButton.value
  button?.focus()
}

function showDetails(event?: Event) {
  if (!hasDetailsModal.value) return
  emit('commit')
  const trigger = event?.currentTarget
  lastDialogTrigger.value =
    trigger instanceof HTMLElement
      ? trigger
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  detailsTab.value = props.episode.rawMarkdown?.trim() ? 'content' : 'transcript'
  modal.value?.showModal()
  modalVisible.value = true
  void focusSelectedTab()
}

function toggleDetails() {
  if (!hasDetailsModal.value) return
  if (modal.value?.open) modal.value.close()
  else showDetails()
}

function onDialogClose() {
  modalVisible.value = false
  audioEl.value?.pause()
  lastDialogTrigger.value?.focus()
  lastDialogTrigger.value = null
}

function onDetailsTabKeydown(event: KeyboardEvent) {
  const tabs = availableDetailTabs.value
  if (tabs.length <= 1) return
  const currentIndex = tabs.indexOf(detailsTab.value)
  if (currentIndex < 0) return

  let nextIndex: number | null = null
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIndex = (currentIndex + 1) % tabs.length
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
  }
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = tabs.length - 1

  const nextTab = nextIndex == null ? null : tabs[nextIndex]
  if (nextTab == null) return
  event.preventDefault()
  detailsTab.value = nextTab
  void focusSelectedTab()
}

function playInBrowser(fromSeconds = 0) {
  if (!playbackUrl.value || !audioEl.value) return
  audioEl.value.src = playbackUrl.value
  audioEl.value.currentTime = fromSeconds
  void audioEl.value.play()
}

function onChapterClick(chapter: InflowEpisodeChapter) {
  if (playbackUrl.value) {
    playInBrowser(chapter.start_seconds)
    return
  }
  const href = chapterJumpHref(chapter, props.episode.link, props.episode.media_url)
  if (import.meta.client) window.open(href, '_blank', 'noopener,noreferrer')
}

const readState = useArticleReadState()
let readVisibilityTimer: ReturnType<typeof setTimeout> | null = null
let readRequestId = 0
let autoReadSuppressedForEpisodeId: string | null = null

function canAutoMarkRead(): boolean {
  if (import.meta.server) return false
  if (!props.isSelected || episodeIsRead.value) return false
  if (autoReadSuppressedForEpisodeId === props.episode.id) return false
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return false
  return true
}

async function setReadState(read: boolean, opts: { manual?: boolean } = {}) {
  const previous = readAt.value
  const optimisticReadAt = read ? new Date().toISOString() : null
  const requestId = ++readRequestId

  if (opts.manual && !read) autoReadSuppressedForEpisodeId = props.episode.id
  else if (read) autoReadSuppressedForEpisodeId = null

  readAt.value = optimisticReadAt
  readStateBusy.value = true
  syncReadVisibilityTimer()

  try {
    const res = await readState.setReadState(props.episode.id, read)
    if (requestId === readRequestId) readAt.value = res.readAt
  } catch {
    if (requestId === readRequestId) {
      readAt.value = previous
      if (opts.manual && !read) autoReadSuppressedForEpisodeId = null
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
    if (canAutoMarkRead()) void setReadState(true)
  }, ARTICLE_READ_VISIBILITY_MS)
}

function clearReadVisibilityTimer() {
  if (readVisibilityTimer == null) return
  clearTimeout(readVisibilityTimer)
  readVisibilityTimer = null
}

function toggleReadState() {
  void setReadState(!episodeIsRead.value, { manual: true })
}

onMounted(async () => {
  await ensureLoaded()
  if (import.meta.client) {
    document.addEventListener('visibilitychange', syncReadVisibilityTimer)
    syncReadVisibilityTimer()
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', syncReadVisibilityTimer)
  }
  clearReadVisibilityTimer()
})

watch(
  [isDetailView, modalVisible, () => props.isSelected],
  () => syncReadVisibilityTimer(),
  { flush: 'post' },
)

watch(
  () => props.isSelected,
  (selected) => {
    if (!selected) {
      clearReadVisibilityTimer()
      if (autoReadSuppressedForEpisodeId === props.episode.id) {
        autoReadSuppressedForEpisodeId = null
      }
      return
    }
    syncReadVisibilityTimer()
  },
  { flush: 'post', immediate: true },
)

useModalStackRegistration(modalVisible)
const { anyOpen: anyModalOpen } = useModalStack()

defineShortcuts(
  {
    e: () => {
      if (props.isSelected) toggleDetailView()
    },
    m: () => {
      if (props.isSelected) toggleReadState()
    },
    escape: () => {
      if (props.isSelected) isDetailView.value = false
    },
  },
  { when: () => props.isSelected && !anyModalOpen.value },
)

defineShortcuts({
  q: () => {
    if (!props.isSelected || !hasDetailsModal.value) return
    toggleDetails()
  },
})

const { prefs, update } = useUiPrefs()

const {
  isEpisodeSaved: isSavedInbox,
  saveEpisode: saveToInboxApi,
  removeEpisode: removeFromInboxApi,
  ensureLoaded,
} = useKnowledgeInbox()
const toast = useToast()
const inboxSaveBusy = ref(false)

const isEpisodeSavedInInbox = computed(() => isSavedInbox(props.episode.id))

async function saveToInbox() {
  inboxSaveBusy.value = true
  try {
    const wasSaved = isSavedInbox(props.episode.id)
    const ok = wasSaved
      ? await removeFromInboxApi(props.episode.id)
      : await saveToInboxApi(props.episode.id)
    if (ok) {
      toast.push({
        message: wasSaved ? t('knowledgeInbox.removedFromInbox') : t('knowledgeInbox.savedToInbox'),
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

watch(
  () => (props.isSelected ? props.episode.link : null),
  (link) => {
    if (!link || !import.meta.client) return
    useHead({ link: [{ rel: 'canonical', href: link }] })
  },
  { immediate: true },
)
</script>

<template>
  <div
    :id="episode.id"
    class="article-container"
    :class="{ 'flip-back': isDetailView, 'flip-front': !isDetailView, 'article-read': episodeIsRead }"
    data-testid="episode-card"
    :data-episode-id="episode.id"
    :data-reader-selected="isSelected ? 'true' : 'false'"
  >
    <audio ref="audioEl" class="sr-only" preload="none" />

    <!-- Front -->
    <div class="article-content infl0-surface-front rounded-xl bg-front relative transition-all">
      <CornerFold position="top-right" :tooltip="t('article.cornerFold')" @click="toggleDetailView" />

      <div class="flex min-h-0 h-4/5 max-h-4/5 w-full flex-col items-stretch px-6 pt-6 pb-2 text-center">
        <div class="infl0-surface-typo-front flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <h1
            class="mb-2 w-full shrink-0 text-end text-[length:max(0.7rem,0.78em)] font-bold leading-tight tracking-tighter"
          >
            {{ episode.title }}
          </h1>
          <p
            class="teaser min-h-0 min-w-0 flex-1 cursor-pointer overflow-y-auto text-start text-[1em] text-[var(--infl0-article-front-fg-dim)] [overflow-wrap:anywhere] sm:text-center"
            tabindex="0"
            @click="toggleDetailView"
          >
            {{ episode.teaser }}
          </p>
        </div>
      </div>

      <div class="meta infl0-article-meta-front max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1 text-[var(--infl0-article-front-fg-dim)]">
          <TypeIcon :type="episode.source_type" class="shadow-md tooltip" :data-tip="episode.source_type" />
          <FreshnessIndicator
            v-if="episode.publishedAt"
            class="tooltip"
            :data-tip="formatDate(episode.publishedAt)"
            :published-at="episode.publishedAt"
          />
          <span
            v-if="durationLabel"
            class="badge badge-sm badge-outline tooltip border-[var(--infl0-article-front-fg-mute)] text-[var(--infl0-article-front-fg-dim)]"
            :data-tip="durationTooltip ?? undefined"
          >
            {{ durationLabel }}
          </span>
          <span
            v-if="seasonEpisodeLabel"
            class="badge badge-sm badge-outline tooltip border-[var(--infl0-article-front-fg-mute)] text-[var(--infl0-article-front-fg-dim)]"
            :data-tip="seasonEpisodeTooltip ?? undefined"
          >
            {{ seasonEpisodeLabel }}
          </span>
          <span
            v-if="episode.explicit"
            class="badge badge-sm badge-error badge-outline tooltip"
            :data-tip="t('episode.explicit')"
            :aria-label="t('episode.explicit')"
          >E</span>
          <span
            v-if="episodeTypeKind === 'trailer'"
            class="tooltip inline-flex items-center text-[var(--infl0-article-front-fg-dim)]"
            :data-tip="episodeTypeTooltip ?? undefined"
          >
            <Infl0Icon name="episode.trailer" :label="episodeTypeTooltip ?? undefined" />
          </span>
          <span
            v-else-if="episodeTypeKind === 'bonus'"
            class="tooltip inline-flex items-center text-[var(--infl0-article-front-fg-dim)]"
            :data-tip="episodeTypeTooltip ?? undefined"
          >
            <Infl0Icon name="episode.bonus" :label="episodeTypeTooltip ?? undefined" />
          </span>
          <button
            type="button"
            class="read-status badge badge-sm tooltip ms-auto"
            :class="{ 'read-status--read': episodeIsRead }"
            :data-tip="readStatusTip"
            :aria-label="readStatusTip"
            :aria-pressed="episodeIsRead ? 'true' : 'false'"
            :disabled="readStateBusy"
            data-testid="episode-read-status"
            @click.stop="toggleReadState"
          >
            <span class="read-status-eye" aria-hidden="true" />
            <span class="sr-only">{{ readStatusTip }}</span>
          </button>
          <button
            type="button"
            class="inbox-status badge badge-sm tooltip ms-1"
            :class="{ 'inbox-status--saved': isEpisodeSavedInInbox }"
            :data-tip="isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-label="isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-pressed="isEpisodeSavedInInbox ? 'true' : 'false'"
            :disabled="inboxSaveBusy"
            data-testid="episode-save-inbox"
            @click.stop="saveToInbox"
          >
            <svg
              v-if="isEpisodeSavedInInbox"
              aria-hidden="true"
              class="inbox-status-icon inbox-status-icon--filled"
              viewBox="0 0 16 16"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <svg
              v-else
              aria-hidden="true"
              class="inbox-status-icon"
              viewBox="0 0 16 16"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <span class="sr-only">
              {{ isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox') }}
            </span>
          </button>
        </div>
        <p v-if="podcastLabel" class="mb-1 truncate text-[0.85em] text-[var(--infl0-article-front-fg-mute)]">
          {{ podcastLabel }}
        </p>
        <div v-if="episode.category?.length" class="mb-1 text-[var(--infl0-article-front-fg-mute)]">
          {{ episode.category.join(', ') }}
        </div>
      </div>

      <FlipArrow class="action-flip-front" direction="front" @click="toggleDetailView" />
    </div>

    <!-- Back -->
    <div
      class="article-detail infl0-surface-back rounded-xl bg-back relative shadow-inner transition-all text-[var(--infl0-article-back-fg)]"
    >
      <div class="flex min-h-0 h-4/5 max-h-4/5 w-full flex-col items-stretch px-4 pt-4 pb-2">
        <div
          class="infl0-surface-typo-back flex min-h-0 w-full min-w-0 flex-1 flex-col gap-2 text-[var(--infl0-article-back-fg)]"
        >
          <section
            class="episode-details-panel shrink-0 rounded-lg border border-[var(--infl0-article-back-fg-mute)]/30 bg-[var(--infl0-card-back)]/40 p-3 text-start"
            data-testid="episode-details-panel"
          >
            <div class="flex gap-3">
              <img
                v-if="episode.image_url"
                :src="episode.image_url"
                :alt="t('episode.coverAlt', { title: episode.title })"
                class="h-16 w-16 shrink-0 rounded-md object-cover"
                loading="lazy"
              >
              <div class="min-w-0 flex-1">
                <h2 class="mb-0 text-[0.95em] font-bold leading-snug text-[var(--infl0-article-back-fg)]">
                  {{ episode.title }}
                </h2>
                <p
                  v-if="episode.subtitle"
                  class="mt-0 text-[0.82em] text-[var(--infl0-article-back-fg-dim)]"
                >
                  {{ episode.subtitle }}
                </p>
                <ul class="list-none mt-2 space-y-0.5 text-[0.78em] text-[var(--infl0-article-back-fg-mute)]">
                  <li v-if="durationLabel">
                    <span class="font-medium text-[var(--infl0-article-back-fg-dim)]">{{ t('episode.duration') }}:</span>
                    {{ durationLabel }}
                  </li>
                  <li v-if="podcastLabel">
                    <span class="font-medium text-[var(--infl0-article-back-fg-dim)]">{{ t('episode.podcast') }}:</span>
                    {{ podcastLabel }}
                  </li>
                  <li v-if="seasonEpisodeLabel">{{ seasonEpisodeLabel }}</li>
                </ul>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <button
                v-if="playbackUrl"
                type="button"
                class="btn btn-primary btn-sm btn-square tooltip"
                :data-tip="t('episode.playInBrowser')"
                :aria-label="t('episode.playInBrowser')"
                data-testid="episode-play-browser"
                @click="playInBrowser(0)"
              >
                <span class="inline-flex items-center position-relative gap-0.5" aria-hidden="true">
                  <Infl0Icon name="episode.play" size="lg" />
                  <Infl0Icon name="episode.external" size="sm" class="opacity-80 absolute bottom-0 right-0" />
                </span>
              </button>
              <a
                :href="episode.link"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost btn-sm btn-square tooltip md:hidden"
                :data-tip="t('episode.openInPodcastApp')"
                :aria-label="t('episode.openInPodcastApp')"
                data-testid="episode-open-podcast-app"
                @click="emit('commit')"
              >
                <span class="inline-flex items-center gap-0.5" aria-hidden="true">
                  <Infl0Icon name="episode.external" size="lg" />
                </span>
              </a>
              <a
                :href="episode.link"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost btn-sm btn-square tooltip hidden md:inline-flex"
                :data-tip="t('episode.openEpisodePage')"
                :aria-label="t('episode.openEpisodePage')"
                data-testid="episode-open-episode-page"
                @click="emit('commit')"
              >
                <span class="inline-flex items-center gap-0.5" aria-hidden="true">
                  <Infl0Icon name="episode.external" size="lg" />
                </span>
              </a>
              <a
                v-if="feedUrl"
                :href="feedUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost btn-sm btn-square tooltip"
                :data-tip="t('episode.openPodcastFeed')"
                :aria-label="t('episode.openPodcastFeed')"
                data-testid="episode-open-podcast-feed"
                @click="emit('commit')"
              >
                <Infl0Icon name="episode.feed" size="lg" />
              </a>
            </div>

            <EpisodeCollapsibleSection
              v-if="episode.chapters?.length"
              class="mt-3"
              :title="t('episode.chapters')"
              test-id="episode-chapters-collapsible"
            >
              <ul class="list-none max-h-32 overflow-y-auto px-4 pb-2 text-[0.78em] episode-chapter-list">
                <li v-for="(ch, i) in episode.chapters" :key="i">
                  <button
                    type="button"
                    class="episode-chapter-btn w-full py-1 text-start text-[var(--infl0-article-back-fg-dim)] hover:text-[var(--infl0-article-back-fg)]"
                    @click="onChapterClick(ch)"
                  >
                    <span class="tabular-nums text-[var(--infl0-article-back-fg-mute)] me-1">{{
                      formatChapterTimestamp(ch.start_seconds)
                    }}</span>{{ ch.title }}
                  </button>
                </li>
              </ul>
            </EpisodeCollapsibleSection>

            <EpisodeCollapsibleSection
              v-if="episode.shownotes_md?.trim()"
              class="mt-2"
              :title="t('episode.shownotes')"
              test-id="episode-shownotes-collapsible"
            >
              <SafeMarkdown
                :markdown="episode.shownotes_md"
                class="max-h-36 overflow-y-auto px-2 pb-2 text-[0.78em] prose prose-sm max-w-none text-[var(--infl0-article-back-fg-dim)]"
              />
            </EpisodeCollapsibleSection>
          </section>

          <p
            class="summary min-h-0 min-w-0 flex-1 overflow-y-auto text-start text-[1em] text-[var(--infl0-article-back-fg-dim)] [overflow-wrap:anywhere] sm:text-center"
          >
            {{ episode.summary_long }}
          </p>

          <p class="m-0 w-full shrink-0 pt-1 text-end text-[0.88em] text-[var(--infl0-article-back-fg-mute)]">
            <a
              v-if="hasDetailsModal"
              ref="detailsLink"
              href="#"
              class="article-back-link font-bold"
              data-testid="episode-details-link"
              @click.prevent="showDetails($event)"
            >
              {{ t('episode.details') }}
            </a>
            <a
              v-else
              :href="episode.link"
              target="_blank"
              rel="noopener noreferrer"
              class="article-back-link font-bold"
              @click="emit('commit')"
            >
              {{ t('episode.openEpisodePage') }}
            </a>
          </p>
        </div>
      </div>

      <div class="meta infl0-article-meta-back max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
        <div class="flex items-center mb-1 text-[var(--infl0-article-back-fg-mute)]">
          <TypeIcon :type="episode.source_type" class="me-1 shadow-md" />
          {{ formatDate(episode.publishedAt) }}
          <button
            type="button"
            class="read-status badge badge-sm tooltip ms-auto"
            :class="{ 'read-status--read': episodeIsRead }"
            :data-tip="readStatusTip"
            :aria-label="readStatusTip"
            :aria-pressed="episodeIsRead ? 'true' : 'false'"
            :disabled="readStateBusy"
            @click.stop="toggleReadState"
          >
            <span class="read-status-eye" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="inbox-status badge badge-sm tooltip ms-1"
            :class="{ 'inbox-status--saved': isEpisodeSavedInInbox }"
            :data-tip="isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-label="isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-pressed="isEpisodeSavedInInbox ? 'true' : 'false'"
            :disabled="inboxSaveBusy"
            data-testid="episode-save-inbox-back"
            @click.stop="saveToInbox"
          >
            <svg
              v-if="isEpisodeSavedInInbox"
              aria-hidden="true"
              class="inbox-status-icon inbox-status-icon--filled"
              viewBox="0 0 16 16"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <svg
              v-else
              aria-hidden="true"
              class="inbox-status-icon"
              viewBox="0 0 16 16"
            >
              <path d="M2 2v13l6-3 6 3V2z" />
            </svg>
            <span class="sr-only">
              {{ isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox') }}
            </span>
          </button>
        </div>
      </div>

      <FlipArrow class="action-flip-back" direction="back" @click="toggleDetailView" />
    </div>

    <dialog
      v-if="hasDetailsModal"
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
            :class="{ 'text-[var(--infl0-card-grad-a)] hover:text-[var(--infl0-card-grad-a)]': isEpisodeSavedInInbox }"
            :data-tip="isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox')"
            :aria-label="isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox')"
            :disabled="inboxSaveBusy"
            @click.stop="saveToInbox"
          >
            <svg
              v-if="isEpisodeSavedInInbox"
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
            <span class="text-xs">{{ isEpisodeSavedInInbox ? t('knowledgeInbox.removeFromInbox') : t('knowledgeInbox.saveToInbox') }}</span>
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
          {{ episode.title }}
        </h2>

        <p :id="tablistLabelId" class="sr-only">
          {{ t('episode.details') }}
        </p>

        <div
          role="tablist"
          class="tabs tabs-boxed mb-3"
          :aria-labelledby="tablistLabelId"
          @keydown="onDetailsTabKeydown"
        >
          <button
            v-if="episode.rawMarkdown?.trim()"
            :id="contentTabId"
            ref="contentTabButton"
            type="button"
            role="tab"
            class="tab"
            :class="{ 'tab-active': detailsTab === 'content' }"
            :aria-selected="detailsTab === 'content'"
            :aria-controls="contentPanelId"
            :tabindex="detailsTab === 'content' ? 0 : -1"
            @click="selectDetailsTab('content')"
          >
            {{ t('episode.tabContent') }}
          </button>
          <button
            v-if="episode.transcript_md?.trim()"
            :id="transcriptTabId"
            ref="transcriptTabButton"
            type="button"
            role="tab"
            class="tab"
            :class="{ 'tab-active': detailsTab === 'transcript' }"
            :aria-selected="detailsTab === 'transcript'"
            :aria-controls="transcriptPanelId"
            :tabindex="detailsTab === 'transcript' ? 0 : -1"
            @click="selectDetailsTab('transcript')"
          >
            {{ t('episode.tabTranscript') }}
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto infl0-surface-reader infl0-surface-typo-reader prose max-w-none">
          <template v-if="modalVisible">
            <div
              v-if="episode.rawMarkdown?.trim()"
              v-show="detailsTab === 'content'"
              :id="contentPanelId"
              role="tabpanel"
              tabindex="0"
              :aria-labelledby="contentTabId"
              :hidden="detailsTab !== 'content'"
            >
              <SafeMarkdown
                :markdown="episode.rawMarkdown"
                content-class="episode-markdown"
              />
            </div>
            <div
              v-if="episode.transcript_md?.trim()"
              v-show="detailsTab === 'transcript'"
              :id="transcriptPanelId"
              role="tabpanel"
              tabindex="0"
              :aria-labelledby="transcriptTabId"
              :hidden="detailsTab !== 'transcript'"
            >
              <p v-if="episode.transcript_url" class="not-prose mb-3 text-sm">
                <a
                  :href="episode.transcript_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="link"
                >
                  {{ t('episode.transcriptExternal') }}
                </a>
              </p>
              <SafeMarkdown
                :markdown="episode.transcript_md"
                content-class="episode-markdown"
              />
            </div>
          </template>
        </div>

        <p class="mt-3 text-xs text-[var(--infl0-reader-prose-muted)]">
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

.inbox-status {
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

.inbox-status--saved {
  border-color: var(--infl0-article-front-fg);
  color: var(--infl0-card-grad-a);
  background: var(--infl0-article-front-fg);
}

.inbox-status:disabled {
  cursor: wait;
  opacity: 0.7;
}

.inbox-status-icon {
  width: 0.9em;
  height: 0.9em;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linejoin: round;
}

.inbox-status-icon--filled {
  fill: currentColor;
  stroke: currentColor;
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
  border-radius: 999px;
  transform: rotate(-8deg);
}

.read-status-eye::after {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  width: 0.22em;
  height: 0.22em;
  border-radius: 999px;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.article-detail {
  box-shadow: inset 0 8px 15px rgba(0, 0, 0, 0.2);
}

.article-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  perspective: 10px;
}

.article-content,
.article-detail {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

.article-detail {
  transform: rotateY(180deg);
}

.flip-back {
  animation: flip-back 0.5s cubic-bezier(0.445, 0.05, 0.55, 0.95) both;
}

.flip-front {
  animation: flip-front 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
}

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

.episode-details-panel :deep(a) {
  color: var(--infl0-reader-link);
  text-decoration: underline;
}

.episode-chapter-btn {
  background: none;
  border: none;
  cursor: pointer;
}

.episode-chapter-list {
  margin: 0;
}

.episode-chapter-list :deep(li) {
  margin-bottom: 0 !important;
}

.episode-details-panel :deep(.prose li) {
  margin-bottom: 0.25em;
}

@media (prefers-reduced-motion: reduce) {
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
