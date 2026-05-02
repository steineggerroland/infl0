<script setup lang="ts">
import { parseFetchError } from '~/utils/parse-fetch-error'
import { scoreDirection } from '~/utils/score-indicator'

const { t } = useI18n()
const requestFetch = useRequestFetch()

const { data, error, pending } = await useAsyncData(
  'personalization-dashboard',
  () =>
    requestFetch('/api/me/personalization-dashboard', {
      credentials: 'include',
    }),
)

watch(
  error,
  async (e) => {
    if (!e) return
    const { statusCode } = parseFetchError(e)
    if (statusCode === 401) {
      await navigateTo('/login')
    }
  },
  { immediate: true },
)

function factorLabel(id: string) {
  return t(`settingsTimeline.factors.${id}.label`)
}

function pieLabel(slice: { key: string; label: string }) {
  if (slice.key === '__other__') return t('settingsPersonalization.pieOther')
  return slice.label
}

const expandedId = ref<string | null>(null)

watch(
  data,
  (v) => {
    if (!v?.timeline?.length || expandedId.value) return
    expandedId.value = v.timeline[0]?.timelineItemId ?? null
  },
  { immediate: true },
)

function toggleRow(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function fmt(n: number, digits = 3) {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

function rankDelta(row: { rankScore: number | null; rankScoreFromFactors: number }) {
  if (row.rankScore == null) return null
  return row.rankScoreFromFactors - row.rankScore
}

// Colour is one of three redundant signals for score deltas; the
// other two are the signed number itself (`+0.0123` / `-0.0456`)
// and the shape-based glyph rendered in the template (▲/▼/·/—).
// See `utils/score-indicator.ts` and
// `docs/CONTENT_AND_A11Y.md` (Colour & contrast).
function deltaClass(delta: number | null) {
  const dir = scoreDirection(delta)
  if (dir === 'positive') return 'infl0-delta-positive'
  if (dir === 'negative') return 'infl0-delta-negative'
  if (dir === 'neutral') return 'infl0-panel-muted'
  return 'infl0-panel-muted'
}

function contributionClass(contribution: number) {
  const dir = scoreDirection(contribution)
  if (dir === 'positive') return 'infl0-delta-positive'
  if (dir === 'negative') return 'infl0-delta-negative'
  return 'infl0-panel-muted'
}

function directionLabel(value: number | null | undefined) {
  return t(`settingsPersonalization.directions.${scoreDirection(value)}`)
}
</script>

<template>
  <div class="w-full pb-8">
    <div class="mx-auto w-full max-w-4xl">
      <header class="mb-8 text-center">
        <h2 id="settings-personalization-heading" class="infl0-canvas-fg text-2xl font-semibold">{{ $t('settingsPersonalization.title') }}</h2>
        <p class="infl0-canvas-muted mt-2 text-sm">
          {{ $t('settingsPersonalization.intro') }}
        </p>
        <p v-if="data?.generatedAt" class="infl0-canvas-muted mt-1 text-xs">
          {{ $t('settingsPersonalization.generatedAt') }} {{ data.generatedAt }}
        </p>
      </header>

      <div v-if="pending" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg text-[var(--infl0-canvas-fg-muted)]" />
      </div>

      <div v-else-if="data" class="space-y-10">
        <section class="infl0-panel p-5">
          <h2 class="infl0-section-label mb-2 text-sm font-semibold uppercase tracking-wide">
            {{ $t('settingsPersonalization.algorithmTitle') }}
          </h2>
          <p class="text-sm leading-relaxed text-[var(--infl0-panel-text)]">
            {{ $t('settingsPersonalization.algorithmBody') }}
          </p>
          <div
            class="stats stats-vertical mt-4 w-full rounded-box border border-[var(--infl0-panel-border)] bg-[var(--infl0-nested-surface)] lg:stats-horizontal"
            data-testid="personalization-algorithm-stats"
          >
            <div class="stat place-items-start px-4 py-3">
              <div class="stat-title infl0-panel-muted">
                {{ $t('settingsPersonalization.priorLabel') }}
              </div>
              <div class="stat-value shrink-0 text-lg font-mono font-normal text-[var(--infl0-panel-text)]">
                α={{ data.engagementModel.prior.alpha }}, β={{ data.engagementModel.prior.beta }}
              </div>
            </div>
            <div class="stat place-items-start px-4 py-3">
              <div class="stat-title infl0-panel-muted">
                {{ $t('settingsPersonalization.blendLabel') }}
              </div>
              <div
                class="stat-value !whitespace-normal max-w-none text-sm leading-snug font-mono font-normal text-[var(--infl0-panel-text)]"
              >
                {{ $t('settingsPersonalization.blendSources') }} {{ fmt(data.engagementModel.blend.feed, 2) }},
                {{ $t('settingsPersonalization.blendCategories') }}
                {{ fmt(data.engagementModel.blend.category, 2) }}, {{ $t('settingsPersonalization.blendTags') }}
                {{ fmt(data.engagementModel.blend.tag, 2) }}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 class="infl0-canvas-fg mb-3 text-sm font-semibold uppercase tracking-wide">
            {{ $t('settingsPersonalization.timelineHeading') }}
          </h2>
          <ul class="space-y-2">
            <li
              v-for="row in data.timeline"
              :key="row.timelineItemId"
              class="infl0-panel--flush"
            >
              <button
                type="button"
                class="hover:bg-[var(--infl0-surface-dim)] flex w-full items-start gap-3 px-4 py-3 text-left text-[var(--infl0-panel-text)] transition-colors"
                @click="toggleRow(row.timelineItemId)"
              >
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium">
                    {{ row.title }}
                  </div>
                  <p class="infl0-panel-muted mt-1 line-clamp-2 text-xs">
                    {{ row.teaserPreview || '—' }}
                  </p>
                </div>
                <div class="shrink-0 text-end">
                  <div class="font-mono text-sm text-[var(--infl0-panel-text)]">
                    {{ row.rankScore != null ? fmt(row.rankScore, 4) : '—' }}
                  </div>
                  <div class="infl0-panel-muted text-[0.65rem]">
                    {{ expandedId === row.timelineItemId ? '▼' : '▶' }}
                  </div>
                </div>
              </button>

              <div
                v-show="expandedId === row.timelineItemId"
                class="border-t border-[var(--infl0-panel-border)]/80 px-4 py-4 text-sm text-[var(--infl0-panel-text)]"
              >
                <div
                  class="stats stats-vertical mb-4 w-full rounded-box border border-[var(--infl0-panel-border)] bg-[var(--infl0-surface-dim)] shadow-sm lg:stats-horizontal"
                  data-testid="personalization-rank-stats"
                >
                  <div class="stat place-items-start px-2 py-2 sm:px-4">
                    <div class="stat-title text-[0.65rem] font-semibold uppercase infl0-panel-muted">
                      {{ $t('settingsPersonalization.rankStored') }}
                    </div>
                    <div class="stat-value font-mono text-xl font-normal text-[var(--infl0-panel-text)]">
                      {{ row.rankScore != null ? fmt(row.rankScore, 4) : '—' }}
                    </div>
                  </div>
                  <div class="stat place-items-start px-2 py-2 sm:px-4">
                    <div class="stat-title text-[0.65rem] font-semibold uppercase infl0-panel-muted">
                      {{ $t('settingsPersonalization.rankLive') }}
                    </div>
                    <div class="stat-value font-mono text-xl font-normal text-[var(--infl0-panel-text)]">
                      {{ fmt(row.rankScoreFromFactors, 4) }}
                    </div>
                  </div>
                  <div class="stat place-items-start px-2 py-2 sm:px-4">
                    <div class="stat-title text-[0.65rem] font-semibold uppercase infl0-panel-muted">
                      {{ $t('settingsPersonalization.rankDelta') }}
                    </div>
                    <!--
                      `<ScoreDelta>`: colour only decorative fourth layer alongside
                      numeric + sr-only direction cues.
                    -->
                    <div
                      class="stat-value font-mono text-xl tabular-nums font-normal"
                      :class="deltaClass(rankDelta(row))"
                    >
                      <ScoreDelta
                        :value="rankDelta(row)"
                        :sr-label="directionLabel(rankDelta(row))"
                      />
                    </div>
                  </div>
                </div>

                <h3 class="infl0-panel-muted mb-2 text-xs font-semibold uppercase">
                  {{ $t('settingsPersonalization.factorsHeading') }}
                </h3>
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full text-xs">
                    <thead>
                      <tr class="border-[var(--infl0-panel-border)] text-[var(--infl0-panel-text-muted)]">
                        <th>{{ $t('settingsPersonalization.colFactor') }}</th>
                        <th class="text-end">{{ $t('settingsPersonalization.colNormalizedSimple') }}</th>
                        <th class="text-end">{{ $t('settingsPersonalization.colWeightSimple') }}</th>
                        <th class="text-end">{{ $t('settingsPersonalization.colContributionSimple') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="f in row.factors"
                        :key="f.id"
                        class="border-[var(--infl0-panel-border)]/60"
                      >
                        <td>{{ factorLabel(f.id) }}</td>
                        <td class="text-end font-mono">{{ fmt(f.normalized, 4) }}</td>
                        <td class="text-end font-mono">{{ f.weight }}</td>
                        <td class="text-end font-mono" :class="contributionClass(f.contribution)">
                          <ScoreDelta
                            :value="f.contribution"
                            :sr-label="directionLabel(f.contribution)"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 class="infl0-panel-muted mb-2 mt-6 text-xs font-semibold uppercase">
                  {{ $t('settingsPersonalization.engagementHeading') }}
                </h3>
                <p class="infl0-panel-muted mb-2 text-xs">
                  {{ $t('settingsPersonalization.engagementIntro') }}
                </p>
                <div class="space-y-3 text-xs">
                  <div class="infl0-nested-slab">
                    <div class="font-medium text-[var(--infl0-panel-text)]">
                      {{ $t('settingsPersonalization.feedSignal') }}
                    </div>
                    <div class="infl0-panel-muted mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <span class="infl0-section-label">{{ $t('settingsPersonalization.sourceLabel') }}</span>
                        {{ row.engagement.feed.crawlKey }}
                      </div>
                      <div>
                        <span class="infl0-section-label">{{ $t('settingsPersonalization.feedbackLabel') }}</span>
                        {{ row.engagement.feed.posPoints }} / {{ row.engagement.feed.negPoints }}
                      </div>
                      <div>
                        <span class="infl0-section-label">{{ $t('settingsPersonalization.scoreLabel') }}</span>
                        +{{ fmt(row.engagement.feed.positiveScore, 4) }} / −{{
                          fmt(row.engagement.feed.negativeScore, 4)
                        }}
                      </div>
                      <div>
                        <span class="infl0-section-label">{{ $t('settingsPersonalization.weightedLabel') }}</span>
                        +{{ fmt(row.engagement.feed.weightedPositive, 4) }} / −{{
                          fmt(row.engagement.feed.weightedNegative, 4)
                        }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="row.engagement.categories.length"
                    class="infl0-nested-slab"
                  >
                    <div class="font-medium text-[var(--infl0-panel-text)]">
                      {{ $t('settingsPersonalization.categoriesSignal') }}
                    </div>
                    <ul class="infl0-panel-muted mt-2 space-y-1">
                      <li v-for="c in row.engagement.categories" :key="c.name">
                        {{ c.name }} — +{{ fmt(c.positiveScore, 4) }} / −{{ fmt(c.negativeScore, 4) }}
                        ({{ $t('settingsPersonalization.feedbackShort') }} {{ c.posPoints }}/{{
                          c.negPoints
                        }})
                      </li>
                    </ul>
                    <p class="infl0-panel-muted mt-2">
                      {{ $t('settingsPersonalization.categoryAvg') }}
                      +{{ fmt(row.engagement.averages.categoryPositive, 4) }} / −{{
                        fmt(row.engagement.averages.categoryNegative, 4)
                      }}
                    </p>
                    <p class="infl0-panel-muted mt-1">
                      {{ $t('settingsPersonalization.categoryWeighted') }}
                      +{{ fmt(row.engagement.averages.categoryWeightedPositive, 4) }} / −{{
                        fmt(row.engagement.averages.categoryWeightedNegative, 4)
                      }}
                    </p>
                  </div>
                  <div v-if="row.engagement.tags.length" class="infl0-nested-slab">
                    <div class="font-medium text-[var(--infl0-panel-text)]">
                      {{ $t('settingsPersonalization.tagsSignal') }}
                    </div>
                    <ul class="infl0-panel-muted mt-2 space-y-1">
                      <li v-for="tg in row.engagement.tags" :key="tg.name">
                        {{ tg.name }} — +{{ fmt(tg.positiveScore, 4) }} / −{{ fmt(tg.negativeScore, 4) }}
                        ({{ $t('settingsPersonalization.feedbackShort') }} {{ tg.posPoints }}/{{
                          tg.negPoints
                        }})
                      </li>
                    </ul>
                    <p class="infl0-panel-muted mt-2">
                      {{ $t('settingsPersonalization.tagAvg') }}
                      +{{ fmt(row.engagement.averages.tagPositive, 4) }} / −{{
                        fmt(row.engagement.averages.tagNegative, 4)
                      }}
                    </p>
                    <p class="infl0-panel-muted mt-1">
                      {{ $t('settingsPersonalization.tagWeighted') }}
                      +{{ fmt(row.engagement.averages.tagWeightedPositive, 4) }} / −{{
                        fmt(row.engagement.averages.tagWeightedNegative, 4)
                      }}
                    </p>
                  </div>
                  <div class="infl0-code-well p-3 font-mono text-[0.8rem] text-[var(--infl0-panel-text)]">
                    <div>
                      {{ $t('settingsPersonalization.finalInterestUp') }}
                      {{ fmt(row.engagement.combinedPositive, 4) }}
                    </div>
                    <div>
                      {{ $t('settingsPersonalization.finalInterestDown') }}
                      {{ fmt(row.engagement.combinedNegative, 4) }}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <div class="grid gap-6 lg:grid-cols-3">
          <PersonalizationPie
            :title="$t('settingsPersonalization.feedsPieTitle')"
            :slices="data.pies.feeds"
            :label-resolver="pieLabel"
          />
          <PersonalizationPie
            :title="$t('settingsPersonalization.categoriesPieTitle')"
            :slices="data.pies.categories"
            :label-resolver="pieLabel"
          />
          <PersonalizationPie
            :title="$t('settingsPersonalization.tagsPieTitle')"
            :slices="data.pies.tags"
            :label-resolver="pieLabel"
          />
        </div>
      </div>
    </div>
  </div>
</template>
