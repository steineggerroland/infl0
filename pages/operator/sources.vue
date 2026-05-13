<script setup lang="ts">
import { normalizeSourceHealthKey, sourceHealthStatusDotClass } from '~/utils/source-health-display'
import { parseFetchError } from '~/utils/parse-fetch-error'

definePageMeta({
  layout: 'app',
  auth: 'required',
})

type OperatorFilter = 'all' | 'attention' | 'failing_degraded' | 'needs_setup' | 'blocked' | 'quiet'

type OperatorItem = {
  crawlKey: string
  sourceName: string
  sourceType: string | null
  sourceHealthStatus: string | null
  sourceHealthReason: string | null
  operatorAttention: boolean
  operatorAttentionReason: string | null
  lastCrawlStatus: string | null
  consecutiveErrorCount: number
  crawlCandidateCount: number
  crawlProcessedCount: number
  crawlSkippedCount: number
  crawlFetchErrorCount: number
  crawlLlmFailedCount: number
  nextAllowedCrawlAt: string | null
  lastCrawlFinishedAt: string | null
  subscriberCount: number
  hints: {
    httpStatus: number | null
    retryAfter: string | null
    cacheControl: string | null
  }
}

type OperatorResponse = {
  filter: OperatorFilter
  summary: {
    totalSources: number
    needingAttention: number
    failing: number
    degraded: number
    totalRecentCandidates: number
    totalRecentProcessed: number
    totalRecentFetchErrors: number
    totalRecentLlmFailures: number
  }
  items: OperatorItem[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const activeFilter = computed<OperatorFilter>(() => {
  const raw = String(route.query.filter ?? 'all')
  return ['all', 'attention', 'failing_degraded', 'needs_setup', 'blocked', 'quiet'].includes(raw)
    ? (raw as OperatorFilter)
    : 'all'
})

const { data, error, refresh } = await useFetch<OperatorResponse>('/api/operator/source-statuses', {
  key: 'operator-source-statuses',
  credentials: 'include',
  query: computed(() => ({ filter: activeFilter.value })),
})

if (error.value) {
  const parsed = parseFetchError(error.value)
  throw createError({
    statusCode: parsed.statusCode ?? 500,
    statusMessage: parsed.message || t('operatorSources.errorLoad'),
  })
}

const summary = computed(
  () =>
    data.value?.summary ?? {
      totalSources: 0,
      needingAttention: 0,
      failing: 0,
      degraded: 0,
      totalRecentCandidates: 0,
      totalRecentProcessed: 0,
      totalRecentFetchErrors: 0,
      totalRecentLlmFailures: 0,
    },
)
const rows = computed(() => data.value?.items ?? [])

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

async function setFilter(filter: OperatorFilter) {
  if (filter === activeFilter.value) return
  await router.replace({ query: { ...route.query, filter } })
  await refresh()
}
</script>

<template>
  <main class="mx-auto w-full max-w-[1400px] p-4 md:p-6">
    <header class="mb-4">
      <h1 class="text-2xl font-semibold">{{ t('operatorSources.title') }}</h1>
      <p class="text-sm opacity-80">{{ t('operatorSources.intro') }}</p>
    </header>

    <section class="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-total">
        <div class="stat-title">{{ t('operatorSources.summary.totalSources') }}</div>
        <div class="stat-value text-2xl">{{ summary.totalSources }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-attention">
        <div class="stat-title">{{ t('operatorSources.summary.needingAttention') }}</div>
        <div class="stat-value text-2xl">{{ summary.needingAttention }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-failing">
        <div class="stat-title">{{ t('operatorSources.summary.failing') }}</div>
        <div class="stat-value text-2xl">{{ summary.failing }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-degraded">
        <div class="stat-title">{{ t('operatorSources.summary.degraded') }}</div>
        <div class="stat-value text-2xl">{{ summary.degraded }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-candidates">
        <div class="stat-title">{{ t('operatorSources.summary.totalRecentCandidates') }}</div>
        <div class="stat-value text-2xl">{{ summary.totalRecentCandidates }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-processed">
        <div class="stat-title">{{ t('operatorSources.summary.totalRecentProcessed') }}</div>
        <div class="stat-value text-2xl">{{ summary.totalRecentProcessed }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-fetch-errors">
        <div class="stat-title">{{ t('operatorSources.summary.totalRecentFetchErrors') }}</div>
        <div class="stat-value text-2xl">{{ summary.totalRecentFetchErrors }}</div>
      </div>
      <div class="stat rounded-box border bg-base-100 p-3" data-testid="operator-summary-llm-failures">
        <div class="stat-title">{{ t('operatorSources.summary.totalRecentLlmFailures') }}</div>
        <div class="stat-value text-2xl">{{ summary.totalRecentLlmFailures }}</div>
      </div>
    </section>

    <section class="mb-4">
      <div class="tabs tabs-boxed w-full flex-wrap gap-1">
        <button
          class="tab"
          data-testid="operator-filter-all"
          :class="{ 'tab-active': activeFilter === 'all' }"
          @click="setFilter('all')"
        >
          {{ t('operatorSources.filters.all') }}
        </button>
        <button
          class="tab"
          data-testid="operator-filter-attention"
          :class="{ 'tab-active': activeFilter === 'attention' }"
          @click="setFilter('attention')"
        >
          {{ t('operatorSources.filters.attention') }}
        </button>
        <button
          class="tab"
          data-testid="operator-filter-failing-degraded"
          :class="{ 'tab-active': activeFilter === 'failing_degraded' }"
          @click="setFilter('failing_degraded')"
        >
          {{ t('operatorSources.filters.failingDegraded') }}
        </button>
        <button
          class="tab"
          data-testid="operator-filter-needs-setup"
          :class="{ 'tab-active': activeFilter === 'needs_setup' }"
          @click="setFilter('needs_setup')"
        >
          {{ t('operatorSources.filters.needsSetup') }}
        </button>
        <button
          class="tab"
          data-testid="operator-filter-blocked"
          :class="{ 'tab-active': activeFilter === 'blocked' }"
          @click="setFilter('blocked')"
        >
          {{ t('operatorSources.filters.blocked') }}
        </button>
        <button
          class="tab"
          data-testid="operator-filter-quiet"
          :class="{ 'tab-active': activeFilter === 'quiet' }"
          @click="setFilter('quiet')"
        >
          {{ t('operatorSources.filters.quiet') }}
        </button>
      </div>
    </section>

    <section class="overflow-x-auto rounded-box border bg-base-100">
      <table class="table table-zebra table-sm" data-testid="operator-sources-table">
        <thead>
          <tr>
            <th>{{ t('operatorSources.columns.source') }}</th>
            <th>{{ t('operatorSources.columns.type') }}</th>
            <th>{{ t('operatorSources.columns.health') }}</th>
            <th>{{ t('operatorSources.columns.attentionReason') }}</th>
            <th>{{ t('operatorSources.columns.lastCrawlStatus') }}</th>
            <th>{{ t('operatorSources.columns.consecutiveErrors') }}</th>
            <th>{{ t('operatorSources.columns.candidates') }}</th>
            <th>{{ t('operatorSources.columns.processed') }}</th>
            <th>{{ t('operatorSources.columns.skipped') }}</th>
            <th>{{ t('operatorSources.columns.fetchErrors') }}</th>
            <th>{{ t('operatorSources.columns.llmFailures') }}</th>
            <th>{{ t('operatorSources.columns.nextAllowed') }}</th>
            <th>{{ t('operatorSources.columns.hints') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.crawlKey" :data-health="normalizeSourceHealthKey(row.sourceHealthStatus) ?? 'unknown'">
            <td>
              <div class="font-medium">{{ row.sourceName }}</div>
              <div class="text-xs opacity-70">{{ row.crawlKey }}</div>
              <div class="text-xs opacity-70">
                {{ t('operatorSources.subscribers', { count: row.subscriberCount }) }}
              </div>
            </td>
            <td>{{ row.sourceType || '—' }}</td>
            <td>
              <span class="inline-flex items-center gap-2">
                <span :class="sourceHealthStatusDotClass(normalizeSourceHealthKey(row.sourceHealthStatus))" />
                <span>{{ row.sourceHealthStatus || '—' }}</span>
              </span>
            </td>
            <td>
              <div v-if="row.operatorAttention" class="badge badge-error badge-sm">
                {{ t('operatorSources.attention') }}
              </div>
              <div class="text-xs">{{ row.operatorAttentionReason || row.sourceHealthReason || '—' }}</div>
            </td>
            <td>{{ row.lastCrawlStatus || '—' }}</td>
            <td>{{ row.consecutiveErrorCount }}</td>
            <td>{{ row.crawlCandidateCount }}</td>
            <td>{{ row.crawlProcessedCount }}</td>
            <td>{{ row.crawlSkippedCount }}</td>
            <td>{{ row.crawlFetchErrorCount }}</td>
            <td>{{ row.crawlLlmFailedCount }}</td>
            <td>{{ fmtDate(row.nextAllowedCrawlAt) }}</td>
            <td class="text-xs">
              <div>HTTP: {{ row.hints.httpStatus ?? '—' }}</div>
              <div>Retry-After: {{ row.hints.retryAfter ?? '—' }}</div>
              <div>Cache: {{ row.hints.cacheControl ?? '—' }}</div>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="13" class="text-center text-sm opacity-70">{{ t('operatorSources.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

