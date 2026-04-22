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
  <div class="infl0-page-shell pb-16 pt-16">
    <div class="mx-auto w-full max-w-lg px-4">
      <header class="mb-10 text-center">
        <h1 class="infl0-canvas-fg text-2xl font-semibold">{{ t('settingsIndex.title') }}</h1>
        <p class="infl0-canvas-muted mt-2 text-sm">
          {{ t('settingsIndex.intro') }}
        </p>
      </header>

      <!--
        Darstellung / readability. Starts with Motion (ships now);
        theme presets, per-surface font size and custom colors are
        staged in `docs/planned/readability-settings.md` and join in
        follow-up slices without changing this section's outline.
      -->
      <section aria-labelledby="settings-display-heading" class="mb-10">
        <header class="mb-4 text-center">
          <h2 id="settings-display-heading" class="infl0-canvas-fg text-lg font-semibold">
            {{ t('settingsDisplay.heading') }}
          </h2>
          <p class="infl0-canvas-muted mt-1 text-sm">
            {{ t('settingsDisplay.intro') }}
          </p>
        </header>

        <div class="infl0-panel space-y-6 p-5">
          <SettingsAppearanceControl />
          <div class="border-t border-[var(--infl0-panel-border)] pt-5">
            <SettingsThemeControl />
          </div>
          <!--
            The preview lives next to the picker, not inside it, so the
            fieldset/legend semantics stay focused on "pick a theme" and
            screen readers do not read the preview rows as radio options.
          -->
          <SettingsThemePreview />
          <div class="border-t border-[var(--infl0-panel-border)] pt-5">
            <SettingsMotionControl />
          </div>
        </div>
      </section>

      <!--
        Sorting weights. The h2 here is the section label; each
        factor group inside is an h3 so screen-reader outline mirrors
        the "Einstellungen → Sortierung → einzelne Gruppen" nesting.
      -->
      <section aria-labelledby="settings-sorting-heading" class="mb-10">
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
  </div>
</template>
