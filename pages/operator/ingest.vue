<script setup lang="ts">
import { parseFetchError } from '~/utils/parse-fetch-error'

definePageMeta({
  layout: 'app',
  auth: 'required',
})

type IngestRequest = {
  id: string
  status: string
  httpStatus: number
  failureCategory: string | null
  failureMessage: string | null
  crawlKey: string | null
  itemKind: string | null
  contentId: string | null
  articlesAccepted: number
  episodesAccepted: number
  timelineInserted: number
  subscribersAffected: number
  requestPreview: unknown
  createdAt: string
}

type IngestResponse = {
  summary: {
    latestTenGreen: boolean
    latestTenCount: number
    successCount: number
    rejectedCount: number
    articlesAccepted: number
    episodesAccepted: number
    subscribersAffected: number
  }
  items: IngestRequest[]
}

const { t } = useI18n()

const { data, error } = await useFetch<IngestResponse>('/api/operator/ingest-requests', {
  key: 'operator-ingest-requests',
  credentials: 'include',
})

if (error.value) {
  const parsed = parseFetchError(error.value)
  throw createError({
    statusCode: parsed.statusCode ?? 500,
    statusMessage: parsed.message || t('operatorIngest.errorLoad'),
  })
}

const summary = computed(
  () =>
    data.value?.summary ?? {
      latestTenGreen: false,
      latestTenCount: 0,
      successCount: 0,
      rejectedCount: 0,
      articlesAccepted: 0,
      episodesAccepted: 0,
      subscribersAffected: 0,
    },
)
const rows = computed(() => data.value?.items ?? [])

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function previewText(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2)
}
</script>

<template>
  <main class="mx-auto w-full max-w-[1200px] p-4 md:p-6">
    <header class="mb-4">
      <h1 class="text-2xl font-semibold">{{ t('operatorIngest.title') }}</h1>
      <p class="text-sm opacity-80">{{ t('operatorIngest.intro') }}</p>
    </header>

    <section class="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="ingest-summary-latest-ten">
        <div class="stat-title">{{ t('operatorIngest.summary.latestTen') }}</div>
        <div class="stat-value text-2xl" :class="summary.latestTenGreen ? 'text-success' : 'text-warning'">
          {{ summary.latestTenGreen ? t('operatorIngest.green') : t('operatorIngest.attention') }}
        </div>
        <div class="stat-desc">{{ summary.latestTenCount }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="ingest-summary-success">
        <div class="stat-title">{{ t('operatorIngest.summary.success') }}</div>
        <div class="stat-value text-2xl">{{ summary.successCount }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="ingest-summary-rejected">
        <div class="stat-title">{{ t('operatorIngest.summary.rejected') }}</div>
        <div class="stat-value text-2xl">{{ summary.rejectedCount }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="ingest-summary-articles">
        <div class="stat-title">{{ t('operatorIngest.summary.articles') }}</div>
        <div class="stat-value text-2xl">{{ summary.articlesAccepted }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="ingest-summary-episodes">
        <div class="stat-title">{{ t('operatorIngest.summary.episodes') }}</div>
        <div class="stat-value text-2xl">{{ summary.episodesAccepted }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="ingest-summary-subscribers">
        <div class="stat-title">{{ t('operatorIngest.summary.subscribers') }}</div>
        <div class="stat-value text-2xl">{{ summary.subscribersAffected }}</div>
      </div>
    </section>

    <section class="space-y-2" data-testid="ingest-request-list">
      <details
        v-for="row in rows"
        :key="row.id"
        class="rounded-box border bg-base-100"
        :data-testid="`ingest-request-${row.status}`"
        :data-failure-category="row.failureCategory ?? ''"
        :data-item-kind="row.itemKind ?? ''"
      >
        <summary class="cursor-pointer p-3">
          <span class="mr-2 badge" :class="row.status === 'success' ? 'badge-success' : 'badge-error'">
            {{ row.status }}
          </span>
          <span class="font-medium">{{ row.itemKind ?? row.failureCategory ?? t('operatorIngest.unknownKind') }}</span>
          <span class="ml-2 text-sm opacity-70">{{ row.contentId ?? row.crawlKey ?? row.id }}</span>
        </summary>
        <div class="grid gap-3 border-t p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <dl class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
            <dt class="font-medium">{{ t('operatorIngest.fields.createdAt') }}</dt>
            <dd>{{ fmtDate(row.createdAt) }}</dd>
            <dt class="font-medium">{{ t('operatorIngest.fields.httpStatus') }}</dt>
            <dd>{{ row.httpStatus }}</dd>
            <dt class="font-medium">{{ t('operatorIngest.fields.crawlKey') }}</dt>
            <dd>{{ row.crawlKey ?? '—' }}</dd>
            <dt class="font-medium">{{ t('operatorIngest.fields.articles') }}</dt>
            <dd>{{ row.articlesAccepted }}</dd>
            <dt class="font-medium">{{ t('operatorIngest.fields.episodes') }}</dt>
            <dd>{{ row.episodesAccepted }}</dd>
            <dt class="font-medium">{{ t('operatorIngest.fields.timelineInserted') }}</dt>
            <dd>{{ row.timelineInserted }}</dd>
            <dt class="font-medium">{{ t('operatorIngest.fields.subscribers') }}</dt>
            <dd>{{ row.subscribersAffected }}</dd>
            <dt v-if="row.failureCategory" class="font-medium">{{ t('operatorIngest.fields.failureCategory') }}</dt>
            <dd v-if="row.failureCategory">{{ row.failureCategory }}</dd>
            <dt v-if="row.failureMessage" class="font-medium">{{ t('operatorIngest.fields.failureMessage') }}</dt>
            <dd v-if="row.failureMessage">{{ row.failureMessage }}</dd>
          </dl>
          <pre
            class="max-h-80 overflow-auto rounded-box bg-base-200 p-3 text-xs"
            data-testid="ingest-request-preview"
          >{{ previewText(row.requestPreview) }}</pre>
        </div>
      </details>
      <p v-if="rows.length === 0" class="rounded-box border bg-base-100 p-4 text-sm opacity-70">
        {{ t('operatorIngest.empty') }}
      </p>
    </section>
  </main>
</template>
