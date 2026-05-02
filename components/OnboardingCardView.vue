<script setup lang="ts">
import type { OnboardingCardCta, OnboardingTopic } from '~/utils/onboarding-cards'
import { isInternalCtaHref } from '~/utils/onboarding-cards'
import {
    clampFontSizePxForSurface,
    cycleFontFamilyId,
    SURFACE_DEFAULT_FONT_PX,
    type SurfaceId,
} from '~/utils/ui-prefs'

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
    (e: 'skip' | 'commit'): void
}>()

const { t } = useI18n()
const isCoarse = useCoarsePointer()
const isDetailView = ref(false)
const readerVisible = ref(false)
const readerDialog = ref<HTMLDialogElement | null>(null)

const showSkip = computed(() => props.topic === 'intro')

const titleKey = computed(() => `onboarding.${props.topic}.title`)
const frontDesktopKey = computed(() => `onboarding.${props.topic}.front.desktop`)
const frontMobileKey = computed(() => `onboarding.${props.topic}.front.mobile`)
const frontFlatKey = computed(() => `onboarding.${props.topic}.front`)
const backDesktopKey = computed(() => `onboarding.${props.topic}.back.desktop`)
const backMobileKey = computed(() => `onboarding.${props.topic}.back.mobile`)
const backFlatKey = computed(() => `onboarding.${props.topic}.back`)
const fullDesktopKey = computed(() => `onboarding.${props.topic}.full.desktop`)
const fullMobileKey = computed(() => `onboarding.${props.topic}.full.mobile`)
const fullFlatKey = computed(() => `onboarding.${props.topic}.full`)

/**
 * `null` until `useCoarsePointer` resolves — the template renders a
 * skeleton in that case for variant-bearing cards. Cards without
 * variants ignore the value entirely.
 */
function resolveText(flatKey: string, desktopKey: string, mobileKey: string): string | null {
    if (!props.hasDeviceVariants) return t(flatKey)
    if (isCoarse.value === null) return null
    return isCoarse.value ? t(mobileKey) : t(desktopKey)
}

const frontText = computed<string | null>(() =>
    resolveText(frontFlatKey.value, frontDesktopKey.value, frontMobileKey.value),
)
const backText = computed<string | null>(() =>
    resolveText(backFlatKey.value, backDesktopKey.value, backMobileKey.value),
)
const fullText = computed<string | null>(() =>
    resolveText(fullFlatKey.value, fullDesktopKey.value, fullMobileKey.value),
)
const fullTextLinks = computed<Array<{ to: string; label: string }>>(() => {
    if (props.topic === 'intro') {
        return [{ to: '/help', label: t('onboarding.helpLinkLabel') }]
    }
    if (props.topic === 'scoring') {
        return [
            { to: '/settings#settings-sorting-heading', label: t('onboarding.scoring.linkTimeline') },
            { to: '/settings#settings-tracking-heading', label: t('onboarding.scoring.linkTracking') },
            { to: '/settings#personalization', label: t('onboarding.scoring.linkWhyTop') },
        ]
    }
    return []
})

const ctaSafe = computed<OnboardingCardCta | null>(() => {
    if (!props.cta) return null
    if (!isInternalCtaHref(props.cta.href)) return null
    return props.cta
})

function onSkipClick() {
    emit('commit')
    emit('skip')
}

function toggleDetailView() {
    isDetailView.value = !isDetailView.value
}

function showFullText() {
    if (!fullText.value) return
    emit('commit')
    readerDialog.value?.showModal()
    readerVisible.value = true
}

function onReaderClose() {
    readerVisible.value = false
}

const { prefs, update } = useUiPrefs()

function activeSurfaceId(): SurfaceId {
    if (readerVisible.value) return 'reader'
    if (isDetailView.value) return 'card-back'
    return 'card-front'
}

function bumpFontSize(step: 1 | -1) {
    const s = activeSurfaceId()
    const cur = prefs.value.surfaces[s].fontSize
    const next = clampFontSizePxForSurface(cur + step, s)
    if (next == null || next === cur) return
    update({ surfaces: { [s]: { fontSize: next } } })
}

function resetFontSizeToSurfaceDefault() {
    const s = activeSurfaceId()
    const d = SURFACE_DEFAULT_FONT_PX[s]
    if (prefs.value.surfaces[s].fontSize === d) return
    update({ surfaces: { [s]: { fontSize: d } } })
}

function cycleSurfaceFont(delta: 1 | -1) {
    const s = activeSurfaceId()
    const cur = prefs.value.surfaces[s].fontFamily
    const next = cycleFontFamilyId(cur, delta)
    update({ surfaces: { [s]: { fontFamily: next } } })
}

defineShortcuts(
    {
        e: () => {
            if (!props.isSelected || readerVisible.value) return
            toggleDetailView()
        },
        q: () => {
            if (!props.isSelected) return
            if (readerVisible.value) {
                readerDialog.value?.close()
                return
            }
            showFullText()
        },
        escape: () => {
            if (!props.isSelected) return
            if (readerVisible.value) {
                readerDialog.value?.close()
                return
            }
            isDetailView.value = false
        },
    },
    { when: () => props.isSelected === true },
)

defineShortcuts(
    {
        '+': (e) => {
            e.preventDefault()
            bumpFontSize(1)
        },
        '=': (e) => {
            e.preventDefault()
            bumpFontSize(1)
        },
        '-': (e) => {
            e.preventDefault()
            bumpFontSize(-1)
        },
        numpadadd: (e) => {
            e.preventDefault()
            bumpFontSize(1)
        },
        numpadsubtract: (e) => {
            e.preventDefault()
            bumpFontSize(-1)
        },
        '0': (e) => {
            e.preventDefault()
            resetFontSizeToSurfaceDefault()
        },
        numpad0: (e) => {
            e.preventDefault()
            resetFontSizeToSurfaceDefault()
        },
        'shift+k': (e) => {
            e.preventDefault()
            cycleSurfaceFont(-1)
        },
        'shift+l': (e) => {
            e.preventDefault()
            cycleSurfaceFont(1)
        },
    },
    { when: () => props.isSelected === true },
)
</script>

<template>
    <div
        :id="`onboarding/${topic}`"
        class="onboarding-card-container article-container"
        :class="{ 'flip-back': isDetailView, 'flip-front': !isDetailView }"
        data-testid="onboarding-card"
        :data-onboarding-topic="topic"
    >
        <div
            class="onboarding-card onboarding-front infl0-surface-front rounded-xl bg-front relative transition-all"
        >
            <CornerFold
                position="top-right"
                :tooltip="t('onboarding.flipCard')"
                @click="toggleDetailView"
            />
            <div
                class="flex min-h-0 h-4/5 max-h-4/5 w-full flex-col items-stretch px-6 pt-6 pb-2 text-center"
            >
                <div
                    class="infl0-surface-typo-front flex min-h-0 w-full min-w-0 flex-1 flex-col"
                >
                    <h1
                        class="mb-2 w-full shrink-0 text-end text-[length:max(0.7rem,0.78em)] font-bold leading-tight tracking-tighter"
                        :data-onboarding-title="topic"
                    >
                        {{ t(titleKey) }}
                    </h1>
                    <p
                        v-if="frontText"
                        class="onboarding-copy min-h-0 min-w-0 flex-1 cursor-pointer overflow-y-auto text-start text-[1em] leading-relaxed text-[var(--infl0-article-front-fg-dim)] [overflow-wrap:anywhere] sm:text-center"
                        :data-onboarding-front="topic"
                        @click="toggleDetailView"
                    >
                        {{ frontText }}
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
            </div>
            <div class="meta infl0-article-meta-front max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
                <div class="flex w-full flex-wrap items-center gap-2 text-[var(--infl0-article-front-fg-dim)]">
                    <NuxtLink
                        v-if="ctaSafe"
                        :to="ctaSafe.href"
                        class="btn btn-primary btn-sm"
                        :data-onboarding-cta="topic"
                        @click="emit('commit')"
                    >
                        {{ t(ctaSafe.labelKey) }}
                    </NuxtLink>
                    <button
                        v-if="showSkip"
                        type="button"
                        class="btn btn-ghost btn-sm border border-[var(--infl0-field-border)]"
                        data-onboarding-skip
                        @click="onSkipClick"
                    >{{ t('onboarding.skipIntro') }}</button>
                </div>
            </div>
            <FlipArrow class="action-flip-front" direction="front" @click="toggleDetailView" />
        </div>

        <div
            class="onboarding-card onboarding-back infl0-surface-back rounded-xl bg-back relative shadow-inner transition-all text-[var(--infl0-article-back-fg)]"
        >
            <div
                class="flex min-h-0 h-4/5 max-h-4/5 w-full flex-col items-stretch px-6 pt-6 pb-2 text-center"
            >
                <div
                    class="infl0-surface-typo-back flex min-h-0 w-full min-w-0 flex-1 flex-col text-[var(--infl0-article-back-fg)]"
                >
                    <h1
                        class="mb-2 w-full shrink-0 text-end text-[length:max(0.7rem,0.78em)] font-bold leading-tight tracking-tighter text-[var(--infl0-article-back-fg)]"
                    >
                        {{ t(titleKey) }}
                    </h1>
                    <p
                        v-if="backText"
                        class="onboarding-copy min-h-0 min-w-0 flex-1 overflow-y-auto text-start text-[1em] leading-relaxed text-[var(--infl0-article-back-fg-dim)] [overflow-wrap:anywhere] sm:text-center"
                        :data-onboarding-back="topic"
                    >
                        {{ backText }}
                    </p>
                    <div
                        v-else
                        class="onboarding-body-skeleton flex min-h-0 min-w-0 flex-1 flex-col items-stretch gap-2 pt-1"
                        data-testid="onboarding-card-back-skeleton"
                        aria-hidden="true"
                    >
                        <div class="skeleton h-3 w-full" />
                        <div class="skeleton h-3 w-11/12" />
                        <div class="skeleton h-3 w-10/12" />
                        <div class="skeleton h-3 w-9/12" />
                    </div>
                    <p class="m-0 w-full shrink-0 pt-1 text-end text-[0.88em] text-[var(--infl0-article-back-fg-mute)]">
                        <button
                            type="button"
                            class="onboarding-reader-link font-bold"
                            :data-onboarding-open-full="topic"
                            @click="showFullText"
                        >
                            {{ t('onboarding.openFullText') }}
                        </button>
                    </p>
                </div>
            </div>
            <div class="meta infl0-article-meta-back max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
                <div class="flex w-full flex-wrap items-center gap-2 text-[var(--infl0-article-back-fg-mute)]">
                    <NuxtLink
                        v-if="ctaSafe"
                        :to="ctaSafe.href"
                        class="btn btn-primary btn-sm"
                        :data-onboarding-cta="topic"
                        @click="emit('commit')"
                    >
                        {{ t(ctaSafe.labelKey) }}
                    </NuxtLink>
                </div>
            </div>
            <FlipArrow class="action-flip-back" direction="back" @click="toggleDetailView" />
        </div>
        <dialog
            ref="readerDialog"
            class="modal"
            @close="onReaderClose"
            @cancel="onReaderClose"
        >
            <div
                class="modal-box max-w-[100vw] w-[640px] border border-[var(--infl0-surface-reader-border)] bg-[var(--infl0-surface-reader-bg)] text-[var(--infl0-surface-reader-text)]"
            >
                <form method="dialog" class="mb-2 flex justify-end">
                    <button class="btn btn-sm btn-circle btn-ghost">✕</button>
                </form>
                <div
                    class="max-h-[80vh] h-full w-full min-w-0 overflow-y-auto infl0-surface-reader infl0-surface-typo-reader prose max-w-none md:p-2 text-[var(--infl0-surface-reader-text)] prose-headings:font-semibold prose-headings:text-[var(--infl0-surface-reader-text)] prose-p:text-[var(--infl0-surface-reader-text)] prose-a:text-[var(--infl0-reader-link)]"
                >
                    <p
                        v-if="readerVisible && fullText"
                        class="whitespace-pre-line text-[1em]"
                        :data-onboarding-full="topic"
                    >
                        {{ fullText }}
                    </p>
                    <div v-if="readerVisible && fullTextLinks.length > 0" class="mt-4 flex flex-wrap gap-2">
                        <NuxtLink
                            v-for="link in fullTextLinks"
                            :key="link.to"
                            :to="link.to"
                            class="btn btn-sm btn-ghost border border-[var(--infl0-field-border)]"
                            @click="emit('commit')"
                        >
                            {{ link.label }}
                        </NuxtLink>
                    </div>
                    <div
                        v-if="!readerVisible || !fullText"
                        class="onboarding-body-skeleton flex min-h-0 min-w-0 flex-1 flex-col items-stretch gap-2 pt-1"
                        data-testid="onboarding-card-full-skeleton"
                        aria-hidden="true"
                    >
                        <div class="skeleton h-3 w-full" />
                        <div class="skeleton h-3 w-11/12" />
                        <div class="skeleton h-3 w-10/12" />
                        <div class="skeleton h-3 w-9/12" />
                    </div>
                </div>
                <form method="dialog" class="mt-4 flex justify-end">
                    <button class="btn btn-primary btn-sm">{{ t('common.close') }}</button>
                </form>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>{{ t('common.close') }}</button>
            </form>
        </dialog>
    </div>
</template>

<style scoped>
.onboarding-card-container {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    perspective: 1000px;
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
    backface-visibility: hidden;
    transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

.onboarding-back {
    transform: rotateY(180deg);
    box-shadow: inset 0 8px 15px rgb(0 0 0 / 20%);
}

.bg-back {
    background-color: var(--infl0-card-back);
}

.onboarding-reader-link {
    color: var(--infl0-article-back-fg-dim);
    text-decoration: underline;
}

.onboarding-reader-link:hover {
    color: var(--infl0-article-back-fg);
}

.flip-back {
    animation: flip-back 0.5s cubic-bezier(0.445, 0.05, 0.55, 0.95) both;
}

.flip-front {
    animation: flip-front 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) both;
}

.action-flip-front {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    color: var(--infl0-article-front-fg-mute);
}

.action-flip-back {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    color: var(--infl0-article-back-fg-mute);
}

@keyframes flip-back {
    0% {
        transform: translateX(0) rotateY(0);
        transform-origin: 0% 50%;
    }

    100% {
        transform: translateX(-100%) rotateY(-180deg);
        transform-origin: 100% 50%;
    }
}

@keyframes flip-front {
    0% {
        transform: translateX(100%) rotateY(-180deg);
        transform-origin: 0% 50%;
    }

    100% {
        transform: translateX(0) rotateY(0);
        transform-origin: 100% 50%;
    }
}

@media (prefers-reduced-motion: reduce) {
    .onboarding-card-container {
        perspective: none;
        transform-style: flat;
        animation: none !important;
    }

    .onboarding-card-container.flip-back,
    .onboarding-card-container.flip-front {
        animation: none !important;
    }

    .onboarding-front,
    .onboarding-back {
        transition: none !important;
    }

    .onboarding-card-container.flip-front .onboarding-back {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: none;
    }

    .onboarding-card-container.flip-front .onboarding-front {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
    }

    .onboarding-card-container.flip-back .onboarding-front {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
    }

    .onboarding-card-container.flip-back .onboarding-back {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: none;
    }
}
</style>
