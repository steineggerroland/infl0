<script setup lang="ts">
/**
 * Storage-philosophy copy for the Settings hub. The consent toggle for
 * reading-behaviour analysis lives under `/settings#tracking`.
 */
const { t } = useI18n()
</script>

<template>
    <div class="w-full">
        <div class="mx-auto w-full max-w-lg">
            <header class="mb-8 text-center">
                <h2 id="settings-privacy-title" class="infl0-canvas-fg text-2xl font-semibold">{{ t('settingsPrivacy.title') }}</h2>
                <p class="infl0-canvas-muted mt-2 text-sm">
                    {{ t('settingsPrivacy.intro') }}
                </p>
            </header>

            <section
                aria-labelledby="privacy-philosophy-heading"
                class="infl0-panel mb-6 p-5"
            >
                <h3
                    id="privacy-philosophy-heading"
                    class="infl0-section-label mb-3 text-sm font-semibold uppercase tracking-wide"
                >
                    {{ t('settingsPrivacy.philosophyHeading') }}
                </h3>
                <p class="text-sm leading-relaxed text-[var(--infl0-panel-text)]">
                    {{ t('settingsPrivacy.philosophyBody') }}
                </p>
            </section>

            <section
                aria-labelledby="privacy-control-heading"
                class="infl0-panel p-5"
            >
                <h3
                    id="privacy-control-heading"
                    class="infl0-section-label mb-2 text-sm font-semibold uppercase tracking-wide"
                >
                    {{ t('settingsPrivacy.controlHeading') }}
                </h3>
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
