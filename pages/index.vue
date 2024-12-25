<script setup lang="ts">
// Fetch articles from Nuxt Content
const articles: Array<Object> = await queryCollection('articles').order('publishedAt', 'DESC').all()

// Track the current article index
const currentIndex = ref(0)
const currentArticle = computed(() => articles[currentIndex.value] || null)

// Store references to all article containers
const articleContainers = ref<HTMLElement[]>([])

// Function to scroll to the next article
function gotoNextArticle() {
    if (currentIndex.value < articles.length - 1) {
        articleContainers.value[currentIndex.value + 1]?.scrollIntoView({
            behavior: 'smooth',
        })
    }
}

// Function to scroll to the previous article
function gotoPreviousArticle() {
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

// Function to set the reference for an article container
const setItemRef = (el: any) => {
    if (el && el.$el && !articleContainers.value?.includes(el.$el)) {
        articleContainers.value?.push(el.$el)
    }
}

// Handle scroll and keyboard events
onMounted(() => {
    const scrollContainer = document.querySelector('.scroll-container')

    const detectCurrentArticleHandler = () => {
        const currentEl = articleContainers.value.find((el) =>
            isMoreThan50PercentVisible(el)
        )
        currentIndex.value = articleContainers.value.indexOf(currentEl)
    }
    const articleNavigationHandler = (e) => {

        if (e.key === 'ArrowDown') gotoNextArticle()
        if (e.key === 'ArrowUp') gotoPreviousArticle()
    }

    // Add event listeners for scrolling and keyboard navigation
    scrollContainer?.addEventListener('scroll', detectCurrentArticleHandler)
    document.addEventListener('keydown', articleNavigationHandler)

    // Cleanup event listeners when component is unmounted
    onUnmounted(() => {
        scrollContainer?.removeEventListener('scroll', detectCurrentArticleHandler)
        document.removeEventListener('keydown', articleNavigationHandler)
    })
})


</script>

<template>
    <div class="bg-gray-400 text-white h-screen w-full flex justify-center items-center">
        <!-- Scroll container for articles -->
        <div class="scroll-container relative h-screen w-full overflow-scroll snap-y snap-mandatory">
            <!-- Render each article using the ArticleView component -->
            <div class="my-1 max-w-full landscape:aspect-smartphone landscape:h-[95%] portrait:h-full snap-start mx-auto"
                style="scroll-snap-stop: always;" v-for="article in articles" :key="article.id" :ref="setItemRef">
                <ArticleView class="article rounded-xl" :article="article" />
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