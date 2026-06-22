<script setup lang="ts">
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

definePageMeta({
  layout: 'app',
  appFooter: true,
})

type ArticleDetail = {
  id: string
  title: string
  link: string
  author: string
  publishedAt: string
  fetchedAt: string
  sourceType: string
  sourceTitle: string
  tld: string
  teaser: string
  summaryLong: string
  category?: string[]
  tags: string[]
  rawMarkdown?: string
  crawlKey: string
  readAt: string | null
  saved: { id: string, capturedAt: string } | null
}

const route = useRoute()
const { t, locale } = useI18n()
const requestFetch = useRequestFetch()
const learningFocus = ref(false)
const readingNoteCount = ref(0)

const articleId = computed(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
})
const dateLocale = computed(() => (locale.value === 'de' ? de : enUS))

const { data: article, error } = await useAsyncData(
  () => `article-detail:${articleId.value}`,
  () => requestFetch<ArticleDetail>(`/api/articles/${encodeURIComponent(articleId.value)}`, {
    credentials: 'include',
  }),
  { watch: [articleId] },
)

function formatDate(value: string) {
  return format(new Date(value), 'PPP', { locale: dateLocale.value })
}
</script>

<template>
  <main
    class="mx-auto w-full px-4 py-8 transition-[max-width]"
    :class="learningFocus ? 'max-w-4xl' : 'max-w-3xl'"
  >
    <div
      v-if="error"
      role="alert"
      class="alert alert-error"
    >
      <span>{{ t('articleDetail.errorLoad') }}</span>
    </div>

    <article
      v-else-if="article"
      class="space-y-6"
      data-testid="article-detail"
    >
      <header class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <NuxtLink
            to="/knowledge/inbox"
            class="text-sm font-semibold text-[var(--infl0-reader-link)]"
          >
            {{ t('articleDetail.backToInbox') }}
          </NuxtLink>
          <button
            type="button"
            class="btn btn-sm"
            :class="learningFocus ? 'btn-primary' : 'btn-ghost'"
            :aria-pressed="learningFocus"
            data-testid="learning-focus-toggle"
            @click="learningFocus = !learningFocus"
          >
            {{ learningFocus ? t('readingNotes.learningFocus.stop') : t('readingNotes.learningFocus.start') }}
          </button>
        </div>

        <div class="space-y-2">
          <p class="text-sm text-[var(--infl0-canvas-fg-muted)]">
            {{ article.sourceTitle }}
            <span aria-hidden="true">·</span>
            <time :datetime="article.publishedAt">{{ formatDate(article.publishedAt) }}</time>
          </p>
          <h1 class="text-3xl font-semibold leading-tight text-[var(--infl0-canvas-fg)]">
            {{ article.title }}
          </h1>
          <p
            v-if="article.author"
            class="text-sm text-[var(--infl0-canvas-fg-muted)]"
          >
            {{ t('articleDetail.byline', { author: article.author }) }}
          </p>
        </div>

        <div
          v-if="!learningFocus"
          class="flex flex-wrap items-center gap-2 text-xs text-[var(--infl0-canvas-fg-muted)]"
        >
          <span
            v-if="article.saved"
            class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
          >
            {{ t('articleDetail.savedAt', { date: formatDate(article.saved.capturedAt) }) }}
          </span>
          <span
            v-if="article.readAt"
            class="rounded border border-[var(--infl0-panel-border)] px-2 py-1"
          >
            {{ t('articleDetail.readAt', { date: formatDate(article.readAt) }) }}
          </span>
          <a
            :href="article.link"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded border border-[var(--infl0-panel-border)] px-2 py-1 text-[var(--infl0-reader-link)]"
          >
            {{ t('articleDetail.openOriginal') }}
          </a>
        </div>
        <a
          v-else
          :href="article.link"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block text-sm text-[var(--infl0-reader-link)] underline"
        >
          {{ t('articleDetail.openOriginal') }}
        </a>
      </header>

      <section
        v-if="!learningFocus && (article.teaser || article.summaryLong)"
        class="infl0-panel rounded-xl border p-4"
      >
        <p
          v-if="article.teaser"
          class="text-base font-medium text-[var(--infl0-panel-text)]"
        >
          {{ article.teaser }}
        </p>
        <p
          v-if="article.summaryLong"
          class="mt-3 text-sm leading-relaxed text-[var(--infl0-panel-text-dim)]"
        >
          {{ article.summaryLong }}
        </p>
      </section>

      <section
        v-if="!learningFocus && (article.tags.length || article.category?.length)"
        class="flex flex-wrap gap-2"
        aria-label="Article metadata"
      >
        <span
          v-for="category in article.category ?? []"
          :key="`category-${category}`"
          class="rounded border border-[var(--infl0-panel-border)] px-2 py-1 text-xs text-[var(--infl0-canvas-fg-muted)]"
        >
          {{ category }}
        </span>
        <span
          v-for="tag in article.tags"
          :key="`tag-${tag}`"
          class="rounded border border-[var(--infl0-panel-border)] px-2 py-1 text-xs text-[var(--infl0-canvas-fg-muted)]"
        >
          #{{ tag }}
        </span>
      </section>

      <aside
        v-if="learningFocus"
        class="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--infl0-panel-border)] bg-[var(--infl0-canvas-bg)]/95 px-4 py-3 shadow-lg backdrop-blur"
        data-testid="learning-focus-status"
      >
        <div>
          <strong class="text-sm text-[var(--infl0-canvas-fg)]">{{ t('readingNotes.learningFocus.active') }}</strong>
          <p class="text-xs text-[var(--infl0-canvas-fg-muted)]">
            {{ t('readingNotes.learningFocus.status', { count: readingNoteCount }) }}
          </p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" @click="learningFocus = false">
          {{ t('readingNotes.learningFocus.stop') }}
        </button>
      </aside>

      <AnnotatableText
        v-if="article.rawMarkdown"
        :article-id="article.id"
        :markdown="article.rawMarkdown"
        content-source="body"
        @count-change="readingNoteCount = $event"
      />
    </article>
  </main>
</template>
