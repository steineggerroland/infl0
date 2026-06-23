<script setup lang="ts">
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { chapterJumpHref, formatChapterTimestamp, isLikelyPlayableAudioUrl } from '~/utils/episode-playback'
import { formatEpisodeDuration, type InflowEpisodeChapter } from '~/utils/inflow-episode'

definePageMeta({
  layout: 'app',
  appFooter: true,
})

type EpisodeDetail = {
  id: string
  title: string
  link: string
  author: string
  publishedAt: string
  fetchedAt: string
  sourceType: string
  sourceTitle: string
  feedUrl: string | null
  tld: string
  teaser: string
  summaryLong: string
  category?: string[]
  tags: string[]
  rawMarkdown?: string
  crawlKey: string
  readAt: string | null
  saved: { id: string, capturedAt: string } | null
  shownotesMd?: string
  transcriptMd?: string
  transcriptUrl?: string
  mediaUrl?: string
  mediaType?: string
  durationSeconds?: number
  episodeNumber?: number | null
  seasonNumber?: number | null
  episodeType?: string
  explicit?: boolean
  subtitle?: string
  imageUrl?: string
  chapters?: InflowEpisodeChapter[]
}

const route = useRoute()
const { t, locale } = useI18n()
const requestFetch = useRequestFetch()
const learningFocus = ref(false)
const pageRef = ref<HTMLElement | null>(null)
const readingNoteCounts = reactive({ body: 0, shownotes: 0, transcript: 0 })
const readingNoteCount = computed(() => (
  readingNoteCounts.body + readingNoteCounts.shownotes + readingNoteCounts.transcript
))

const episodeId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})
const dateLocale = computed(() => (locale.value === 'de' ? de : enUS))

const { data: episode, error } = await useAsyncData(
  () => `episode-detail:${episodeId.value}`,
  () => requestFetch<EpisodeDetail>(`/api/episodes/${encodeURIComponent(episodeId.value)}`, {
    credentials: 'include',
  }),
  { watch: [episodeId] },
)

const durationLabel = computed(() => formatEpisodeDuration(episode.value?.durationSeconds))
const playbackUrl = computed(() => {
  const current = episode.value
  if (!current?.mediaUrl || !isLikelyPlayableAudioUrl(current.mediaUrl, current.mediaType)) return null
  return current.mediaUrl
})
const seasonEpisodeLabel = computed(() => {
  const current = episode.value
  if (!current) return null
  if (current.seasonNumber && current.episodeNumber) {
    return t('episode.seasonEpisode', { season: current.seasonNumber, episode: current.episodeNumber })
  }
  if (current.episodeNumber) return t('episode.episodeNumber', { episode: current.episodeNumber })
  return null
})
const episodeTypeLabel = computed(() => {
  const type = episode.value?.episodeType
  if (type === 'trailer' || type === 'bonus') return t(`episode.typeTooltip.${type}`)
  return type?.trim() || null
})

function formatDate(value: string) {
  return format(new Date(value), 'PPP', { locale: dateLocale.value })
}

function textWorkElements() {
  return Array.from(pageRef.value?.querySelectorAll<HTMLElement>('[data-testid="annotatable-text"]') ?? [])
}

function firstTextWorkElement() {
  return textWorkElements()[0] ?? null
}

function visibleTextWorkElement() {
  return textWorkElements().find((element) => {
    const rect = element.getBoundingClientRect()
    return rect.bottom > 80
  }) ?? firstTextWorkElement()
}

function scrollToFirstTextWork() {
  const element = firstTextWorkElement()
  if (!element || typeof element.scrollIntoView !== 'function') return
  const behavior: ScrollBehavior = document.documentElement.dataset.motion === 'reduced' ? 'auto' : 'smooth'
  element.scrollIntoView({ block: 'start', behavior })
}

async function setLearningFocus(next: boolean) {
  if (learningFocus.value === next) return

  const anchor = visibleTextWorkElement()
  const beforeTop = anchor?.getBoundingClientRect().top ?? null
  learningFocus.value = next
  await nextTick()

  if (next) {
    scrollToFirstTextWork()
    return
  }

  if (!anchor || beforeTop === null || typeof window.scrollBy !== 'function') return
  const afterTop = anchor.getBoundingClientRect().top
  window.scrollBy({ top: afterTop - beforeTop, behavior: 'auto' })
}
</script>

<template>
  <main
    ref="pageRef"
    class="mx-auto w-full px-4 py-8 transition-[max-width]"
    :class="learningFocus ? 'max-w-4xl reading-work-focus' : 'max-w-3xl'"
  >
    <div
      v-if="error"
      role="alert"
      class="alert alert-error"
    >
      <span>{{ t('episodeDetail.errorLoad') }}</span>
    </div>

    <article
      v-else-if="episode"
      class="space-y-6"
      data-testid="episode-detail"
    >
      <header class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <NuxtLink
            to="/knowledge/inbox"
            class="text-sm font-semibold text-[var(--infl0-reader-link)]"
          >
            {{ t('episodeDetail.backToInbox') }}
          </NuxtLink>
          <button
            type="button"
            class="btn btn-sm"
            :class="learningFocus ? 'btn-primary' : 'btn-ghost'"
            :aria-pressed="learningFocus"
            data-testid="learning-focus-toggle"
            @click="setLearningFocus(!learningFocus)"
          >
            {{ learningFocus ? t('readingNotes.learningFocus.stop') : t('readingNotes.learningFocus.start') }}
          </button>
        </div>

        <section class="infl0-panel rounded-xl border p-4">
          <div class="flex flex-col gap-4 sm:flex-row">
            <img
              v-if="episode.imageUrl && !learningFocus"
              :src="episode.imageUrl"
              :alt="t('episode.coverAlt', { title: episode.title })"
              class="h-28 w-28 rounded-lg object-cover"
              loading="lazy"
            >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-[var(--infl0-panel-muted)]">
                {{ episode.sourceTitle }}
                <span aria-hidden="true">·</span>
                <time :datetime="episode.publishedAt">{{ formatDate(episode.publishedAt) }}</time>
              </p>
              <h1 class="mt-2 text-3xl font-semibold leading-tight text-[var(--infl0-panel-text)]">
                {{ episode.title }}
              </h1>
              <p
                v-if="episode.subtitle && !learningFocus"
                class="mt-2 text-sm leading-relaxed text-[var(--infl0-panel-text-dim)]"
              >
                {{ episode.subtitle }}
              </p>

              <ul
                v-if="!learningFocus"
                class="mt-3 flex flex-wrap gap-2 text-xs text-[var(--infl0-panel-muted)]"
              >
                <li
                  v-if="durationLabel"
                  class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
                >
                  {{ t('episode.duration') }}: {{ durationLabel }}
                </li>
                <li
                  v-if="seasonEpisodeLabel"
                  class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
                >
                  {{ seasonEpisodeLabel }}
                </li>
                <li
                  v-if="episodeTypeLabel"
                  class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
                >
                  {{ episodeTypeLabel }}
                </li>
                <li
                  v-if="episode.explicit"
                  class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
                >
                  {{ t('episode.explicit') }}
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <a
              v-if="episode.mediaUrl && !learningFocus"
              :href="episode.mediaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-primary btn-sm tooltip"
              :data-tip="t('episodeDetail.openMediaTooltip')"
            >
              <Infl0Icon
                name="episode.play"
                size="md"
              />
              {{ t('episodeDetail.openMedia') }}
            </a>
            <a
              :href="episode.link"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-ghost btn-sm tooltip"
              :data-tip="t('episode.openEpisodePage')"
            >
              <Infl0Icon
                name="episode.external"
                size="md"
              />
              {{ t('episode.openEpisodePage') }}
            </a>
            <a
              v-if="episode.feedUrl && !learningFocus"
              :href="episode.feedUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-ghost btn-sm tooltip"
              :data-tip="t('episode.openPodcastFeed')"
            >
              <Infl0Icon
                name="episode.feed"
                size="md"
              />
              {{ t('episode.openPodcastFeed') }}
            </a>
            <a
              v-if="episode.transcriptUrl && !learningFocus"
              :href="episode.transcriptUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-ghost btn-sm"
            >
              {{ t('episode.transcriptExternal') }}
            </a>
          </div>

          <audio
            v-if="playbackUrl && !learningFocus"
            class="mt-4 w-full"
            controls
            preload="none"
            :src="playbackUrl"
          />
        </section>
      </header>

      <section
        v-if="!learningFocus && (episode.saved || episode.readAt)"
        class="flex flex-wrap items-center gap-2 text-xs text-[var(--infl0-canvas-fg-muted)]"
      >
        <span
          v-if="episode.saved"
          class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
        >
          {{ t('episodeDetail.savedAt', { date: formatDate(episode.saved.capturedAt) }) }}
        </span>
        <span
          v-if="episode.readAt"
          class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
        >
          {{ t('episodeDetail.readAt', { date: formatDate(episode.readAt) }) }}
        </span>
      </section>

      <section
        v-if="!learningFocus && (episode.teaser || episode.summaryLong)"
        class="infl0-panel rounded-xl border p-4"
      >
        <p
          v-if="episode.teaser"
          class="text-base font-medium text-[var(--infl0-panel-text)]"
        >
          {{ episode.teaser }}
        </p>
        <p
          v-if="episode.summaryLong"
          class="mt-3 text-sm leading-relaxed text-[var(--infl0-panel-text-dim)]"
        >
          {{ episode.summaryLong }}
        </p>
      </section>

      <section
        v-if="!learningFocus && (episode.tags.length || episode.category?.length)"
        class="flex flex-wrap gap-2"
        :aria-label="t('episodeDetail.metadata')"
      >
        <span
          v-for="category in episode.category ?? []"
          :key="`category-${category}`"
          class="rounded border border-[var(--infl0-panel-border)] px-2 py-1 text-xs text-[var(--infl0-canvas-fg-muted)]"
        >
          {{ category }}
        </span>
        <span
          v-for="tag in episode.tags"
          :key="`tag-${tag}`"
          class="rounded border border-[var(--infl0-panel-border)] px-2 py-1 text-xs text-[var(--infl0-canvas-fg-muted)]"
        >
          #{{ tag }}
        </span>
      </section>

      <section
        v-if="!learningFocus && episode.chapters?.length"
        class="infl0-panel rounded-xl border p-4"
        data-testid="episode-chapters"
      >
        <h2 class="text-base font-semibold text-[var(--infl0-panel-text)]">
          {{ t('episode.chapters') }}
        </h2>
        <ol class="mt-3 list-none space-y-2 p-0" data-testid="episode-chapters-list">
          <li
            v-for="(chapter, index) in episode.chapters"
            :key="`${chapter.start_seconds}-${chapter.title}`"
          >
            <a
              :href="chapterJumpHref(chapter, episode.link, episode.mediaUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="grid grid-cols-[2rem_auto_1fr] gap-3 rounded-md px-2 py-1 text-sm text-[var(--infl0-panel-text-dim)] hover:bg-[color-mix(in_srgb,var(--infl0-reader-link)_8%,transparent)] hover:text-[var(--infl0-reader-link)]"
              data-testid="episode-chapter-link"
            >
              <span class="text-right tabular-nums text-[var(--infl0-panel-muted)]" data-testid="episode-chapter-number">{{ index + 1 }}.</span>
              <span class="tabular-nums text-[var(--infl0-panel-muted)]" data-testid="episode-chapter-time">{{ formatChapterTimestamp(chapter.start_seconds) }}</span>
              <span data-testid="episode-chapter-title">{{ chapter.title }}</span>
            </a>
          </li>
        </ol>
      </section>

      <aside
        v-if="learningFocus"
        class="learning-focus-status sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 shadow-lg"
        data-testid="learning-focus-status"
      >
        <div>
          <strong class="text-sm text-[var(--infl0-canvas-fg)]">{{ t('readingNotes.learningFocus.active') }}</strong>
          <p class="text-xs text-[var(--infl0-canvas-fg-muted)]">
            {{ t('readingNotes.learningFocus.status', { count: readingNoteCount }) }}
          </p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" @click="setLearningFocus(false)">
          {{ t('readingNotes.learningFocus.stop') }}
        </button>
      </aside>

      <AnnotatableText
        v-if="episode.rawMarkdown"
        :episode-id="episode.id"
        :markdown="episode.rawMarkdown"
        content-source="body"
        :heading="t('episode.tabContent')"
        @count-change="readingNoteCounts.body = $event"
      />

      <AnnotatableText
        v-if="episode.shownotesMd"
        :episode-id="episode.id"
        :markdown="episode.shownotesMd"
        content-source="shownotes"
        :heading="t('episode.shownotes')"
        @count-change="readingNoteCounts.shownotes = $event"
      />

      <AnnotatableText
        v-if="episode.transcriptMd"
        :episode-id="episode.id"
        :markdown="episode.transcriptMd"
        content-source="transcript"
        :heading="t('episode.tabTranscript')"
        @count-change="readingNoteCounts.transcript = $event"
      />
    </article>
  </main>
</template>
