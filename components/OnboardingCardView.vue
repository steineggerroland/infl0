<script setup lang="ts">
import type { OnboardingCardCta, OnboardingTopic } from '~/utils/onboarding-cards'
import { isInternalCtaHref } from '~/utils/onboarding-cards'

/**
 * Renderer for `type: 'onboarding'` rows from `/api/inflow`.
 *
 * - Copy is read from i18n at render time (`onboarding.<topic>.*`),
 *   not from the server payload — the server emits structural data
 *   only (`topic`, `ordinal`, optional `cta`, `hasDeviceVariants`).
 * - The `intro` card has device-specific body copy. While
 *   `useCoarsePointer()` has not yet resolved (SSR, first paint),
 *   the body is replaced by a DaisyUI skeleton placeholder so users
 *   never see the wrong variant flicker in.
 * - The skip button only renders on the first card (`intro`). It
 *   emits `skip`; the parent flips `uiPrefs.onboardingHidden` so the
 *   change persists and survives across tabs / devices.
 * - Stable selectors for E2E:
 *   `data-testid="onboarding-card"`,
 *   `data-onboarding-topic="<topic>"`,
 *   `data-onboarding-skip` on the skip button.
 */
const props = defineProps<{
    topic: OnboardingTopic
    cta?: OnboardingCardCta
    hasDeviceVariants: boolean
    isSelected?: boolean
}>()

const emit = defineEmits<{
    (e: 'skip'): void
}>()

const { t } = useI18n()
const isCoarse = useCoarsePointer()

const showSkip = computed(() => props.topic === 'intro')

const titleKey = computed(() => `onboarding.${props.topic}.title`)
const bodyDesktopKey = computed(() => `onboarding.${props.topic}.body.desktop`)
const bodyMobileKey = computed(() => `onboarding.${props.topic}.body.mobile`)
const bodyFlatKey = computed(() => `onboarding.${props.topic}.body`)

/**
 * `null` until `useCoarsePointer` resolves — the template renders a
 * skeleton in that case for variant-bearing cards. Cards without
 * variants ignore the value entirely.
 */
const bodyText = computed<string | null>(() => {
    if (!props.hasDeviceVariants) return t(bodyFlatKey.value)
    if (isCoarse.value === null) return null
    return isCoarse.value ? t(bodyMobileKey.value) : t(bodyDesktopKey.value)
})

const ctaSafe = computed<OnboardingCardCta | null>(() => {
    if (!props.cta) return null
    if (!isInternalCtaHref(props.cta.href)) return null
    return props.cta
})

function onSkipClick() {
    emit('skip')
}
</script>

<template>
    <div
        :id="`onboarding/${topic}`"
        class="onboarding-card-container"
        data-testid="onboarding-card"
        :data-onboarding-topic="topic"
    >
        <div
            class="onboarding-card infl0-surface-front rounded-xl bg-front relative transition-all"
        >
            <div
                class="flex min-h-0 h-full max-h-full w-full flex-col items-stretch px-6 pt-6 pb-4"
            >
                <h1
                    class="infl0-surface-typo-front mb-3 w-full shrink-0 text-end font-bold leading-tight tracking-tighter"
                    :data-onboarding-title="topic"
                >
                    {{ t(titleKey) }}
                </h1>
                <div
                    class="infl0-surface-typo-back flex min-h-0 w-full min-w-0 flex-1 flex-col"
                >
                    <p
                        v-if="bodyText"
                        class="onboarding-body min-h-0 min-w-0 flex-1 overflow-y-auto text-start leading-relaxed text-[var(--infl0-article-front-fg-dim)] [overflow-wrap:anywhere]"
                        :data-onboarding-body="topic"
                    >
                        {{ bodyText }}
                    </p>
                    <div
                        v-else
                        class="onboarding-body-skeleton flex min-h-0 min-w-0 flex-1 flex-col items-stretch gap-2 pt-1"
                        data-testid="onboarding-card-body-skeleton"
                        aria-hidden="true"
                    >
                        <div class="skeleton h-3 w-full" />
                        <div class="skeleton h-3 w-11/12" />
                        <div class="skeleton h-3 w-10/12" />
                        <div class="skeleton h-3 w-9/12" />
                    </div>
                </div>
                <div
                    v-if="ctaSafe || showSkip"
                    class="mt-4 flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:justify-center"
                >
                    <NuxtLink
                        v-if="ctaSafe"
                        :to="ctaSafe.href"
                        class="btn btn-primary btn-sm"
                        :data-onboarding-cta="topic"
                    >
                        {{ t(ctaSafe.labelKey) }}
                    </NuxtLink>
                    <button
                        v-if="showSkip"
                        type="button"
                        class="btn btn-ghost btn-sm border border-[var(--infl0-field-border)]"
                        data-onboarding-skip
                        @click="onSkipClick"
                    >
                        {{ t('onboarding.skipIntro') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.onboarding-card-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.bg-front {
    background: linear-gradient(135deg, var(--infl0-card-grad-a), var(--infl0-card-grad-b));
    color: var(--infl0-article-front-fg);
}

.onboarding-card {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
</style>
