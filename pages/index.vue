<script setup lang="ts">
type TimelineArticle = {
    id: string
    title: string
    teaser: string
    summary_long: string
    link: string
    publishedAt: string
    category?: string[]
    source_type: string
    tld?: string
    author?: string
    rawMarkdown?: string
}

type UserFeedRow = {
    id: string
    feedUrl: string
    crawlKey: string
    displayTitle: string | null
    createdAt: string
}

const { t } = useI18n()
const toast = useToast()

async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    await navigateTo('/login')
}

const PAGE_SIZE = 20
/** Load next page when the user is this many pixels from the bottom (prefetch). */
const SCROLL_PRELOAD_PX = 520

const articles = ref<TimelineArticle[]>([])
const timelineHasMore = ref(true)
const timelinePending = ref(false)
const timelineScrollEl = ref<HTMLElement | null>(null)

/** SSR: forward `Cookie` from the incoming request to internal API calls (plain `$fetch` does not). */
const requestFetch = useRequestFetch()

async function loadTimelinePage(reset: boolean) {
    if (timelinePending.value) return
    if (!reset && !timelineHasMore.value) return
    timelinePending.value = true
    try {
        const offset = reset ? 0 : articles.value.length
        const res = await requestFetch<{ items: TimelineArticle[]; hasMore: boolean }>('/api/timeline', {
            credentials: 'include',
            query: { limit: PAGE_SIZE, offset },
        })
        if (reset) {
            articles.value = res.items
        } else if (res.items.length > 0) {
            articles.value.push(...res.items)
        }
        timelineHasMore.value = res.hasMore
    } catch (e: unknown) {
        const { statusCode, message } = parseFetchError(e)
        if (statusCode === 401) {
            await navigateTo('/login')
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
                            void retryTimeline()
                        },
                    },
                ],
            })
        }
    } finally {
        timelinePending.value = false
    }
}

async function retryTimeline() {
    await loadTimelinePage(true)
    await nextTick()
    await fillTimelineUntilScrollableOrDone()
}

async function fillTimelineUntilScrollableOrDone() {
    for (;;) {
        const el = timelineScrollEl.value
        if (!el || timelinePending.value || !timelineHasMore.value) return
        if (el.scrollHeight > el.clientHeight + SCROLL_PRELOAD_PX) return
        await loadTimelinePage(false)
        await nextTick()
    }
}

await loadTimelinePage(true)

const {
    data: feedsData,
    refresh: refreshFeeds,
    error: feedsFetchError,
} = await useFetch<{ feeds: UserFeedRow[] }>('/api/feeds', {
    credentials: 'include',
    key: 'user-feeds',
})

watch(
    feedsFetchError,
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

const fromDatabase = computed(() => articles.value.length > 0)
const feedList = computed(() => feedsData.value?.feeds ?? [])
const showOnboarding = computed(() => !fromDatabase.value && feedList.value.length === 0)
const showWaiting = computed(() => !fromDatabase.value && feedList.value.length > 0)

const newFeedUrl = ref('')
const newDisplayTitle = ref('')
const addError = ref('')
const addPending = ref(false)

async function addFeed() {
    addError.value = ''
    addPending.value = true
    try {
        await $fetch('/api/feeds', {
            method: 'POST',
            body: {
                feedUrl: newFeedUrl.value.trim(),
                displayTitle: newDisplayTitle.value.trim() || undefined,
            },
            credentials: 'include',
        })
        newFeedUrl.value = ''
        newDisplayTitle.value = ''
        await refreshFeeds()
        await loadTimelinePage(true)
        toast.push({ message: t('index.toastSourceSaved'), variant: 'success' })
    } catch (e: unknown) {
        const { statusCode, message } = parseFetchError(e)
        if (statusCode === 401) {
            await navigateTo('/login')
            return
        }
        addError.value = message.trim() || t('index.errorSaveSource')
        toast.push({ message: addError.value, variant: 'error', durationMs: 8000 })
    } finally {
        addPending.value = false
    }
}

async function refreshAll() {
    addError.value = ''
    await refreshFeeds()
    await loadTimelinePage(true)
    await nextTick()
    await fillTimelineUntilScrollableOrDone()
}

const removingId = ref<string | null>(null)

async function removeFeed(id: string) {
    removingId.value = id
    try {
        await $fetch(`/api/feeds/${id}`, { method: 'DELETE', credentials: 'include' })
        await refreshFeeds()
        await loadTimelinePage(true)
        toast.push({ message: t('index.toastSourceRemoved'), variant: 'success' })
    } catch (e: unknown) {
        const { statusCode, message } = parseFetchError(e)
        if (statusCode === 401) {
            await navigateTo('/login')
            return
        }
        const text = message.trim() || t('index.errorRemoveSource')
        toast.push({ message: text, variant: 'error', durationMs: 8000 })
    } finally {
        removingId.value = null
    }
}

const currentIndex = ref(0)

watch(
    () => articles.value.length,
    (len) => {
        if (articleContainers.value.length > len) {
            articleContainers.value.length = len
        }
        if (currentIndex.value >= len) {
            currentIndex.value = Math.max(0, len - 1)
        }
    },
)

const articleContainers = ref<(HTMLElement | null)[]>([])

function setArticleEl(el: unknown, index: number) {
    while (articleContainers.value.length <= index) {
        articleContainers.value.push(null)
    }
    articleContainers.value[index] = el instanceof HTMLElement ? el : null
}

function onTimelineScroll() {
    const el = timelineScrollEl.value
    if (!el) return

    if (!timelinePending.value && timelineHasMore.value) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_PRELOAD_PX) {
            void loadTimelinePage(false)
        }
    }

    const currentEl = articleContainers.value.find((node) => node && isMoreThan50PercentVisible(node))
    currentIndex.value =
        currentEl !== undefined ? articleContainers.value.indexOf(currentEl) : -1
}

function gotoNextArticle(event: KeyboardEvent) {
    event.stopPropagation()
    if (!fromDatabase.value) return
    if (currentIndex.value < articles.value.length - 1) {
        articleContainers.value[currentIndex.value + 1]?.scrollIntoView({
            behavior: 'smooth',
        })
    }
}

function gotoPreviousArticle(event: KeyboardEvent) {
    event.stopPropagation()
    if (!fromDatabase.value) return
    if (currentIndex.value > 0) {
        articleContainers.value[currentIndex.value - 1]?.scrollIntoView({
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

defineShortcuts({
    arrowup: gotoPreviousArticle,
    w: gotoPreviousArticle,
    arrowdown: gotoNextArticle,
    s: gotoNextArticle,
})

onMounted(async () => {
    await nextTick()
    await fillTimelineUntilScrollableOrDone()
})
</script>

<template>
    <div class="bg-gray-400 text-white h-dvh w-full flex justify-center items-center relative">
        <div class="absolute bottom-3 end-3 z-20">
            <LocaleSwitcher />
        </div>

        <details
            v-if="fromDatabase && feedList.length > 0"
            class="absolute top-3 start-3 z-20 max-w-[min(100vw-6rem,22rem)]"
        >
            <summary
                class="btn btn-sm btn-ghost text-gray-800 hover:bg-gray-500/30 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
            >
                {{ $t('index.sources') }}
            </summary>
            <ul
                class="mt-2 text-sm space-y-2 rounded-lg border border-gray-700 bg-gray-900/95 p-3 text-gray-100 max-h-[40vh] overflow-y-auto shadow-xl"
            >
                <li
                    v-for="f in feedList"
                    :key="f.id"
                    class="flex items-start justify-between gap-3 border-b border-gray-700/80 pb-2 last:border-0 last:pb-0"
                >
                    <div class="min-w-0 flex-1 break-all">
                        <div class="font-medium text-gray-200">
                            {{ f.displayTitle || f.feedUrl }}
                        </div>
                        <div class="text-xs text-gray-500 mt-0.5 font-mono">{{ f.crawlKey }}</div>
                    </div>
                    <button
                        type="button"
                        class="btn btn-ghost btn-xs shrink-0 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                        :disabled="removingId === f.id"
                        @click="removeFeed(f.id)"
                    >
                        {{ removingId === f.id ? $t('common.loading') : $t('index.remove') }}
                    </button>
                </li>
            </ul>
        </details>

        <button
            type="button"
            class="absolute top-3 end-3 z-20 btn btn-sm btn-ghost text-gray-800 hover:bg-gray-500/30"
            @click="logout"
        >
            {{ $t('index.logOut') }}
        </button>

        <div
            v-if="showOnboarding"
            class="relative z-10 w-full max-w-md mx-auto px-4 py-8 text-gray-900"
        >
            <div class="rounded-xl bg-gray-900/90 text-gray-100 p-8 shadow-xl border border-gray-700">
                <h1 class="text-xl font-semibold mb-2">{{ $t('index.addSourcesTitle') }}</h1>
                <p class="text-sm text-gray-400 mb-6">
                    {{ $t('index.addSourcesBody') }}
                </p>
                <form class="flex flex-col gap-4" @submit.prevent="addFeed">
                    <label class="flex flex-col gap-1 text-sm">
                        <span class="text-gray-400">{{ $t('index.feedUrl') }}</span>
                        <input
                            v-model="newFeedUrl"
                            type="url"
                            required
                            :placeholder="$t('index.feedUrlPlaceholder')"
                            class="input input-bordered w-full bg-gray-800 border-gray-600"
                        >
                    </label>
                    <label class="flex flex-col gap-1 text-sm">
                        <span class="text-gray-400">{{ $t('index.displayNameOptional') }}</span>
                        <input
                            v-model="newDisplayTitle"
                            type="text"
                            class="input input-bordered w-full bg-gray-800 border-gray-600"
                        >
                    </label>
                    <p v-if="addError" class="text-sm text-red-400">{{ addError }}</p>
                    <button type="submit" class="btn btn-primary w-full" :disabled="addPending">
                        {{ addPending ? $t('common.loading') : $t('index.saveSource') }}
                    </button>
                </form>
            </div>
        </div>

        <div
            v-else-if="showWaiting"
            class="relative z-10 w-full max-w-lg mx-auto px-4 py-8 text-gray-900"
        >
            <div class="rounded-xl bg-gray-900/90 text-gray-100 p-8 shadow-xl border border-gray-700">
                <h1 class="text-xl font-semibold mb-2">{{ $t('index.preparingTitle') }}</h1>
                <p class="text-sm text-gray-400 mb-4">
                    {{ $t('index.preparingBody') }}
                </p>
                <ul class="text-sm space-y-2 mb-6 border border-gray-700 rounded-lg p-3 bg-gray-800/50">
                    <li
                        v-for="f in feedList"
                        :key="f.id"
                        class="flex items-start justify-between gap-3 border-b border-gray-700/60 pb-2 last:border-0 last:pb-0"
                    >
                        <div class="min-w-0 flex-1 break-all">
                            <span class="font-medium text-gray-200">{{
                                f.displayTitle || f.feedUrl
                            }}</span>
                            <div class="text-xs text-gray-500 mt-0.5 font-mono">{{ f.crawlKey }}</div>
                        </div>
                        <button
                            type="button"
                            class="btn btn-ghost btn-xs shrink-0 text-red-400 hover:bg-red-950/40 hover:text-red-300"
                            :disabled="removingId === f.id"
                            @click="removeFeed(f.id)"
                        >
                            {{ removingId === f.id ? $t('common.loading') : $t('index.remove') }}
                        </button>
                    </li>
                </ul>
                <button
                    type="button"
                    class="btn btn-outline btn-sm border-gray-600 mb-6"
                    @click="refreshAll"
                >
                    {{ $t('index.refreshTimeline') }}
                </button>
                <h2 class="text-sm font-medium text-gray-300 mb-2">{{ $t('index.addAnotherSource') }}</h2>
                <form class="flex flex-col gap-3" @submit.prevent="addFeed">
                    <input
                        v-model="newFeedUrl"
                        type="url"
                        required
                        :placeholder="$t('index.feedUrlPlaceholder')"
                        class="input input-bordered input-sm w-full bg-gray-800 border-gray-600"
                    >
                    <input
                        v-model="newDisplayTitle"
                        type="text"
                        :placeholder="$t('index.displayNameOptional')"
                        class="input input-bordered input-sm w-full bg-gray-800 border-gray-600"
                    >
                    <p v-if="addError" class="text-sm text-red-400">{{ addError }}</p>
                    <button type="submit" class="btn btn-primary btn-sm w-full" :disabled="addPending">
                        {{ addPending ? $t('common.loading') : $t('index.add') }}
                    </button>
                </form>
            </div>
        </div>

        <div
            v-else
            ref="timelineScrollEl"
            class="scroll-container relative h-dvh w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
            @scroll.passive="onTimelineScroll"
        >
            <div
                v-for="(article, index) in articles"
                :key="article.id"
                :ref="(el) => setArticleEl(el, index)"
                class="my-1 max-w-full landscape:aspect-smartphone landscape:h-[95%] portrait:h-full snap-start mx-auto snap-always"
            >
                <ArticleView
                    v-if="article"
                    class="article rounded-xl"
                    :article="article"
                    :is-selected="index === currentIndex"
                />
            </div>
            <div
                v-if="timelinePending && articles.length > 0 && timelineHasMore"
                class="h-24 w-full shrink-0 flex items-center justify-center opacity-40 pointer-events-none"
                aria-hidden="true"
            >
                <span class="loading loading-spinner loading-md text-gray-800" />
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
