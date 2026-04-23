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
    class="space-y-3"
    data-testid="appearance-control"
  >
    <legend class="text-sm font-medium text-[var(--infl0-panel-text)]">
      {{ t('settingsDisplay.appearanceLabel') }}
    </legend>
    <p class="infl0-panel-muted text-xs leading-snug">
      {{ t('settingsDisplay.appearanceHint') }}
    </p>
    <div class="space-y-2">
      <label
        v-for="m in APPEARANCE_MODES"
        :key="m"
        class="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:border-[var(--infl0-control-sel-border)]"
        :class="prefs.appearance === m ? 'border-[var(--infl0-control-sel-border)] bg-[var(--infl0-control-sel-bg)]' : ''"
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
