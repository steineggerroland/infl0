<script setup lang="ts">
/**
 * Single-surface live preview (card front, card back, or reader) for `/settings`
 * when the matching surface group is active.
 */
import type { SurfaceId } from '~/utils/ui-prefs'

const props = defineProps<{
  surfaceId: SurfaceId
}>()

const { t } = useI18n()
</script>

<template>
  <div
    v-if="surfaceId === 'card-front'"
    class="infl0-front-font infl0-surface-typo-front max-h-28 overflow-y-auto rounded-lg border p-3"
    data-testid="surface-preview-card-front"
    style="
      background: linear-gradient(135deg, var(--infl0-card-grad-a), var(--infl0-card-grad-b));
      color: var(--infl0-article-front-fg);
      border-color: var(--infl0-surface-front-border);
    "
  >
    <p class="m-0 text-[0.9em] font-semibold leading-tight [overflow-wrap:anywhere]">
      {{ t('settingsDisplay.preview.frontHeadline') }}
    </p>
    <p class="m-0 mt-1 text-[0.8em] opacity-80">
      {{ t('settingsDisplay.preview.frontMeta') }}
    </p>
  </div>

  <div
    v-else-if="surfaceId === 'card-back'"
    class="infl0-back-font infl0-surface-typo-back max-h-28 overflow-y-auto rounded-lg border p-3"
    data-testid="surface-preview-card-back"
    style="
      background-color: var(--infl0-surface-back-bg);
      color: var(--infl0-surface-back-text);
      border-color: var(--infl0-surface-back-border);
    "
  >
    <p class="m-0 [overflow-wrap:anywhere]">
      {{ t('settingsDisplay.preview.backTeaser') }}
    </p>
  </div>

  <div
    v-else
    class="infl0-reader-font infl0-surface-typo-reader max-h-32 overflow-y-auto rounded-lg border p-3"
    data-testid="surface-preview-reader"
    style="
      background-color: var(--infl0-surface-reader-bg);
      color: var(--infl0-surface-reader-text);
      border-color: var(--infl0-surface-reader-border);
    "
  >
    <p class="m-0 [overflow-wrap:anywhere]">
      {{ t('settingsDisplay.preview.readerBody') }}
    </p>
  </div>
</template>
