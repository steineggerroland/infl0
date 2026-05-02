<script setup lang="ts">
/**
 * `/settings/privacy` is the storage-philosophy page. It explains WHAT
 * we store about you and WHY; the actual consent toggle for reading-
 * behaviour analysis lives on `/settings#tracking` (one navigation
 * target, one click, matching the product rule: no setting hubs — direct
 * settings pages).
 *
 * Later this page will carry the legally-reviewed privacy statement
 * (`settingsPrivacy.legal*`). Until that text exists it is marked up
 * as a placeholder section, not shown, to avoid implying legal cover
 * we do not have yet.
 */
definePageMeta({
  layout: 'settings',
  appFooter: { testId: 'settings-page-footer' },
})

const { t } = useI18n()
</script>

<template>
  <div id="privacy" class="infl0-page-shell pb-16 pt-16">
    <div class="mx-auto w-full max-w-lg px-4">
      <header class="mb-8 text-center">
        <h1 class="infl0-canvas-fg text-2xl font-semibold">{{ t('settingsPrivacy.title') }}</h1>
        <p class="infl0-canvas-muted mt-2 text-sm">
          {{ t('settingsPrivacy.intro') }}
        </p>
      </header>

      <section
        aria-labelledby="privacy-philosophy-heading"
        class="infl0-panel mb-6 p-5"
      >
        <h2
          id="privacy-philosophy-heading"
          class="infl0-section-label mb-3 text-sm font-semibold uppercase tracking-wide"
        >
          {{ t('settingsPrivacy.philosophyHeading') }}
        </h2>
        <p class="text-sm leading-relaxed text-[var(--infl0-panel-text)]">
          {{ t('settingsPrivacy.philosophyBody') }}
        </p>
      </section>

      <section
        aria-labelledby="privacy-control-heading"
        class="infl0-panel p-5"
      >
        <h2
          id="privacy-control-heading"
          class="infl0-section-label mb-2 text-sm font-semibold uppercase tracking-wide"
        >
          {{ t('settingsPrivacy.controlHeading') }}
        </h2>
        <p class="mb-4 text-sm leading-relaxed text-[var(--infl0-panel-text)]">
          {{ t('settingsPrivacy.controlBody') }}
        </p>
        <NuxtLink
          to="/settings#tracking"
          class="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--infl0-semantic-trust-border)] px-4 text-sm font-semibold text-[var(--infl0-semantic-trust-link)] underline decoration-2 underline-offset-4 hover:bg-[var(--infl0-semantic-trust-bg)] hover:text-[var(--infl0-semantic-trust-link-hover)]"
          data-testid="privacy-cta-to-settings"
        >
          {{ t('settingsPrivacy.controlCta') }}
        </NuxtLink>
      </section>
    </div>
  </div>
</template>
