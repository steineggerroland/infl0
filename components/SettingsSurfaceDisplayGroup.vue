<script setup lang="ts">
/**
 * One presentation surface: font, text size, and (if theme is custom) its colours.
 * The “Default for this area” control uses **hard-coded** label colours so it
 * stays legible and clickable if the user’s custom colours make theme tokens
 * unusable. The actual reset still applies `defaultSurfacePrefs` (incl. colour inherit).
 * Live preview for this surface only while the user works in the group.
 */
import { CALM_LIGHT_PICKER_DEFAULTS } from '~/utils/infl0-theme-derive'
import {
  defaultSurfacePrefs,
  FONT_FAMILY_IDS,
  fontSizeBoundsForSurface,
  type FontFamilyId,
  type SurfaceId,
} from '~/utils/ui-prefs'
import SettingsSurfacePreviewOne from '~/components/SettingsSurfacePreviewOne.vue'

const props = withDefaults(
  defineProps<{
    surfaceId: SurfaceId
    /** Top border (first card group right after the intro: false) */
    showTopBorder?: boolean
  }>(),
  { showTopBorder: true },
)

const SURFACE_I18N: Record<SurfaceId, 'cardFront' | 'cardBack' | 'reader'> = {
  'card-front': 'cardFront',
  'card-back': 'cardBack',
  reader: 'reader',
}

const { t } = useI18n()
const { prefs, update } = useUiPrefs()
const { active, onFocusIn, onFocusOut, reveal } = useContainedFocusActive()

const textSizeBounds = computed(() => fontSizeBoundsForSurface(props.surfaceId))

const FONTS: FontFamilyId[] = [...FONT_FAMILY_IDS]

function i18nSurface(s: string) {
  return t(`settingsDisplay.surfaces.${SURFACE_I18N[props.surfaceId]}.${s}`)
}

function onFontChange(fontFamily: FontFamilyId) {
  const s = props.surfaceId
  if (prefs.value.surfaces[s].fontFamily === fontFamily) return
  update({ surfaces: { [s]: { fontFamily } } })
}

function patchSize(raw: string) {
  reveal()
  const n = Number.parseInt(raw, 10)
  if (Number.isNaN(n)) return
  const s = props.surfaceId
  if (prefs.value.surfaces[s].fontSize === n) return
  update({ surfaces: { [s]: { fontSize: n } } })
}

function onRangeInput(e: Event) {
  patchSize((e.target as HTMLInputElement).value)
}

function pickerBgHex(): string {
  return prefs.value.surfaces[props.surfaceId].backgroundColor ?? CALM_LIGHT_PICKER_DEFAULTS[props.surfaceId].bg
}

function pickerFgHex(): string {
  return prefs.value.surfaces[props.surfaceId].textColor ?? CALM_LIGHT_PICKER_DEFAULTS[props.surfaceId].text
}

function onBgInput(e: Event) {
  const el = e.target as HTMLInputElement
  update({ surfaces: { [props.surfaceId]: { backgroundColor: el.value } } })
}

function onTextInput(e: Event) {
  const el = e.target as HTMLInputElement
  update({ surfaces: { [props.surfaceId]: { textColor: el.value } } })
}

function resetEntireSurface() {
  const s = props.surfaceId
  update({ surfaces: { [s]: { ...defaultSurfacePrefs(s) } } })
}
</script>

<template>
  <div
    :class="showTopBorder ? 'border-t border-[var(--infl0-panel-border)] pt-8' : ''"
    :data-testid="`surface-group-${surfaceId}`"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div class="mb-4">
      <h3 class="text-base font-semibold text-[var(--infl0-panel-text)]">
        {{ i18nSurface('heading') }}
      </h3>
      <p class="infl0-panel-muted mt-1 text-xs leading-snug">
        {{ i18nSurface('typographyHint') }}
      </p>
      <div class="mt-2 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          class="infl0-surface-area-reset-btn h-8 min-h-0 shrink-0 rounded px-3 text-xs font-medium"
          :data-testid="`surface-reset-all-${surfaceId}`"
          :aria-label="t('settingsDisplay.resetSurfaceAllAria', { surface: i18nSurface('areaLabel') })"
          @click="resetEntireSurface"
        >
          {{ t('settingsDisplay.resetSurfaceAll') }}
        </button>
      </div>
    </div>

    <div class="space-y-1.5">
      <label
        class="text-xs font-medium text-[var(--infl0-panel-text)]"
        :for="`font-family-${surfaceId}`"
      >{{ t('settingsDisplay.fontFamilyLabel') }}</label>
      <select
        :id="`font-family-${surfaceId}`"
        class="select select-bordered infl0-field min-h-10 w-full"
        :value="prefs.surfaces[surfaceId].fontFamily"
        :data-testid="`font-family-${surfaceId}`"
        @change="onFontChange(($event.target as HTMLSelectElement).value as FontFamilyId)"
      >
        <option
          v-for="font in FONTS"
          :key="font"
          :value="font"
        >
          {{ t(`settingsDisplay.fontFamilyOptions.${font}`) }}
        </option>
      </select>
    </div>

    <div class="mt-5 space-y-2">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <label
          class="text-xs font-medium text-[var(--infl0-panel-text)]"
          :for="`font-size-range-${surfaceId}`"
        >{{ t('settingsDisplay.fontSizeLabel') }}</label>
        <div class="flex items-center gap-1.5 tabular-nums text-xs text-[var(--infl0-panel-text-muted)]">
          <input
            :id="`font-size-num-${surfaceId}`"
            type="number"
            :min="textSizeBounds.min"
            :max="textSizeBounds.max"
            :value="prefs.surfaces[surfaceId].fontSize"
            :data-testid="`font-size-num-${surfaceId}`"
            class="infl0-field h-8 w-16 rounded border border-[var(--infl0-field-border)] bg-[var(--infl0-field-bg)] px-1.5 text-center text-sm text-[var(--infl0-panel-text)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            @change="patchSize(($event.target as HTMLInputElement).value)"
          >
          <span aria-hidden="true">{{ t('settingsDisplay.fontSizeUnit') }}</span>
        </div>
      </div>
      <input
        :id="`font-size-range-${surfaceId}`"
        type="range"
        :min="textSizeBounds.min"
        :max="textSizeBounds.max"
        step="1"
        :value="prefs.surfaces[surfaceId].fontSize"
        :data-testid="`font-size-range-${surfaceId}`"
        class="range range-primary range-sm w-full"
        :aria-valuemin="textSizeBounds.min"
        :aria-valuemax="textSizeBounds.max"
        :aria-valuenow="prefs.surfaces[surfaceId].fontSize"
        :aria-label="t('settingsDisplay.fontSizeRangeAria', { surface: i18nSurface('areaLabel') })"
        @input="onRangeInput"
      >
    </div>

    <fieldset
      v-if="prefs.theme === 'custom'"
      class="mt-5 min-w-0 space-y-2 rounded-lg border border-[var(--infl0-panel-border)] bg-[var(--infl0-nested-surface)] p-3"
      :data-testid="`custom-colors-${surfaceId}`"
    >
      <legend
        class="mb-1 block w-full text-xs font-medium text-[var(--infl0-panel-text)]"
      >
        {{ t('settingsDisplay.customColors.perSurfaceTitle') }}
      </legend>
      <p
        :id="`custom-color-hint-${surfaceId}`"
        class="infl0-panel-muted text-xs leading-snug"
      >
        {{ i18nSurface('colorHint') }}
      </p>
      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        :aria-label="t('settingsDisplay.customColors.pickerGroupAria', { surface: i18nSurface('areaLabel') })"
        :aria-describedby="`custom-color-hint-${surfaceId}`"
      >
        <label :for="`custom-bg-${surfaceId}`" class="sr-only">
          {{ t('settingsDisplay.customColors.colorBackgroundAria', { surface: i18nSurface('areaLabel') }) }}
        </label>
        <input
          :id="`custom-bg-${surfaceId}`"
          type="color"
          :title="t('settingsDisplay.customColors.background')"
          :data-testid="`custom-color-bg-${surfaceId}`"
          :value="pickerBgHex()"
          class="h-8 w-12 cursor-pointer rounded border border-[var(--infl0-field-border)] bg-[var(--infl0-field-bg)] p-0.5"
          @input="onBgInput"
        >
        <label :for="`custom-text-${surfaceId}`" class="sr-only">
          {{ t('settingsDisplay.customColors.colorTextAria', { surface: i18nSurface('areaLabel') }) }}
        </label>
        <input
          :id="`custom-text-${surfaceId}`"
          type="color"
          :title="t('settingsDisplay.customColors.text')"
          :data-testid="`custom-color-text-${surfaceId}`"
          :value="pickerFgHex()"
          class="h-8 w-12 cursor-pointer rounded border border-[var(--infl0-field-border)] bg-[var(--infl0-field-bg)] p-0.5"
          @input="onTextInput"
        >
      </div>
    </fieldset>

    <div
      v-show="active"
      class="mt-4 rounded-xl border p-3"
      style="border-color: var(--infl0-panel-border); background-color: var(--infl0-nested-surface)"
    >
      <p class="infl0-canvas-muted mb-2 text-xs font-medium uppercase tracking-wide">
        {{ t('settingsDisplay.preview.forThisSurface') }}
      </p>
      <SettingsSurfacePreviewOne :surface-id="surfaceId" />
    </div>
  </div>
</template>

<style scoped>
/**
 * Hard-coded: must not use theme/surface tokens — bad custom colours can make
 * `--infl0-*` unusable; this control is the way out.
 */
.infl0-surface-area-reset-btn {
  background-color: #ffffff;
  color: #0f172a;
  border: 1px solid #0f172a;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}
.infl0-surface-area-reset-btn:hover {
  background-color: #f1f5f9;
  color: #0f172a;
  border-color: #0f172a;
}
.infl0-surface-area-reset-btn:focus-visible {
  outline: 2px solid #0f172a;
  outline-offset: 2px;
}
</style>
