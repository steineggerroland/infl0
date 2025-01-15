<script setup lang="ts">
// Define the props for the component
const props = defineProps({
  article: {
    type: Object as () => {
      id: string
      title: string
      teaser: string
      summary_long: string
      link: string
      publishedAt: string
      category?: string[]
      source_type: string
    },
    required: true,
  },
  isSelected: Boolean
})

// Import date-fns for date formatting
import { format } from 'date-fns'

// Function to format the article's publication date
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMMM dd, yyyy')
}

// State for toggling the detail view
const isDetailView = ref(false)

function toggleDetailView() {
  isDetailView.value = !isDetailView.value
}

// Track modal visibility
const modalVisible = ref(false)

function showOriginalArticle() {
  modalVisible.value = true
  modal.value?.showModal()
}

function toggleOriginalArticle() {
  modalVisible.value = !modalVisible.value
  if (modal.value?.open) {
    modal.value?.close()
  } else {
    modal.value?.showModal()
  }
}

const matchingPage = await queryCollection('rawArticles').path('/raw/articles/' + props.article.id.split('/').pop().replace(/(.json)$/, '')).first()
const modal = ref()

defineShortcuts({
  'e': () => { if (props.isSelected) toggleDetailView() },
  'escape': () => { if (props.isSelected) { isDetailView.value = false } },
  'q': () => { if (props.isSelected) toggleOriginalArticle() }
})

</script>

<template>
  <div class="article-container" :class="{ 'flip-back': isDetailView, 'flip-front': !isDetailView }" :id="article.id">
    <!-- Front: Short Summary -->
    <div class="article-content rounded-xl bg-front text-gray-100 relative transition-all">
      <!-- Corner fold -->
      <CornerFold position="top-right" tooltip="Click to flip" @click="toggleDetailView" />

      <div class="flex flex-col items-center justify-center max-h-4/5 h-4/5 w-full p-6 text-center">
        <!-- Title -->
        <h1 class="w-full text-end text-sm smh:text-md mdh:text-lg font-bold mb-4 tracking-tighter">{{
          article.title }}
        </h1>
        <!-- Teaser -->
        <p class="teaser flex-1 content-center text-lg smh:text-2xl mdh:text-4xl mb-6 text-gray-200 cursor-pointer"
          @click="toggleDetailView" tabindex="0">
          {{
            article.teaser }}</p>
      </div>
      <!-- Meta Information -->
      <div class="meta max-h-1/5 h-1/5 w-full text-xs smh:text-sm mdh:text-lg px-6 py-2 text-start">
        <div class="flex items-center mb-2 mt-0 text-gray-300">
          <TypeIcon :type="article.source_type" class="shadow-md tooltip" :data-tip="article.source_type" />
          <FreshnessIndicator v-if="article.publishedAt" class="ms-1 mdh:ms-3 tooltip"
            :data-tip="formatDate(article.publishedAt)" :publishedAt="article.publishedAt" />
          <TldIcon v-if="article?.tld" class="ms-1 mdh:ms-3 tooltip" :data-tip="article.tld" :tld="article.tld">
          </TldIcon>
          <span v-else class="ms-1 mdh:ms-3 h-[1em] w-[1em]"></span>
          <NameIcon v-if="article?.author" class="ms-1 mdh:ms-3 tooltip" :data-tip="article.author"
            :name="article.author">
          </NameIcon>
          <span v-else class="ms-1 mdh:ms-3 h-[1em] w-[1em]"></span>
        </div>
        <div v-if="article.category" class="mb-2 text-gray-400">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </div>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-front" direction="front" @click="toggleDetailView" />
    </div>

    <!-- Back: Detailed Summary -->
    <div class="article-detail rounded-xl bg-back text-gray-200 relative shadow-inner transition-all">
      <div class="flex flex-col items-center justify-center max-h-4/5 h-4/5 w-full p-6 text-center">
        <!-- Title -->
        <h1 class="w-full text-end text-sm smh:text-md mdh:text-lg font-bold mb-4 tracking-tighter">{{
          article.title }}
        </h1>
        <!-- Detailed Summary -->
        <p class="summary flex-1 content-center text-sm smh:text-md mdh:text-lg mb-6 text-gray-300 overflow-y-auto">
          {{ article.summary_long }}
        </p>
        <p class="m-0 w-full text-end text-xs mdh:text-sm">
          <a v-if="matchingPage" @click.prevent="showOriginalArticle" :href="article.link" target="_blank">
            Original article
          </a>
          <a v-else :href="article.link" target="_blank">
            Original article
          </a>
        </p>
      </div>
      <!-- Meta Information -->
      <div class="meta text-xs smh:text-sm mdh:text-lg max-h-1/5 h-1/5 w-full px-6 py-2 text-start">
        <div class="flex items-center mb-1 mt-0 text-gray-400">
          <TypeIcon :type="article.source_type" class="me-1 mdh:me-3 shadow-md tooltip"
            :data-tip="article.source_type" />
          {{ formatDate(article.publishedAt) }}
        </div>
        <div class="text-gray-400 mb-1 max-w-full flex flex-nowrap">
          <div class="me-1 mdh:me-3 tooltip" :data-tip="article?.tld">
            <TldIcon v-if="article?.tld" :tld="article?.tld"></TldIcon>
          </div>
          <div v-if="article?.author" class="tooltip max-w-full" :data-tip="article?.author">
            <div class="text-white me-1 mdh:me-3 truncate">{{ article?.author
              }}</div>
          </div>
        </div>
        <div v-if="article.category" class="mb-1 text-gray-400">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </div>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-back" direction="back" @click="toggleDetailView" />
    </div>
    <dialog v-if="matchingPage" class="modal" ref="modal">
      <div class="modal-box max-w-[100vw] w-[640px] bg-white text-black">
        <form method="dialog" class="flex sticky top-2 right-0">
          <button class="ms-auto btn btn-sm btn-circle btn-ghost">✕</button>
        </form>
        <div class="overflow-y-auto h-full font-serif md:p-2 -mt-4">
          <ContentRenderer v-if="modalVisible" :value="matchingPage" />
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>Close</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.article-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.flip-back {
  animation: flip-back 0.5s cubic-bezier(0.445, 0.050, 0.550, 0.950) both;
}

.flip-front {
  animation: flip-front 0.5s cubic-bezier(0.455, 0.030, 0.515, 0.955) both;
}
</style>

<style scoped>
/* Global gradient for the front */
.bg-front-gradient {
  background: linear-gradient(135deg, #1e3a8a, #0f172a);
  /* Blue gradient */
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

/* Back: Dark and immersive */
.bg-back {
  background-color: #1a202c;
  /* Dark gray slate */
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

/* SVG Icon shadow for visibility */
TypeIcon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
}

/* Back content inner shadow for depth */
.article-detail {
  box-shadow: inset 0px 8px 15px rgba(0, 0, 0, 0.2);
}

/* Base container for the flipping animation */
.article-container {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  perspective: 10px;
}

/* Front and back content setup */
.article-content,
.article-detail {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

/* Specific setup for the back of the card */
.article-detail {
  transform: rotateY(180deg);
}

.flip-back {
  animation: flip-back 0.5s cubic-bezier(0.445, 0.050, 0.550, 0.950) both;
}

.flip-front {
  animation: flip-front 0.5s cubic-bezier(0.455, 0.030, 0.515, 0.955) both;
}

/* ----------------------------------------------
 * Generated by Animista on 2024-12-25 13:59:16
 * Licensed under FreeBSD License.
 * See http://animista.net/license for more info. 
 * w: http://animista.net, t: @cssanimista
 * ---------------------------------------------- */

/**
 * ----------------------------------------
 * animation flip-2-hor-top-1
 * ----------------------------------------
 */
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

.action-flip-front {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

.action-flip-back {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
}
</style>