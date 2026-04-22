<script setup lang="ts">
/**
 * `/settings` is the direct-access settings surface. No hub, no extra click.
 *
 * It currently hosts two behaviour groups — the sorting weights and the
 * engagement-tracking consent. Both used to live on their own page
 * (`/settings/timeline-score`, `/settings/privacy`); consolidating them
 * here is the product call from the navigation re-design. The readability
 * settings (theme, motion, font size per surface) will join as a third
 * section in the next baustein.
 */
import {
  TIMELINE_SCORE_FACTOR_DEFS,
  type TimelineScoreFactorGroup,
} from '~/utils/timeline-score-factors'

definePageMeta({
  layout: 'app',
  appFooter: { testId: 'settings-page-footer' },
})

const { t } = useI18n()

const { weights, contentLengthPreference, resetWeights, formulaLines } = useTimelineScoreWeights()

const GROUP_ORDER: TimelineScoreFactorGroup[] = ['time', 'content', 'mix', 'feedback']

function factorsForGroup(g: TimelineScoreFactorGroup) {
  return TIMELINE_SCORE_FACTOR_DEFS.filter((d) => d.group === g)
}

function factorLabel(id: string) {
  return t(`settingsTimeline.factors.${id}.label`)
}

function factorHint(id: string) {
  return t(`settingsTimeline.factors.${id}.hint`)
}

const {
  enabled: trackingEnabled,
  loaded: trackingLoaded,
  ensureLoaded: ensureTrackingLoaded,
  setEnabled: setTrackingEnabled,
} = useEngagementTrackingPrefs()
const trackingBusy = ref(false)

onMounted(async () => {
  await ensureTrackingLoaded()
})

async function onTrackingToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  trackingBusy.value = true
  try {
    await setTrackingEnabled(checked)
  } finally {
    trackingBusy.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-gray-400 text-gray-100 pb-16 pt-16">
    <div class="mx-auto w-full max-w-lg px-4">
      <header class="mb-10 text-center text-gray-900">
        <h1 class="text-2xl font-semibold">{{ t('settingsIndex.title') }}</h1>
        <p class="mt-2 text-sm text-gray-800">
          {{ t('settingsIndex.intro') }}
        </p>
      </header>

      <!--
        Sorting weights. The h2 here is the section label; each
        factor group inside is an h3 so screen-reader outline mirrors
        the "Einstellungen → Sortierung → einzelne Gruppen" nesting.
      -->
      <section aria-labelledby="settings-sorting-heading" class="mb-10">
        <header class="mb-4 text-center text-gray-900">
          <h2 id="settings-sorting-heading" class="text-lg font-semibold">
            {{ t('settingsTimeline.title') }}
          </h2>
          <p class="mt-1 text-sm text-gray-800">
            {{ t('settingsTimeline.intro') }}
          </p>
        </header>

        <div
          v-for="g in GROUP_ORDER"
          :key="g"
          class="mb-4 rounded-xl border border-gray-700 bg-gray-900/95 p-5 shadow-xl"
        >
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            {{ t(`settingsTimeline.groups.${g}`) }}
          </h3>
          <ul class="list-none space-y-6">
            <template v-for="d in factorsForGroup(g)" :key="d.id">
              <li class="space-y-2">
                <div class="flex items-end justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <label class="text-sm font-medium text-gray-200" :for="`w-${d.id}`">{{
                      factorLabel(d.id)
                    }}</label>
                    <p class="mt-0.5 text-xs leading-snug text-gray-500">
                      {{ factorHint(d.id) }}
                    </p>
                  </div>
                  <span class="shrink-0 tabular-nums text-sm text-gray-400">{{ weights[d.id] }}</span>
                </div>
                <input
                  :id="`w-${d.id}`"
                  v-model.number="weights[d.id]"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  class="range range-primary range-sm w-full"
                >
              </li>
              <li
                v-if="d.id === 'content_length'"
                class="space-y-2 border-t border-gray-700/80 pt-4"
              >
                <div class="flex items-end justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <label class="text-sm font-medium text-gray-200" for="content-length-pref">{{
                      t('settingsTimeline.contentLengthPreference.label')
                    }}</label>
                    <p class="mt-0.5 text-xs leading-snug text-gray-500">
                      {{ t('settingsTimeline.contentLengthPreference.hint') }}
                    </p>
                  </div>
                  <span class="shrink-0 tabular-nums text-sm text-gray-400">{{
                    contentLengthPreference
                  }}</span>
                </div>
                <div class="flex justify-between px-0.5 text-[0.65rem] font-medium text-gray-500">
                  <span>{{ t('settingsTimeline.contentLengthPreference.preferShorter') }}</span>
                  <span>{{ t('settingsTimeline.contentLengthPreference.neutral') }}</span>
                  <span>{{ t('settingsTimeline.contentLengthPreference.preferLonger') }}</span>
                </div>
                <input
                  id="content-length-pref"
                  v-model.number="contentLengthPreference"
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  class="range range-primary range-sm w-full"
                >
              </li>
            </template>
          </ul>
        </div>

        <div class="mb-4 rounded-xl border border-gray-700 bg-gray-900/95 p-5 shadow-xl">
          <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
            {{ t('settingsTimeline.formulaTitle') }}
          </h3>
          <p class="mb-3 text-xs text-gray-500">
            {{ t('settingsTimeline.formulaHint') }}
          </p>
          <pre
            class="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-gray-950 p-3 text-xs leading-relaxed text-emerald-300/95"
          >{{ formulaLines }}</pre>
        </div>

        <div class="flex justify-center">
          <button type="button" class="btn btn-outline border-gray-600 text-gray-200" @click="resetWeights">
            {{ t('settingsTimeline.reset') }}
          </button>
        </div>
      </section>

      <!--
        Engagement tracking. The `id="tracking"` exists so the
        /settings/privacy info page can deep-link here; changing the
        hash is a soft contract the info-page content references.
      -->
      <section
        id="tracking"
        aria-labelledby="settings-tracking-heading"
        class="mb-4"
      >
        <header class="mb-4 text-center text-gray-900">
          <h2 id="settings-tracking-heading" class="text-lg font-semibold">
            {{ t('settingsIndex.trackingHeading') }}
          </h2>
          <p class="mt-1 text-sm text-gray-800">
            {{ t('settingsIndex.trackingIntro') }}
          </p>
        </header>

        <div
          class="rounded-xl border border-gray-700 bg-gray-900/95 p-5 shadow-xl"
          :aria-busy="trackingBusy || !trackingLoaded"
        >
          <label class="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              class="toggle toggle-primary mt-0.5 shrink-0"
              :checked="trackingEnabled"
              :disabled="!trackingLoaded || trackingBusy"
              data-testid="tracking-toggle"
              @change="onTrackingToggle"
            >
            <span class="min-w-0">
              <span class="block text-sm font-medium text-gray-200">{{
                t('settingsIndex.trackingLabel')
              }}</span>
              <span class="mt-1 block text-xs leading-snug text-gray-500">{{
                t('settingsIndex.trackingHint')
              }}</span>
            </span>
          </label>
        </div>
      </section>
    </div>
  </div>
</template>
