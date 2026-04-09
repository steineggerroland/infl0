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

async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    await navigateTo('/login')
}

const { data: timelineData, refresh: refreshTimeline } = await useFetch<{
    items: { article: TimelineArticle }[]
}>('/api/timeline', {
    query: { limit: 100 },
    credentials: 'include',
    key: 'timeline',
})

const { data: feedsData, refresh: refreshFeeds } = await useFetch<{ feeds: UserFeedRow[] }>(
    '/api/feeds',
    {
        credentials: 'include',
        key: 'user-feeds',
    },
)

const articles = ref<TimelineArticle[]>([])

const fromDatabase = computed(() => (timelineData.value?.items?.length ?? 0) > 0)
const feedList = computed(() => feedsData.value?.feeds ?? [])
const showOnboarding = computed(() => !fromDatabase.value && feedList.value.length === 0)
const showWaiting = computed(() => !fromDatabase.value && feedList.value.length > 0)

watch(
    () => timelineData.value?.items,
    (items) => {
        if (items?.length) {
            articles.value = items.map((i) => i.article)
        } else {
            articles.value = []
        }
    },
    { immediate: true, deep: true },
)

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
        await refreshTimeline()
    } catch (e: unknown) {
        const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
        addError.value =
            err?.data?.statusMessage ?? err?.statusMessage ?? 'Quelle konnte nicht gespeichert werden'
    } finally {
        addPending.value = false
    }
}

async function refreshAll() {
    await refreshFeeds()
    await refreshTimeline()
}

// Track the current article index
const currentIndex = ref(0)

watch(
    () => articles.value.length,
    (len) => {
        if (currentIndex.value >= len) {
            currentIndex.value = Math.max(0, len - 1)
        }
    },
)

// Store references to all article containers
const articleContainers = ref<HTMLElement[]>([])

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

const setItemRef = (el: unknown) => {
    if (el instanceof HTMLElement && !articleContainers.value.includes(el)) {
        articleContainers.value.push(el)
    }
}

defineShortcuts({
    arrowup: gotoPreviousArticle,
    w: gotoPreviousArticle,
    arrowdown: gotoNextArticle,
    s: gotoNextArticle,
})

onMounted(() => {
    const scrollContainer = document.querySelector('.scroll-container')

    const detectCurrentArticleHandler = () => {
        const currentEl = articleContainers.value.find((el) => isMoreThan50PercentVisible(el))
        currentIndex.value = articleContainers.value.indexOf(currentEl)
    }

    scrollContainer?.addEventListener('scroll', detectCurrentArticleHandler)

    onUnmounted(() => {
        scrollContainer?.removeEventListener('scroll', detectCurrentArticleHandler)
    })
})
</script>

<template>
    <div class="bg-gray-400 text-white h-dvh w-full flex justify-center items-center relative">
        <button
            type="button"
            class="absolute top-3 end-3 z-20 btn btn-sm btn-ghost text-gray-800 hover:bg-gray-500/30"
            @click="logout"
        >
            Log out
        </button>

        <!-- Onboarding: no timeline, no feeds -->
        <div
            v-if="showOnboarding"
            class="relative z-10 w-full max-w-md mx-auto px-4 py-8 text-gray-900"
        >
            <div class="rounded-xl bg-gray-900/90 text-gray-100 p-8 shadow-xl border border-gray-700">
                <h1 class="text-xl font-semibold mb-2">Quellen hinzufügen</h1>
                <p class="text-sm text-gray-400 mb-6">
                    Deine Timeline zeigt nur Artikel aus Quellen, die du hier einträgst. Der Crawler muss
                    dieselbe Feed-URL (normalisiert als <span class="text-gray-500">crawlKey</span>) beim
                    Import verwenden.
                </p>
                <form class="flex flex-col gap-4" @submit.prevent="addFeed">
                    <label class="flex flex-col gap-1 text-sm">
                        <span class="text-gray-400">Feed-URL</span>
                        <input
                            v-model="newFeedUrl"
                            type="url"
                            required
                            placeholder="https://…"
                            class="input input-bordered w-full bg-gray-800 border-gray-600"
                        />
                    </label>
                    <label class="flex flex-col gap-1 text-sm">
                        <span class="text-gray-400">Anzeigename (optional)</span>
                        <input
                            v-model="newDisplayTitle"
                            type="text"
                            class="input input-bordered w-full bg-gray-800 border-gray-600"
                        />
                    </label>
                    <p v-if="addError" class="text-sm text-red-400">{{ addError }}</p>
                    <button type="submit" class="btn btn-primary w-full" :disabled="addPending">
                        {{ addPending ? '…' : 'Quelle speichern' }}
                    </button>
                </form>
            </div>
        </div>

        <!-- Waiting: feeds exist, timeline still empty -->
        <div
            v-else-if="showWaiting"
            class="relative z-10 w-full max-w-lg mx-auto px-4 py-8 text-gray-900"
        >
            <div class="rounded-xl bg-gray-900/90 text-gray-100 p-8 shadow-xl border border-gray-700">
                <h1 class="text-xl font-semibold mb-2">Timeline wird vorbereitet</h1>
                <p class="text-sm text-gray-400 mb-4">
                    Sobald der Crawler Artikel mit passendem <code class="text-gray-500">crawlKey</code>
                    liefert, erscheinen sie hier.
                </p>
                <ul class="text-sm space-y-2 mb-6 border border-gray-700 rounded-lg p-3 bg-gray-800/50">
                    <li v-for="f in feedList" :key="f.id" class="break-all">
                        <span class="font-medium text-gray-200">{{
                            f.displayTitle || f.feedUrl
                        }}</span>
                        <div class="text-xs text-gray-500 mt-0.5 font-mono">{{ f.crawlKey }}</div>
                    </li>
                </ul>
                <button
                    type="button"
                    class="btn btn-outline btn-sm border-gray-600 mb-6"
                    @click="refreshAll"
                >
                    Timeline aktualisieren
                </button>
                <h2 class="text-sm font-medium text-gray-300 mb-2">Weitere Quelle</h2>
                <form class="flex flex-col gap-3" @submit.prevent="addFeed">
                    <input
                        v-model="newFeedUrl"
                        type="url"
                        required
                        placeholder="https://…"
                        class="input input-bordered input-sm w-full bg-gray-800 border-gray-600"
                    />
                    <input
                        v-model="newDisplayTitle"
                        type="text"
                        placeholder="Anzeigename (optional)"
                        class="input input-bordered input-sm w-full bg-gray-800 border-gray-600"
                    />
                    <p v-if="addError" class="text-sm text-red-400">{{ addError }}</p>
                    <button type="submit" class="btn btn-primary btn-sm w-full" :disabled="addPending">
                        {{ addPending ? '…' : 'Hinzufügen' }}
                    </button>
                </form>
            </div>
        </div>

        <!-- Timeline with articles -->
        <div
            v-else
            class="scroll-container relative h-dvh w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
        >
            <div
                class="my-1 max-w-full landscape:aspect-smartphone landscape:h-[95%] portrait:h-full snap-start mx-auto snap-always"
                v-for="(article, index) in articles"
                :key="article.id"
                :ref="setItemRef"
            >
                <ArticleView
                    class="article rounded-xl"
                    v-if="article"
                    :article="article"
                    :is-selected="index === currentIndex"
                />
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
