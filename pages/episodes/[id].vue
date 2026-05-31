<script setup lang="ts">
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import SafeMarkdown from '~/components/SafeMarkdown.vue'
import { formatChapterTimestamp, chapterJumpHref, isLikelyPlayableAudioUrl } from '~/utils/episode-playback'
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
</script>

<template>
  <main class="mx-auto w-full max-w-3xl px-4 py-8">
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
        <NuxtLink
          to="/knowledge/inbox"
          class="text-sm font-semibold text-[var(--infl0-reader-link)]"
        >
          {{ t('episodeDetail.backToInbox') }}
        </NuxtLink>

        <section class="infl0-panel rounded-xl border p-4">
          <div class="flex flex-col gap-4 sm:flex-row">
            <img
              v-if="episode.imageUrl"
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
                v-if="episode.subtitle"
                class="mt-2 text-sm leading-relaxed text-[var(--infl0-panel-text-dim)]"
              >
                {{ episode.subtitle }}
              </p>

              <ul class="mt-3 flex flex-wrap gap-2 text-xs text-[var(--infl0-panel-muted)]">
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
              v-if="episode.mediaUrl"
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
              v-if="episode.feedUrl"
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
              v-if="episode.transcriptUrl"
              :href="episode.transcriptUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-ghost btn-sm"
            >
              {{ t('episode.transcriptExternal') }}
            </a>
          </div>

          <audio
            v-if="playbackUrl"
            class="mt-4 w-full"
            controls
            preload="none"
            :src="playbackUrl"
          />
        </section>
      </header>

      <section
        v-if="episode.saved || episode.readAt"
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
        v-if="episode.teaser || episode.summaryLong"
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
        v-if="episode.tags.length || episode.category?.length"
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
        v-if="episode.chapters?.length"
        class="infl0-panel rounded-xl border p-4"
      >
        <h2 class="text-base font-semibold text-[var(--infl0-panel-text)]">
          {{ t('episode.chapters') }}
        </h2>
        <ol class="mt-3 space-y-2">
          <li
            v-for="chapter in episode.chapters"
            :key="`${chapter.start_seconds}-${chapter.title}`"
          >
            <a
              :href="chapterJumpHref(chapter, episode.link, episode.mediaUrl)"
              target="_blank"
              rel="noopener noreferrer"
              class="flex gap-3 rounded-md px-2 py-1 text-sm text-[var(--infl0-panel-text-dim)] hover:bg-[color-mix(in_srgb,var(--infl0-reader-link)_8%,transparent)] hover:text-[var(--infl0-reader-link)]"
            >
              <span class="tabular-nums text-[var(--infl0-panel-muted)]">{{ formatChapterTimestamp(chapter.start_seconds) }}</span>
              <span>{{ chapter.title }}</span>
            </a>
          </li>
        </ol>
      </section>

      <section
        v-if="episode.rawMarkdown"
        class="infl0-surface-reader infl0-surface-typo-reader prose max-w-none rounded-xl border border-[var(--infl0-surface-reader-border)] p-4 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-li:marker:text-[var(--infl0-reader-prose-muted)] prose-a:text-[var(--infl0-reader-link)] prose-pre:rounded-lg prose-pre:bg-[var(--infl0-reader-code-bg)] prose-pre:text-[var(--infl0-reader-code-fg)] prose-code:rounded prose-code:bg-[var(--infl0-reader-code-bg)] prose-code:px-1 prose-code:py-0.5 prose-code:text-[var(--infl0-reader-code-fg)]"
      >
        <h2>{{ t('episode.tabContent') }}</h2>
        <SafeMarkdown
          :markdown="episode.rawMarkdown"
          content-class="episode-markdown"
          fallback-class="whitespace-pre-wrap break-words text-[1em] text-[var(--infl0-surface-reader-text)]"
        />
      </section>

      <section
        v-if="episode.shownotesMd"
        class="infl0-surface-reader infl0-surface-typo-reader prose max-w-none rounded-xl border border-[var(--infl0-surface-reader-border)] p-4 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-li:marker:text-[var(--infl0-reader-prose-muted)] prose-a:text-[var(--infl0-reader-link)]"
      >
        <h2>{{ t('episode.shownotes') }}</h2>
        <SafeMarkdown
          :markdown="episode.shownotesMd"
          content-class="episode-shownotes"
          fallback-class="whitespace-pre-wrap break-words text-[1em] text-[var(--infl0-surface-reader-text)]"
        />
      </section>

      <section
        v-if="episode.transcriptMd"
        class="infl0-surface-reader infl0-surface-typo-reader prose max-w-none rounded-xl border border-[var(--infl0-surface-reader-border)] p-4 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-li:marker:text-[var(--infl0-reader-prose-muted)] prose-a:text-[var(--infl0-reader-link)]"
      >
        <h2>{{ t('episode.tabTranscript') }}</h2>
        <SafeMarkdown
          :markdown="episode.transcriptMd"
          content-class="episode-transcript"
          fallback-class="whitespace-pre-wrap break-words text-[1em] text-[var(--infl0-surface-reader-text)]"
        />
      </section>
    </article>
  </main>
</template>
