<script setup lang="ts">
/**
 * `/settings/privacy` is the storage-philosophy page. It explains WHAT
 * we store about you and WHY; the actual consent toggle for reading-
 * behaviour analysis lives on `/settings#tracking` (one navigation
 * target, one click, matching the product rule "keine Hubs, direkte
 * Einstellung").
 *
 * Later this page will carry the legally-reviewed privacy statement
 * (`settingsPrivacy.legal*`). Until that text exists it is marked up
 * as a placeholder section, not shown, to avoid implying legal cover
 * we do not have yet.
 */
definePageMeta({
  layout: 'app',
  appFooter: { testId: 'settings-page-footer' },
})

const { t } = useI18n()
</script>

<template>
  <div class="min-h-dvh bg-gray-400 text-gray-100 pb-16 pt-16">
    <div class="mx-auto w-full max-w-lg px-4">
      <header class="mb-8 text-center text-gray-900">
        <h1 class="text-2xl font-semibold">{{ t('settingsPrivacy.title') }}</h1>
        <p class="mt-2 text-sm text-gray-800">
          {{ t('settingsPrivacy.intro') }}
        </p>
      </header>

      <section
        aria-labelledby="privacy-philosophy-heading"
        class="mb-6 rounded-xl border border-gray-700 bg-gray-900/95 p-5 shadow-xl"
      >
        <h2
          id="privacy-philosophy-heading"
          class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400"
        >
          {{ t('settingsPrivacy.philosophyHeading') }}
        </h2>
        <p class="text-sm leading-relaxed text-gray-300">
          {{ t('settingsPrivacy.philosophyBody') }}
        </p>
      </section>

      <section
        aria-labelledby="privacy-control-heading"
        class="rounded-xl border border-gray-700 bg-gray-900/95 p-5 shadow-xl"
      >
        <h2
          id="privacy-control-heading"
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400"
        >
          {{ t('settingsPrivacy.controlHeading') }}
        </h2>
        <p class="mb-4 text-sm leading-relaxed text-gray-300">
          {{ t('settingsPrivacy.controlBody') }}
        </p>
        <NuxtLink
          to="/settings#tracking"
          class="inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-500/60 px-4 text-sm font-semibold text-emerald-300 underline decoration-2 underline-offset-4 hover:bg-emerald-500/10"
          data-testid="privacy-cta-to-settings"
        >
          {{ t('settingsPrivacy.controlCta') }}
        </NuxtLink>
      </section>
    </div>
  </div>
</template>
