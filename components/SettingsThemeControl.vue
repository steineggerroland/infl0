<script setup lang="ts">
/**
 * Farbpalette: Pastell und Warm je als Swatch-Reihe, darunter hoher Kontrast und eigene Farben.
 * Hell/Dunkel wählt die Nutzerin über `SettingsAppearanceControl` davor.
 */
import SettingsCustomThemeColors from '~/components/SettingsCustomThemeColors.vue'
import { presetSourceFor } from '~/utils/infl0-theme-derive'
import { THEME_HUE_IDS, type ThemeChoice, type ThemeHueId, type ThemePresetId } from '~/utils/ui-prefs'

const { t } = useI18n()
const { prefs, update } = useUiPrefs()

function presetId(family: 'pastel' | 'warm', hue: ThemeHueId): ThemePresetId {
  return `${family}:${hue}`
}

function themeOptionI18nKey(choice: ThemeChoice): string {
  if (choice === 'custom') return 'custom'
  if (choice === 'high-contrast') return 'highContrast'
  return choice.replace(':', '_')
}

/** Immer helle Pastell-/Warm-Vorschau, damit die Kacheln auf dunklem UI erkennbar bleiben. */
function swatchStyle(family: 'pastel' | 'warm', hue: ThemeHueId) {
  const src = presetSourceFor(presetId(family, hue), 'light')
  return {
    background: `linear-gradient(135deg, ${src.cardFront.bg}, ${src.cardBack.bg})`,
  }
}

function onSelectPreset(family: 'pastel' | 'warm', hue: ThemeHueId) {
  const choice = presetId(family, hue)
  if (prefs.value.theme === choice) return
  update({ theme: choice })
}

function onSelectChoice(choice: ThemeChoice) {
  if (prefs.value.theme === choice) return
  update({ theme: choice })
}
</script>

<template>
  <fieldset
    class="space-y-5"
    data-testid="theme-control"
  >
    <legend class="text-sm font-medium text-[var(--infl0-panel-text)]">
      {{ t('settingsDisplay.themeLabel') }}
    </legend>
    <p class="infl0-panel-muted text-xs leading-snug">
      {{ t('settingsDisplay.themeHint') }}
    </p>

    <div class="space-y-1.5">
      <p class="text-xs font-medium text-[var(--infl0-panel-text)]">
        {{ t('settingsDisplay.themePastelGroup') }}
      </p>
      <div
        class="grid grid-cols-5 gap-2"
        role="radiogroup"
        :aria-label="t('settingsDisplay.themePastelGroup')"
      >
        <button
          v-for="hue in THEME_HUE_IDS"
          :key="`pastel-${hue}`"
          type="button"
          role="radio"
          :aria-checked="prefs.theme === presetId('pastel', hue)"
          :aria-label="t(`settingsDisplay.themeOptions.${themeOptionI18nKey(presetId('pastel', hue))}.label`)"
          class="h-12 w-full min-w-0 rounded-lg border-2 border-transparent shadow-sm outline-none ring-offset-2 ring-offset-[var(--infl0-panel-bg)] transition-[box-shadow,border-color] focus-visible:ring-2 focus-visible:ring-[var(--infl0-panel-text-muted)]"
          :class="
            prefs.theme === presetId('pastel', hue)
              ? 'border-[var(--infl0-control-sel-border)] ring-2 ring-[var(--infl0-control-sel-border)]'
              : 'hover:border-[var(--infl0-panel-border)]'
          "
          :style="swatchStyle('pastel', hue)"
          :data-testid="`theme-swatch-pastel-${hue}`"
          @click="onSelectPreset('pastel', hue)"
        />
      </div>
    </div>

    <div class="space-y-1.5">
      <p class="text-xs font-medium text-[var(--infl0-panel-text)]">
        {{ t('settingsDisplay.themeWarmGroup') }}
      </p>
      <div
        class="grid grid-cols-5 gap-2"
        role="radiogroup"
        :aria-label="t('settingsDisplay.themeWarmGroup')"
      >
        <button
          v-for="hue in THEME_HUE_IDS"
          :key="`warm-${hue}`"
          type="button"
          role="radio"
          :aria-checked="prefs.theme === presetId('warm', hue)"
          :aria-label="t(`settingsDisplay.themeOptions.${themeOptionI18nKey(presetId('warm', hue))}.label`)"
          class="h-12 w-full min-w-0 rounded-lg border-2 border-transparent shadow-sm outline-none ring-offset-2 ring-offset-[var(--infl0-panel-bg)] transition-[box-shadow,border-color] focus-visible:ring-2 focus-visible:ring-[var(--infl0-panel-text-muted)]"
          :class="
            prefs.theme === presetId('warm', hue)
              ? 'border-[var(--infl0-control-sel-border)] ring-2 ring-[var(--infl0-control-sel-border)]'
              : 'hover:border-[var(--infl0-panel-border)]'
          "
          :style="swatchStyle('warm', hue)"
          :data-testid="`theme-swatch-warm-${hue}`"
          @click="onSelectPreset('warm', hue)"
        />
      </div>
    </div>

    <div class="space-y-2 border-t border-[var(--infl0-panel-border)]/70 pt-4">
      <label
        class="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:border-[var(--infl0-control-sel-border)]"
        :class="prefs.theme === 'high-contrast' ? 'border-[var(--infl0-control-sel-border)] bg-[var(--infl0-control-sel-bg)]' : ''"
      >
        <input
          type="radio"
          name="ui-theme-extra"
          value="high-contrast"
          :checked="prefs.theme === 'high-contrast'"
          class="radio radio-primary mt-0.5 shrink-0"
          data-testid="theme-option-high-contrast"
          @change="onSelectChoice('high-contrast')"
        >
        <span class="min-w-0 text-[var(--infl0-panel-text)]">
          <span class="block text-sm font-medium">{{
            t('settingsDisplay.themeOptions.highContrast.label')
          }}</span>
          <span class="infl0-panel-muted mt-0.5 block text-xs leading-snug">{{
            t('settingsDisplay.themeOptions.highContrast.hint')
          }}</span>
        </span>
      </label>
      <label
        class="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:border-[var(--infl0-control-sel-border)]"
        :class="prefs.theme === 'custom' ? 'border-[var(--infl0-control-sel-border)] bg-[var(--infl0-control-sel-bg)]' : ''"
      >
        <input
          type="radio"
          name="ui-theme-extra"
          value="custom"
          :checked="prefs.theme === 'custom'"
          class="radio radio-primary mt-0.5 shrink-0"
          data-testid="theme-option-custom"
          @change="onSelectChoice('custom')"
        >
        <span class="min-w-0 text-[var(--infl0-panel-text)]">
          <span class="block text-sm font-medium">{{
            t('settingsDisplay.themeOptions.custom.label')
          }}</span>
          <span class="infl0-panel-muted mt-0.5 block text-xs leading-snug">{{
            t('settingsDisplay.themeOptions.custom.hint')
          }}</span>
        </span>
      </label>
    </div>
  </fieldset>
  <SettingsCustomThemeColors />
</template>
