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

async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    await navigateTo('/login')
}

const { data: timelineData } = await useFetch<{ items: { article: TimelineArticle }[] }>('/api/timeline', {
    query: { limit: 100 },
    credentials: 'include',
    key: 'timeline',
})

const articles = ref<TimelineArticle[]>([])

if (timelineData.value?.items?.length) {
    articles.value = timelineData.value.items.map((i) => i.article)
} else {
    articles.value = (await queryCollection('articles')
        .order('publishedAt', 'DESC')
        .limit(10)
        .all()) as TimelineArticle[]
}

const fromDatabase = computed(() => (timelineData.value?.items?.length ?? 0) > 0)

// Track the current article index
const currentIndex = ref(0)
const currentArticle = computed(() => articles.value[currentIndex.value] || null)

watchEffect(() => {
    if (fromDatabase.value) return
    if (articles.value.length - 3 <= currentIndex.value) {
        queryCollection('articles')
            .order('publishedAt', 'DESC')
            .skip(articles.value.length)
            .limit(10)
            .all()
            .then((newArticles: TimelineArticle[]) => {
                articles.value.push(...newArticles)
            })
    }
})

// Store references to all article containers
const articleContainers = ref<HTMLElement[]>([])

// Function to scroll to the next article
function gotoNextArticle(event: KeyboardEvent) {
    event.stopPropagation()
    if (currentIndex.value < articles.length - 1) {
        articleContainers.value[currentIndex.value + 1]?.scrollIntoView({
            behavior: 'smooth',
        })
    }
}

// Function to scroll to the previous article
function gotoPreviousArticle(event: KeyboardEvent) {
    event.stopPropagation()
    if (currentIndex.value > 0) {
        articleContainers.value[currentIndex.value - 1]?.scrollIntoView({
            behavior: 'smooth',
        })
    }
}

// Function to check if more than 50% of an element is visible
function isMoreThan50PercentVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
    return visibleHeight > rect.height / 2
}
let l = 0
// Function to set the reference for an article container
const setItemRef = (el: any) => {
    if (el && !articleContainers.value?.includes(el)) {
        articleContainers.value?.push(el)
    }
}

defineShortcuts({
    'arrowup': gotoPreviousArticle,
    'w': gotoPreviousArticle,
    'arrowdown': gotoNextArticle,
    's': gotoNextArticle,
})

// Handle scroll and keyboard events
onMounted(() => {
    const scrollContainer = document.querySelector('.scroll-container')

    const detectCurrentArticleHandler = () => {
        const currentEl = articleContainers.value.find((el) =>
            isMoreThan50PercentVisible(el)
        )
        currentIndex.value = articleContainers.value.indexOf(currentEl)
    }

    // Add event listeners for scrolling and keyboard navigation
    scrollContainer?.addEventListener('scroll', detectCurrentArticleHandler)

    // Cleanup event listeners when component is unmounted
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
        <!-- Scroll container for articles -->
        <div class="scroll-container relative h-dvh w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory">
            <!-- Render each article using the ArticleView component -->
            <div class="my-1 max-w-full landscape:aspect-smartphone landscape:h-[95%] portrait:h-full snap-start mx-auto snap-always"
                v-for="(article, index) in articles" :key="article.id" :ref="setItemRef">
                <ArticleView class="article rounded-xl" v-if="article" :article="article"
                    :is-selected="index === currentIndex" />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Hide scrollbars for a cleaner UI */
.scroll-container {
    scroll-behavior: smooth;
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
}

.scroll-container::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
}
</style>