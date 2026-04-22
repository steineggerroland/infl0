<script setup lang="ts">
import { parseFetchError } from '~/utils/parse-fetch-error'
import { scoreDirection } from '~/utils/score-indicator'

definePageMeta({
  layout: 'app',
  appFooter: { containerMax: '4xl', testId: 'settings-page-footer' },
})

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
  if (dir === 'positive') return 'text-emerald-300/95'
  if (dir === 'negative') return 'text-amber-300/95'
  if (dir === 'neutral') return 'text-gray-300'
  return 'text-gray-400'
}

function contributionClass(contribution: number) {
  const dir = scoreDirection(contribution)
  if (dir === 'positive') return 'text-emerald-300/90'
  if (dir === 'negative') return 'text-amber-300/90'
  return 'text-gray-400'
}

function directionLabel(value: number | null | undefined) {
  return t(`settingsPersonalization.directions.${scoreDirection(value)}`)
}
</script>

<template>
  <div class="min-h-dvh bg-gray-400 pb-24 pt-14 text-gray-100">
    <div class="mx-auto w-full max-w-4xl px-4">
      <header class="mb-8 text-center text-gray-900">
        <h1 class="text-2xl font-semibold">{{ $t('settingsPersonalization.title') }}</h1>
        <p class="mt-2 text-sm text-gray-800">
          {{ $t('settingsPersonalization.intro') }}
        </p>
        <p v-if="data?.generatedAt" class="mt-1 text-xs text-gray-600">
          {{ $t('settingsPersonalization.generatedAt') }} {{ data.generatedAt }}
        </p>
      </header>

      <div v-if="pending" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-lg text-gray-800" />
      </div>

      <div v-else-if="data" class="space-y-10">
        <section class="rounded-xl border border-gray-700 bg-gray-900/95 p-5 shadow-xl">
          <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
            {{ $t('settingsPersonalization.algorithmTitle') }}
          </h2>
          <p class="text-sm leading-relaxed text-gray-300">
            {{ $t('settingsPersonalization.algorithmBody') }}
          </p>
          <dl class="mt-4 grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
            <div>
              <dt class="font-medium text-gray-500">
                {{ $t('settingsPersonalization.priorLabel') }}
              </dt>
              <dd>
                α={{ data.engagementModel.prior.alpha }}, β={{ data.engagementModel.prior.beta }}
              </dd>
            </div>
            <div>
              <dt class="font-medium text-gray-500">
                {{ $t('settingsPersonalization.blendLabel') }}
              </dt>
              <dd>
                {{ $t('settingsPersonalization.blendSources') }} {{ fmt(data.engagementModel.blend.feed, 2) }},
                {{ $t('settingsPersonalization.blendCategories') }}
                {{ fmt(data.engagementModel.blend.category, 2) }}, {{ $t('settingsPersonalization.blendTags') }}
                {{ fmt(data.engagementModel.blend.tag, 2) }}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-800">
            {{ $t('settingsPersonalization.timelineHeading') }}
          </h2>
          <ul class="space-y-2">
            <li
              v-for="row in data.timeline"
              :key="row.timelineItemId"
              class="overflow-hidden rounded-xl border border-gray-700 bg-gray-900/95 shadow-lg"
            >
              <button
                type="button"
                class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-800/80"
                @click="toggleRow(row.timelineItemId)"
              >
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-gray-100">
                    {{ row.title }}
                  </div>
                  <p class="mt-1 line-clamp-2 text-xs text-gray-400">
                    {{ row.teaserPreview || '—' }}
                  </p>
                </div>
                <div class="shrink-0 text-end">
                  <div class="font-mono text-sm text-emerald-300/95">
                    {{ row.rankScore != null ? fmt(row.rankScore, 4) : '—' }}
                  </div>
                  <div class="text-[0.65rem] text-gray-500">
                    {{ expandedId === row.timelineItemId ? '▼' : '▶' }}
                  </div>
                </div>
              </button>

              <div
                v-show="expandedId === row.timelineItemId"
                class="border-t border-gray-700/80 px-4 py-4 text-sm text-gray-300"
              >
                <div class="mb-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <h3 class="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {{ $t('settingsPersonalization.rankStored') }}
                    </h3>
                    <p class="font-mono text-lg text-emerald-300/95">
                      {{ row.rankScore != null ? fmt(row.rankScore, 4) : '—' }}
                    </p>
                  </div>
                  <div>
                    <h3 class="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {{ $t('settingsPersonalization.rankLive') }}
                    </h3>
                    <p class="font-mono text-lg text-emerald-300/95">
                      {{ fmt(row.rankScoreFromFactors, 4) }}
                    </p>
                  </div>
                  <div>
                    <h3 class="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {{ $t('settingsPersonalization.rankDelta') }}
                    </h3>
                    <!--
                      `<ScoreDelta>` renders the three redundant
                      cues (signed number, aria-hidden glyph,
                      sr-only direction label) so colour stays a
                      purely decorative fourth layer. Colour is
                      applied via `deltaClass` on this `<p>`.
                    -->
                    <p
                      class="font-mono text-lg tabular-nums"
                      :class="deltaClass(rankDelta(row))"
                    >
                      <ScoreDelta
                        :value="rankDelta(row)"
                        :sr-label="directionLabel(rankDelta(row))"
                      />
                    </p>
                  </div>
                </div>

                <h3 class="mb-2 text-xs font-semibold uppercase text-gray-500">
                  {{ $t('settingsPersonalization.factorsHeading') }}
                </h3>
                <div class="overflow-x-auto">
                  <table class="table table-sm w-full text-xs">
                    <thead>
                      <tr class="border-gray-700 text-gray-400">
                        <th>{{ $t('settingsPersonalization.colFactor') }}</th>
                        <th class="text-end">{{ $t('settingsPersonalization.colNormalizedSimple') }}</th>
                        <th class="text-end">{{ $t('settingsPersonalization.colWeightSimple') }}</th>
                        <th class="text-end">{{ $t('settingsPersonalization.colContributionSimple') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="f in row.factors" :key="f.id" class="border-gray-800">
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

                <h3 class="mb-2 mt-6 text-xs font-semibold uppercase text-gray-500">
                  {{ $t('settingsPersonalization.engagementHeading') }}
                </h3>
                <p class="mb-2 text-xs text-gray-500">
                  {{ $t('settingsPersonalization.engagementIntro') }}
                </p>
                <div class="space-y-3 text-xs">
                  <div class="rounded-lg bg-gray-950/60 p-3">
                    <div class="font-medium text-gray-200">
                      {{ $t('settingsPersonalization.feedSignal') }}
                    </div>
                    <div class="mt-2 grid gap-2 text-gray-400 sm:grid-cols-2">
                      <div>
                        <span class="text-gray-500">{{ $t('settingsPersonalization.sourceLabel') }}</span>
                        {{ row.engagement.feed.crawlKey }}
                      </div>
                      <div>
                        <span class="text-gray-500">{{ $t('settingsPersonalization.feedbackLabel') }}</span>
                        {{ row.engagement.feed.posPoints }} / {{ row.engagement.feed.negPoints }}
                      </div>
                      <div>
                        <span class="text-gray-500">{{ $t('settingsPersonalization.scoreLabel') }}</span>
                        +{{ fmt(row.engagement.feed.positiveScore, 4) }} / −{{
                          fmt(row.engagement.feed.negativeScore, 4)
                        }}
                      </div>
                      <div>
                        <span class="text-gray-500">{{ $t('settingsPersonalization.weightedLabel') }}</span>
                        +{{ fmt(row.engagement.feed.weightedPositive, 4) }} / −{{
                          fmt(row.engagement.feed.weightedNegative, 4)
                        }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="row.engagement.categories.length"
                    class="rounded-lg bg-gray-950/60 p-3"
                  >
                    <div class="font-medium text-gray-200">
                      {{ $t('settingsPersonalization.categoriesSignal') }}
                    </div>
                    <ul class="mt-2 space-y-1 text-gray-400">
                      <li v-for="c in row.engagement.categories" :key="c.name">
                        {{ c.name }} — +{{ fmt(c.positiveScore, 4) }} / −{{ fmt(c.negativeScore, 4) }}
                        ({{ $t('settingsPersonalization.feedbackShort') }} {{ c.posPoints }}/{{
                          c.negPoints
                        }})
                      </li>
                    </ul>
                    <p class="mt-2 text-gray-500">
                      {{ $t('settingsPersonalization.categoryAvg') }}
                      +{{ fmt(row.engagement.averages.categoryPositive, 4) }} / −{{
                        fmt(row.engagement.averages.categoryNegative, 4)
                      }}
                    </p>
                    <p class="mt-1 text-gray-500">
                      {{ $t('settingsPersonalization.categoryWeighted') }}
                      +{{ fmt(row.engagement.averages.categoryWeightedPositive, 4) }} / −{{
                        fmt(row.engagement.averages.categoryWeightedNegative, 4)
                      }}
                    </p>
                  </div>
                  <div v-if="row.engagement.tags.length" class="rounded-lg bg-gray-950/60 p-3">
                    <div class="font-medium text-gray-200">
                      {{ $t('settingsPersonalization.tagsSignal') }}
                    </div>
                    <ul class="mt-2 space-y-1 text-gray-400">
                      <li v-for="tg in row.engagement.tags" :key="tg.name">
                        {{ tg.name }} — +{{ fmt(tg.positiveScore, 4) }} / −{{ fmt(tg.negativeScore, 4) }}
                        ({{ $t('settingsPersonalization.feedbackShort') }} {{ tg.posPoints }}/{{
                          tg.negPoints
                        }})
                      </li>
                    </ul>
                    <p class="mt-2 text-gray-500">
                      {{ $t('settingsPersonalization.tagAvg') }}
                      +{{ fmt(row.engagement.averages.tagPositive, 4) }} / −{{
                        fmt(row.engagement.averages.tagNegative, 4)
                      }}
                    </p>
                    <p class="mt-1 text-gray-500">
                      {{ $t('settingsPersonalization.tagWeighted') }}
                      +{{ fmt(row.engagement.averages.tagWeightedPositive, 4) }} / −{{
                        fmt(row.engagement.averages.tagWeightedNegative, 4)
                      }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-gray-700/80 bg-gray-950/40 p-3 font-mono text-[0.8rem]">
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
