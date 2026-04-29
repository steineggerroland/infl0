<script setup lang="ts">
import type { OnboardingTopic, OnboardingCardCta } from '~/utils/onboarding-cards'

definePageMeta({
    layout: 'app',
})

type InflowArticle = {
    type: 'article'
    id: string
    title: string
    teaser: string
    summary_long: string
    link: string
    publishedAt: string
    /** Crawler fetch time (ISO); for score normalization */
    fetchedAt?: string
    /** When the item entered this user’s inflow (ISO) */
    insertedAt?: string
    readAt?: string | null
    category?: string[]
    tags?: string[]
    source_type: string
    tld?: string
    author?: string
    rawMarkdown?: string
}

type InflowOnboarding = {
    type: 'onboarding'
    id: string
    topic: OnboardingTopic
    ordinal: number
    hasDeviceVariants: boolean
    cta?: OnboardingCardCta
}

type InflowItem = InflowArticle | InflowOnboarding

type UserFeedRow = {
    id: string
    feedUrl: string
    displayTitle: string | null
    createdAt: string
}

const { t } = useI18n()
const toast = useToast()

const PAGE_SIZE = 20
/** Load next page when the user is this many pixels from the bottom (prefetch). */
const SCROLL_PRELOAD_PX = 520

// Shared across inflow + `AppUserMenu`; persistence is handled by the
// composable, so this page only reacts to changes to refetch.
const { showRead, toggleShowRead } = useTimelinePreferences()

// Skip-button on the intro card and the settings toggle both write
// `uiPrefs.onboardingHidden`. Hide cards optimistically the moment the
// user clicks *Skip introduction*; the PATCH happens via `useUiPrefs`.
const { prefs: uiPrefs, update: updateUiPrefs } = useUiPrefs()

const items = ref<InflowItem[]>([])
const inflowHasMore = ref(true)
const inflowPending = ref(false)
const inflowScrollEl = ref<HTMLElement | null>(null)
const inflowStats = ref({ total: 0, unread: 0 })

/** SSR: forward `Cookie` from the incoming request to internal API calls (plain `$fetch` does not). */
const requestFetch = useRequestFetch()

async function loadInflowPage(reset: boolean) {
    if (inflowPending.value) return
    if (!reset && !inflowHasMore.value) return
    inflowPending.value = true
    try {
        const articleOffset = reset ? 0 : items.value.filter((i) => i.type === 'article').length
        const res = await requestFetch<{
            items: InflowItem[]
            hasMore: boolean
            stats: { total: number; unread: number }
        }>('/api/inflow', {
            credentials: 'include',
            query: {
                limit: PAGE_SIZE,
                offset: articleOffset,
                ...(showRead.value ? { showRead: '1' } : {}),
            },
        })
        if (res.stats) {
            inflowStats.value = res.stats
        }
        if (reset) {
            items.value = res.items
        } else if (res.items.length > 0) {
            // Subsequent pages contain article rows only — onboarding cards are
            // emitted on the first page exclusively (server contract).
            items.value.push(...res.items)
        }
        inflowHasMore.value = res.hasMore
    } catch (e: unknown) {
        const { statusCode, message } = parseFetchError(e)
        if (statusCode === 401) {
            // SSR: auth middleware should already redirect signed-out users away from `/`.
            // Calling `navigateTo` from setup after an `await` can leave the renderer
            // without a Nuxt instance and surface 500 "instance unavailable".
            if (import.meta.client) {
                await navigateTo('/login')
            }
            return
        }
        const text = message.trim() || t('index.errorTimeline')
        if (import.meta.client) {
            toast.push({
                message: text,
                variant: 'error',
                durationMs: 0,
                actions: [
                    {
                        label: t('common.retry'),
                        onClick: () => {
                            void retryInflow()
                        },
                    },
                ],
            })
        }
    } finally {
        inflowPending.value = false
    }
}

async function retryInflow() {
    await loadInflowPage(true)
    await nextTick()
    await fillInflowUntilScrollableOrDone()
}

async function fillInflowUntilScrollableOrDone() {
    for (;;) {
        const el = inflowScrollEl.value
        if (!el || inflowPending.value || !inflowHasMore.value) return
        if (el.scrollHeight > el.clientHeight + SCROLL_PRELOAD_PX) return
        await loadInflowPage(false)
        await nextTick()
    }
}

watch(showRead, () => {
    void loadInflowPage(true).then(async () => {
        await nextTick()
        await fillInflowUntilScrollableOrDone()
    })
})

await loadInflowPage(true)

const feedsData = ref<{ feeds: UserFeedRow[] } | null>(null)
const feedsError = ref<unknown>(null)

async function refreshFeeds() {
    feedsError.value = null
    try {
        feedsData.value = await requestFetch<{ feeds: UserFeedRow[] }>('/api/feeds', {
            credentials: 'include',
        })
    } catch (e) {
        feedsError.value = e
        feedsData.value = { feeds: [] }
    }
}

await refreshFeeds()

watch(
    feedsError,
    (err) => {
        if (!import.meta.client || !err) return
        const { message } = parseFetchError(err)
        const text = message.trim() || t('index.errorSources')
        toast.push({
            message: text,
            variant: 'error',
            durationMs: 0,
            actions: [
                {
                    label: t('common.retry'),
                    onClick: () => {
                        void refreshFeeds()
                    },
                },
            ],
        })
    },
    { flush: 'post', immediate: true },
)

const feedList = computed(() => feedsData.value?.feeds ?? [])
const articleItems = computed(() =>
    items.value.filter((i): i is InflowArticle => i.type === 'article'),
)
const onboardingItems = computed(() =>
    items.value.filter((i): i is InflowOnboarding => i.type === 'onboarding'),
)
const hasArticles = computed(() => inflowStats.value.total > 0)
const hasOnboarding = computed(() => onboardingItems.value.length > 0)
const showOnboardingEmpty = computed(
    () => !hasArticles.value && feedList.value.length === 0 && !hasOnboarding.value,
)
const showWaiting = computed(
    () => !hasArticles.value && feedList.value.length > 0 && !hasOnboarding.value,
)
const showAllReadEmpty = computed(
    () =>
        hasArticles.value &&
        inflowStats.value.unread === 0 &&
        !showRead.value &&
        !hasOnboarding.value,
)

async function refreshAll() {
    await refreshFeeds()
    await loadInflowPage(true)
    await nextTick()
    await fillInflowUntilScrollableOrDone()
}

const currentIndex = ref(0)

watch(
    () => items.value.length,
    (len) => {
        if (cardContainers.value.length > len) {
            cardContainers.value.length = len
        }
        if (currentIndex.value >= len) {
            currentIndex.value = Math.max(0, len - 1)
        }
    },
)

const cardContainers = ref<(HTMLElement | null)[]>([])

function setCardEl(el: unknown, index: number) {
    while (cardContainers.value.length <= index) {
        cardContainers.value.push(null)
    }
    cardContainers.value[index] = el instanceof HTMLElement ? el : null
}

function onInflowScroll() {
    const el = inflowScrollEl.value
    if (!el) return

    if (!inflowPending.value && inflowHasMore.value) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_PRELOAD_PX) {
            void loadInflowPage(false)
        }
    }

    const currentEl = cardContainers.value.find((node) => node && isMoreThan50PercentVisible(node))
    currentIndex.value =
        currentEl !== undefined ? cardContainers.value.indexOf(currentEl) : -1
}

function gotoNextCard(event: KeyboardEvent) {
    event.stopPropagation()
    if (items.value.length === 0) return
    if (currentIndex.value < items.value.length - 1) {
        cardContainers.value[currentIndex.value + 1]?.scrollIntoView({
            behavior: 'smooth',
        })
    }
}

function gotoPreviousCard(event: KeyboardEvent) {
    event.stopPropagation()
    if (items.value.length === 0) return
    if (currentIndex.value > 0) {
        cardContainers.value[currentIndex.value - 1]?.scrollIntoView({
            behavior: 'smooth',
        })
    }
}

function isMoreThan50PercentVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
    return visibleHeight > rect.height / 2
}

async function onSkipOnboarding() {
    // Optimistic: drop onboarding rows from the rendered list immediately so
    // the user sees the cards disappear before the PATCH round-trip lands.
    items.value = items.value.filter((i) => i.type !== 'onboarding')
    if (currentIndex.value >= items.value.length) {
        currentIndex.value = Math.max(0, items.value.length - 1)
    }
    if (uiPrefs.value.onboardingHidden) return
    updateUiPrefs({ onboardingHidden: true })
}

// Inflow navigation and the global `r` toggle must yield to any open
// modal-like surface (full-text article, InfoPopover). Without this
// guard the background article silently changed while a modal was on
// screen, so the content no longer matched what the user was reading.
const { anyOpen: anyModalOpen } = useModalStack()

defineShortcuts(
    {
        arrowup: gotoPreviousCard,
        w: gotoPreviousCard,
        arrowdown: gotoNextCard,
        s: gotoNextCard,
        r: (event) => {
            event.preventDefault()
            toggleShowRead()
        },
    },
    { when: () => !anyModalOpen.value },
)

onMounted(async () => {
    await nextTick()
    await fillInflowUntilScrollableOrDone()
})
</script>

<template>
    <div class="h-dvh w-full flex justify-center items-center relative text-[var(--infl0-canvas-fg)]">
        <div
            v-if="showOnboardingEmpty"
            class="relative z-10 mx-auto w-full max-w-md px-4 py-8"
        >
            <div class="infl0-panel p-8 text-center">
                <h1 class="text-xl font-semibold mb-2">{{ $t('index.emptyNoFeedsTitle') }}</h1>
                <p class="infl0-panel-muted mb-6 text-sm">
                    {{ $t('index.emptyNoFeedsBody') }}
                </p>
                <NuxtLink to="/feeds" class="btn btn-primary w-full">
                    {{ $t('index.emptyNoFeedsCta') }}
                </NuxtLink>
            </div>
        </div>

        <div
            v-else-if="showWaiting"
            class="relative z-10 mx-auto w-full max-w-lg px-4 py-8"
        >
            <div class="infl0-panel p-8">
                <h1 class="text-xl font-semibold mb-2">{{ $t('index.preparingTitle') }}</h1>
                <p class="infl0-panel-muted mb-4 text-sm">
                    {{ $t('index.preparingBody') }}
                </p>
                <ul
                    class="mb-6 space-y-2 rounded-lg border p-3 text-sm"
                    style="
                      border-color: var(--infl0-panel-border);
                      background-color: var(--infl0-surface-dim);
                    "
                >
                    <li
                        v-for="f in feedList"
                        :key="f.id"
                        class="border-b border-[var(--infl0-panel-border)]/60 pb-2 last:border-0 last:pb-0"
                    >
                        <div class="min-w-0 break-all">
                            <span class="font-medium text-[var(--infl0-panel-text)]">{{
                                f.displayTitle || f.feedUrl
                            }}</span>
                            <div
                                v-if="f.displayTitle"
                                class="infl0-panel-muted mt-0.5 break-all font-mono text-xs"
                            >
                                {{ f.feedUrl }}
                            </div>
                        </div>
                    </li>
                </ul>
                <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                        type="button"
                        class="btn btn-outline btn-sm flex-1 border-[var(--infl0-field-border)]"
                        @click="refreshAll"
                    >
                        {{ $t('index.refreshTimeline') }}
                    </button>
                    <NuxtLink
                        to="/feeds"
                        class="btn btn-ghost btn-sm flex-1 border border-[var(--infl0-field-border)]"
                    >
                        {{ $t('index.manageFeeds') }}
                    </NuxtLink>
                </div>
            </div>
        </div>

        <div
            v-else-if="showAllReadEmpty"
            class="relative z-10 mx-auto w-full max-w-lg px-4 py-8"
        >
            <div class="infl0-panel p-8 text-center">
                <h1 class="text-xl font-semibold mb-2">{{ $t('index.allReadTitle') }}</h1>
                <p class="infl0-panel-muted mb-6 text-sm">
                    {{ $t('index.allReadBody') }}
                </p>
                <label class="flex cursor-pointer items-center justify-center gap-3 text-sm text-[var(--infl0-panel-text)]">
                    <span>{{ $t('index.showReadLabel') }}</span>
                    <input v-model="showRead" type="checkbox" role="switch" class="toggle toggle-primary" >
                </label>
            </div>
        </div>

        <div
            v-else
            ref="inflowScrollEl"
            class="scroll-container relative h-dvh w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
            @scroll.passive="onInflowScroll"
        >
            <div
                v-for="(item, index) in items"
                :key="item.id"
                :ref="(el) => setCardEl(el, index)"
                class="my-1 max-w-full landscape:aspect-smartphone landscape:h-[95%] portrait:h-full snap-start mx-auto snap-always"
            >
                <ArticleView
                    v-if="item.type === 'article'"
                    class="article rounded-xl"
                    :article="item"
                    :is-selected="index === currentIndex"
                />
                <OnboardingCardView
                    v-else
                    class="article rounded-xl"
                    :topic="item.topic"
                    :cta="item.cta"
                    :has-device-variants="item.hasDeviceVariants"
                    :is-selected="index === currentIndex"
                    @skip="onSkipOnboarding"
                />
            </div>
            <div
                v-if="inflowPending && articleItems.length > 0 && inflowHasMore"
                class="h-24 w-full shrink-0 flex items-center justify-center opacity-40 pointer-events-none"
                aria-hidden="true"
            >
                <span class="loading loading-spinner loading-md text-[var(--infl0-canvas-fg-muted)]" />
            </div>
        </div>

    </div>
</template>

<style scoped>
.scroll-container {
    scroll-behavior: smooth;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scroll-container::-webkit-scrollbar {
    display: none;
}
</style>
