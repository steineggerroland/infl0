<script setup lang="ts">
/**
 * Motion-mode picker for the Appearance section of `/settings`.
 *
 * The tri-state choice (`system | reduced | standard`) matches the
 * contract documented in `utils/ui-prefs.ts`:
 *   - `system` follows the OS `prefers-reduced-motion` media query,
 *   - `reduced` forces calmer motion regardless of OS setting,
 *   - `standard` explicitly opts out of OS-reduced motion.
 *
 * Writing through `useUiPrefs().update({ motion })` keeps the reactive
 * state, the optimistic local copy and the debounced server PATCH in
 * lock-step; the `<html data-motion>` attribute follows from `app.vue`
 * and CSS in `tailwind.css` picks it up without any extra wiring here.
 */
import { MOTION_MODES, type MotionMode } from '~/utils/ui-prefs'

const { t } = useI18n()
const { prefs, update } = useUiPrefs()

function onSelect(mode: MotionMode) {
  if (prefs.value.motion === mode) return
  update({ motion: mode })
}
</script>

<template>
  <fieldset
    class="infl0-settings-fieldset space-y-3"
    data-testid="motion-control"
  >
    <legend class="infl0-settings-group-title">
      {{ t('settingsDisplay.motionLabel') }}
    </legend>
    <p class="infl0-settings-group-hint">
      {{ t('settingsDisplay.motionHint') }}
    </p>
    <div class="infl0-settings-option-list">
      <label
        v-for="m in MOTION_MODES"
        :key="m"
        class="infl0-settings-option-row"
        :class="prefs.motion === m ? 'infl0-settings-option-row--selected' : ''"
      >
        <input
          type="radio"
          name="ui-motion"
          :value="m"
          :checked="prefs.motion === m"
          class="radio radio-primary mt-0.5 shrink-0"
          :data-testid="`motion-option-${m}`"
          @change="onSelect(m)"
        >
        <span class="min-w-0 text-[var(--infl0-panel-text)]">
          <span class="block text-sm font-medium">{{
            t(`settingsDisplay.motionOptions.${m}.label`)
          }}</span>
          <span class="infl0-panel-muted mt-0.5 block text-xs leading-snug">{{
            t(`settingsDisplay.motionOptions.${m}.hint`)
          }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
