<script setup lang="ts">
/**
 * Theme preset picker for the Darstellung section of `/settings`.
 *
 * Matches the tri-state layout of `SettingsMotionControl`: a
 * `<fieldset>` with `<legend>`, native radios, behavioural updates
 * through `useUiPrefs().update({ theme })`.
 *
 * Choosing `custom` shows `SettingsCustomThemeColors` for
 * per-surface hex colors, mapped to `--infl0-*` on `<html>`.
 */
import SettingsCustomThemeColors from '~/components/SettingsCustomThemeColors.vue'
import { THEME_PRESET_IDS, type ThemeChoice } from '~/utils/ui-prefs'

const { t } = useI18n()
const { prefs, update } = useUiPrefs()

// Render order: presets first (most useful at a glance), then the
// custom option as a deliberate "I'll set my own colors" bucket.
const OPTIONS: ThemeChoice[] = [...THEME_PRESET_IDS, 'custom']

function onSelect(choice: ThemeChoice) {
  if (prefs.value.theme === choice) return
  update({ theme: choice })
}
</script>

<template>
  <fieldset
    class="space-y-3"
    data-testid="theme-control"
  >
    <legend class="text-sm font-medium text-[var(--infl0-panel-text)]">
      {{ t('settingsDisplay.themeLabel') }}
    </legend>
    <p class="infl0-panel-muted text-xs leading-snug">
      {{ t('settingsDisplay.themeHint') }}
    </p>
    <div class="space-y-2">
      <label
        v-for="choice in OPTIONS"
        :key="choice"
        class="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:border-[var(--infl0-control-sel-border)]"
        :class="prefs.theme === choice ? 'border-[var(--infl0-control-sel-border)] bg-[var(--infl0-control-sel-bg)]' : ''"
      >
        <input
          type="radio"
          name="ui-theme"
          :value="choice"
          :checked="prefs.theme === choice"
          class="radio radio-primary mt-0.5 shrink-0"
          :data-testid="`theme-option-${choice}`"
          @change="onSelect(choice)"
        >
        <span class="min-w-0 text-[var(--infl0-panel-text)]">
          <span class="block text-sm font-medium">{{
            t(`settingsDisplay.themeOptions.${choice}.label`)
          }}</span>
          <span class="infl0-panel-muted mt-0.5 block text-xs leading-snug">{{
            t(`settingsDisplay.themeOptions.${choice}.hint`)
          }}</span>
        </span>
      </label>
    </div>
  </fieldset>
  <SettingsCustomThemeColors />
</template>
