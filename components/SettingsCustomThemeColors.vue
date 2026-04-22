<script setup lang="ts">
/**
 * Per-surface background and text color pickers when `theme === 'custom'`.
 * Values are stored in `UiPrefs.surfaces` and mapped to `--infl0-*` on
 * `<html>` via `buildThemeHtmlStyle` in `app.vue`.
 */
import { CALM_LIGHT_PICKER_DEFAULTS } from '~/utils/infl0-theme-derive'
import { SURFACE_IDS, type SurfaceId } from '~/utils/ui-prefs'

const { t } = useI18n()
const { prefs, update } = useUiPrefs()

const SURFACES: SurfaceId[] = [...SURFACE_IDS]

function displayBg(id: SurfaceId): string {
  return prefs.value.surfaces[id].backgroundColor ?? CALM_LIGHT_PICKER_DEFAULTS[id].bg
}

function displayText(id: SurfaceId): string {
  return prefs.value.surfaces[id].textColor ?? CALM_LIGHT_PICKER_DEFAULTS[id].text
}

function onBgInput(id: SurfaceId, e: Event) {
  const el = e.target as HTMLInputElement
  update({ surfaces: { [id]: { backgroundColor: el.value } } })
}

function onTextInput(id: SurfaceId, e: Event) {
  const el = e.target as HTMLInputElement
  update({ surfaces: { [id]: { textColor: el.value } } })
}

function resetSurface(id: SurfaceId) {
  update({ surfaces: { [id]: { backgroundColor: null, textColor: null } } })
}

function surfaceLabel(id: SurfaceId): string {
  return t(`settingsDisplay.customColors.surfaces.${id}.label`)
}
</script>

<template>
  <div
    v-if="prefs.theme === 'custom'"
    class="space-y-3 rounded-lg border border-[var(--infl0-panel-border)] bg-[var(--infl0-nested-surface)] p-3"
    data-testid="custom-theme-colors"
  >
    <div class="space-y-3">
      <fieldset
        v-for="id in SURFACES"
        :key="id"
        class="min-w-0 space-y-2 border-0 p-0"
      >
        <legend class="text-xs font-medium text-[var(--infl0-panel-text)]">
          {{ surfaceLabel(id) }}
        </legend>
        <div class="flex flex-wrap items-center gap-2">
          <input
            :id="`custom-bg-${id}`"
            type="color"
            :title="t('settingsDisplay.customColors.background')"
            :data-testid="`custom-color-bg-${id}`"
            :value="displayBg(id)"
            class="h-8 w-12 cursor-pointer rounded border border-[var(--infl0-field-border)] bg-[var(--infl0-field-bg)] p-0.5"
            @input="onBgInput(id, $event)"
          >
          <input
            :id="`custom-text-${id}`"
            type="color"
            :title="t('settingsDisplay.customColors.text')"
            :data-testid="`custom-color-text-${id}`"
            :value="displayText(id)"
            class="h-8 w-12 cursor-pointer rounded border border-[var(--infl0-field-border)] bg-[var(--infl0-field-bg)] p-0.5"
            @input="onTextInput(id, $event)"
          >
          <button
            type="button"
            class="btn btn-ghost btn-xs h-8 min-h-0"
            :data-testid="`custom-color-reset-${id}`"
            @click="resetSurface(id)"
          >
            {{ t('settingsDisplay.customColors.resetSurface') }}
          </button>
        </div>
      </fieldset>
    </div>
  </div>
</template>
