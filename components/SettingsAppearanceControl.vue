<script setup lang="ts">
/**
 * Whether the app is light, dark, or matches the device — controls the light/dark
 * **pair** of the built-in palettes. Custom colours are unchanged.
 */
import { APPEARANCE_MODES, type AppearanceMode } from '~/utils/ui-prefs'

const { t } = useI18n()
const { prefs, update } = useUiPrefs()

function onSelect(mode: AppearanceMode) {
  if (prefs.value.appearance === mode) return
  update({ appearance: mode })
}
</script>

<template>
  <fieldset
    class="infl0-settings-fieldset space-y-3"
    data-testid="appearance-control"
  >
    <legend class="infl0-settings-group-title">
      {{ t('settingsDisplay.appearanceLabel') }}
    </legend>
    <p class="infl0-settings-group-hint">
      {{ t('settingsDisplay.appearanceHint') }}
    </p>
    <div class="infl0-settings-option-list">
      <label
        v-for="m in APPEARANCE_MODES"
        :key="m"
        class="infl0-settings-option-row"
        :class="prefs.appearance === m ? 'infl0-settings-option-row--selected' : ''"
      >
        <input
          type="radio"
          name="ui-appearance"
          :value="m"
          :checked="prefs.appearance === m"
          class="radio radio-primary mt-0.5 shrink-0"
          :data-testid="`appearance-option-${m}`"
          @change="onSelect(m)"
        >
        <span class="min-w-0 text-[var(--infl0-panel-text)]">
          <span class="block text-sm font-medium">{{
            t(`settingsDisplay.appearanceOptions.${m}.label`)
          }}</span>
          <span class="infl0-panel-muted mt-0.5 block text-xs leading-snug">{{
            t(`settingsDisplay.appearanceOptions.${m}.hint`)
          }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
