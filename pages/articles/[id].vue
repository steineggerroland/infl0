<script setup lang="ts">
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import SafeMarkdown from '~/components/SafeMarkdown.vue'

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
  <main class="mx-auto w-full max-w-3xl px-4 py-8">
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
        <NuxtLink
          to="/knowledge/inbox"
          class="text-sm font-semibold text-[var(--infl0-reader-link)]"
        >
          {{ t('articleDetail.backToInbox') }}
        </NuxtLink>

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

        <div class="flex flex-wrap items-center gap-2 text-xs text-[var(--infl0-canvas-fg-muted)]">
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
      </header>

      <section
        v-if="article.teaser || article.summaryLong"
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
        v-if="article.tags.length || article.category?.length"
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

      <section
        v-if="article.rawMarkdown"
        class="infl0-surface-reader infl0-surface-typo-reader prose max-w-none rounded-xl border border-[var(--infl0-surface-reader-border)] p-4 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-li:marker:text-[var(--infl0-reader-prose-muted)] prose-a:text-[var(--infl0-reader-link)] prose-pre:rounded-lg prose-pre:bg-[var(--infl0-reader-code-bg)] prose-pre:text-[var(--infl0-reader-code-fg)] prose-code:rounded prose-code:bg-[var(--infl0-reader-code-bg)] prose-code:px-1 prose-code:py-0.5 prose-code:text-[var(--infl0-reader-code-fg)]"
      >
        <SafeMarkdown
          :markdown="article.rawMarkdown"
          content-class="article-markdown"
          fallback-class="whitespace-pre-wrap break-words text-[1em] text-[var(--infl0-surface-reader-text)]"
        />
      </section>
    </article>
  </main>
</template>
