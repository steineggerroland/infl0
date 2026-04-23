<script setup lang="ts">
/**
 * Live preview for the Darstellung section on `/settings`.
 *
 * Renders three small surrogate surfaces — card front, card back,
 * reader — that consume the theme tokens declared in
 * `assets/css/tailwind.css`. Because `<html data-infl0-theme>` is flipped
 * through `useUiPrefs()` the instant the user picks a preset, no
 * explicit prop wiring is needed here: the preview simply inherits
 * the tokens from the document root.
 *
 * The component is deliberately small and does not re-use
 * `ArticleView` or any real timeline card; the preview's job is "does
 * the theme visibly change?", not "is this a faithful mini timeline".
 * Pulling in the real card would couple this slice to fixture data
 * and slow down future token refactors.
 */
const { t } = useI18n()
</script>

<template>
  <div
    class="space-y-3 rounded-xl border p-4"
    data-testid="theme-preview"
    aria-live="polite"
    style="
      background-color: var(--infl0-app-bg);
      border-color: var(--infl0-panel-border);
    "
  >
    <p class="infl0-canvas-muted text-xs font-medium uppercase tracking-wide">
      {{ t('settingsDisplay.preview.label') }}
    </p>

    <!-- Card front (headline) — same gradient as the timeline, not a flat "surface-front" swatch. -->
    <div
      class="infl0-front-font infl0-surface-typo-front max-h-24 overflow-y-auto rounded-lg border p-3"
      style="
        background: linear-gradient(135deg, var(--infl0-card-grad-a), var(--infl0-card-grad-b));
        color: var(--infl0-article-front-fg);
        border-color: var(--infl0-surface-front-border);
      "
      data-testid="theme-preview-front"
    >
      <p class="m-0 text-[0.9em] font-semibold leading-tight [overflow-wrap:anywhere]">
        {{ t('settingsDisplay.preview.frontHeadline') }}
      </p>
      <p class="m-0 mt-1 text-[0.8em] opacity-80">
        {{ t('settingsDisplay.preview.frontMeta') }}
      </p>
    </div>

    <!-- Card back (teaser) -->
    <div
      class="infl0-back-font infl0-surface-typo-back max-h-24 overflow-y-auto rounded-lg border p-3"
      style="
        background-color: var(--infl0-surface-back-bg);
        color: var(--infl0-surface-back-text);
        border-color: var(--infl0-surface-back-border);
      "
      data-testid="theme-preview-back"
    >
      <p class="m-0 [overflow-wrap:anywhere]">
        {{ t('settingsDisplay.preview.backTeaser') }}
      </p>
    </div>

    <!-- Reader (full-text) -->
    <div
      class="infl0-reader-font infl0-surface-typo-reader max-h-32 overflow-y-auto rounded-lg border p-3"
      style="
        background-color: var(--infl0-surface-reader-bg);
        color: var(--infl0-surface-reader-text);
        border-color: var(--infl0-surface-reader-border);
      "
      data-testid="theme-preview-reader"
    >
      <p class="m-0 [overflow-wrap:anywhere]">
        {{ t('settingsDisplay.preview.readerBody') }}
      </p>
    </div>
  </div>
</template>
