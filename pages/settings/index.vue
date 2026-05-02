<script setup lang="ts">
/**
 * `/settings` is the direct-access settings surface. No hub, no extra click.
 *
 * Appearance: light/dark, colour palette (theme preview only while focus
 * stays in the block), then font & size (and for custom, colours) per
 * card face or reader, and motion. Also: sorting weights and reading
 * behaviour.
 */
import {
  TIMELINE_SCORE_FACTOR_DEFS,
  type TimelineScoreFactorGroup,
} from '~/utils/timeline-score-factors'
import type { SurfaceId } from '~/utils/ui-prefs'

const DISPLAY_SURFACES: SurfaceId[] = ['card-front', 'card-back', 'reader']

definePageMeta({
  layout: 'settings',
  appFooter: { containerMax: '4xl', testId: 'settings-page-footer' },
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

// Onboarding cards visibility — single boolean on uiPrefs, kept in
// lock-step with the *Skip introduction* button on the intro card via
// the same useUiPrefs reactive state. The toggle is "show", so the
// internal `onboardingHidden` value is inverted for the checkbox.
const { prefs: uiPrefs, update: updateUiPrefs } = useUiPrefs()
const onboardingVisible = computed(() => !uiPrefs.value.onboardingHidden)

function onOnboardingToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  updateUiPrefs({ onboardingHidden: !checked })
}
</script>

<template>
  <div class="infl0-page-shell px-4 pb-24 pt-16">
    <div class="mx-auto w-full max-w-lg">
      <header class="mb-10 text-center">
        <h1 class="infl0-canvas-fg text-2xl font-semibold">{{ t('settingsIndex.title') }}</h1>
        <p class="infl0-canvas-muted mt-2 text-sm">
          {{ t('settingsIndex.intro') }}
        </p>
      </header>

      <section
        id="display"
        aria-labelledby="settings-display-heading"
        class="scroll-mt-24 mb-10"
      >
        <header class="mb-4 text-center">
          <h2 id="settings-display-heading" class="infl0-canvas-fg text-lg font-semibold">
            {{ t('settingsDisplay.heading') }}
          </h2>
          <p class="infl0-canvas-muted mt-1 text-sm">
            {{ t('settingsDisplay.intro') }}
          </p>
        </header>

        <div class="infl0-panel space-y-6 p-5">
          <SettingsDisplayThemeBlock />
          <div class="border-t border-[var(--infl0-panel-border)] pt-5">
            <p class="infl0-canvas-muted mb-6 text-xs leading-snug">
              {{ t('settingsDisplay.typographyIntro') }}
            </p>
            <div class="space-y-0">
              <SettingsSurfaceDisplayGroup
                v-for="(sid, i) in DISPLAY_SURFACES"
                :key="sid"
                :surface-id="sid"
                :show-top-border="i > 0"
              />
            </div>
          </div>
          <div class="border-t border-[var(--infl0-panel-border)] pt-5">
            <SettingsMotionControl />
          </div>
        </div>
      </section>

      <!--
        Onboarding cards toggle: same state as the *Skip introduction*
        button on the intro card. Single boolean on uiPrefs.onboardingHidden,
        rendered as a "show" toggle here for consistency with the other
        on/off settings.
      -->
      <section
        id="onboarding"
        aria-labelledby="settings-onboarding-heading"
        class="scroll-mt-24 mb-10"
      >
        <header class="mb-4 text-center">
          <h2 id="settings-onboarding-heading" class="infl0-canvas-fg text-lg font-semibold">
            {{ t('settingsIndex.onboardingHeading') }}
          </h2>
          <p class="infl0-canvas-muted mt-1 text-sm">
            {{ t('settingsIndex.onboardingIntro') }}
          </p>
        </header>

        <div class="infl0-panel p-5">
          <label class="flex cursor-pointer items-start gap-4">
            <input
              type="checkbox"
              class="toggle toggle-primary mt-0.5 shrink-0"
              :checked="onboardingVisible"
              data-testid="onboarding-visible-toggle"
              @change="onOnboardingToggle"
            >
            <span class="min-w-0 text-[var(--infl0-panel-text)]">
              <span class="block text-sm font-medium">{{
                t('settingsIndex.onboardingLabel')
              }}</span>
              <span class="infl0-panel-muted mt-1 block text-xs leading-snug">{{
                t('settingsIndex.onboardingHint')
              }}</span>
            </span>
          </label>
        </div>
      </section>

      <!--
        Sorting weights. The h2 here is the section label; each
        factor group inside is an h3 so screen-reader outline mirrors
        the "Settings → Sorting → factor groups" nesting.
      -->
      <section id="sorting" aria-labelledby="settings-sorting-heading" class="scroll-mt-24 mb-10">
        <header class="mb-4 text-center">
          <h2 id="settings-sorting-heading" class="infl0-canvas-fg text-lg font-semibold">
            {{ t('settingsTimeline.title') }}
          </h2>
          <p class="infl0-canvas-muted mt-1 text-sm">
            {{ t('settingsTimeline.intro') }}
          </p>
        </header>

        <div
          v-for="g in GROUP_ORDER"
          :key="g"
          class="infl0-panel mb-4 p-5"
        >
          <h3 class="infl0-section-label mb-4 text-sm font-semibold uppercase tracking-wide">
            {{ t(`settingsTimeline.groups.${g}`) }}
          </h3>
          <ul class="list-none space-y-6">
            <template v-for="d in factorsForGroup(g)" :key="d.id">
              <li class="space-y-2">
                <div class="flex items-end justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <label class="text-sm font-medium" :for="`w-${d.id}`">{{
                      factorLabel(d.id)
                    }}</label>
                    <p class="infl0-panel-muted mt-0.5 text-xs leading-snug">
                      {{ factorHint(d.id) }}
                    </p>
                  </div>
                  <span class="infl0-section-label shrink-0 tabular-nums text-sm">{{ weights[d.id] }}</span>
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
                class="space-y-2 border-t border-[var(--infl0-panel-border)]/80 pt-4"
              >
                <div class="flex items-end justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <label class="text-sm font-medium" for="content-length-pref">{{
                      t('settingsTimeline.contentLengthPreference.label')
                    }}</label>
                    <p class="infl0-panel-muted mt-0.5 text-xs leading-snug">
                      {{ t('settingsTimeline.contentLengthPreference.hint') }}
                    </p>
                  </div>
                  <span class="infl0-section-label shrink-0 tabular-nums text-sm">{{
                    contentLengthPreference
                  }}</span>
                </div>
                <div class="infl0-panel-muted flex justify-between px-0.5 text-[0.65rem] font-medium">
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

        <div class="infl0-panel mb-4 p-5">
          <h3 class="infl0-section-label mb-2 text-sm font-semibold uppercase tracking-wide">
            {{ t('settingsTimeline.formulaTitle') }}
          </h3>
          <p class="infl0-panel-muted mb-3 text-xs">
            {{ t('settingsTimeline.formulaHint') }}
          </p>
          <pre
            class="overflow-x-auto whitespace-pre-wrap break-all rounded-lg p-3 text-xs leading-relaxed"
            style="background-color: var(--infl0-nested-surface); color: var(--infl0-formula-pre-fg)"
          >{{ formulaLines }}</pre>
        </div>

        <div class="flex justify-center">
          <button
            type="button"
            class="btn btn-outline border-[var(--infl0-field-border)] text-[var(--infl0-panel-text)]"
            @click="resetWeights"
          >
            {{ t('settingsTimeline.reset') }}
          </button>
        </div>
      </section>

      <!-- Engagement tracking (`id="tracking"`). Privacy intro links here. -->
      <section
        id="tracking"
        aria-labelledby="settings-tracking-heading"
        class="scroll-mt-24 mb-10"
      >
        <header class="mb-4 text-center">
          <h2 id="settings-tracking-heading" class="infl0-canvas-fg text-lg font-semibold">
            {{ t('settingsIndex.trackingHeading') }}
          </h2>
          <p class="infl0-canvas-muted mt-1 text-sm">
            {{ t('settingsIndex.trackingIntro') }}
          </p>
        </header>

        <div
          class="infl0-panel p-5"
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
            <span class="min-w-0 text-[var(--infl0-panel-text)]">
              <span class="block text-sm font-medium">{{
                t('settingsIndex.trackingLabel')
              }}</span>
              <span class="infl0-panel-muted mt-1 block text-xs leading-snug">{{
                t('settingsIndex.trackingHint')
              }}</span>
            </span>
          </label>
        </div>
      </section>

    </div>

      <!-- Wide block: algorithm + timeline diagnostics (narrow column above ends here). -->
      <section
        id="personalization"
        aria-labelledby="settings-personalization-heading"
        class="scroll-mt-24 mb-10"
      >
        <SettingsPersonalizationSection />
      </section>

      <div class="mx-auto w-full max-w-lg">
        <section id="privacy" aria-labelledby="settings-privacy-title" class="scroll-mt-24 mb-4">
          <SettingsPrivacySection />
        </section>
      </div>

  </div>
</template>
