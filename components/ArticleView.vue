<script setup lang="ts">
// Define the props for the component
const props = defineProps({
  article: {
    type: Object as () => {
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


defineShortcuts({
  'e': () => { if (props.isSelected) toggleDetailView() },
  'escape': () => { if (props.isSelected) { isDetailView.value = false } },
})
</script>

<template>
  <div class="article-container" :class="{ 'flip-back': isDetailView, 'flip-front': !isDetailView }" :id="article.id"
    @click="toggleDetailView">
    <!-- Front: Short Summary -->
    <div class="article-content rounded-xl bg-front text-gray-100 relative shadow-lg transition-all">
      <!-- Eselsohr -->
      <CornerFold position="top-right" tooltip="Click to flip" />

      <div class="flex flex-col items-center justify-center max-h-4/5 h-4/5 w-full p-6 text-center">
        <!-- Title -->
        <h1 class="text-3xl md:text-4xl font-bold mb-4">{{ article.title }}</h1>
        <!-- Teaser -->
        <p class="text-lg md:text-2xl mb-6 text-gray-200">{{ article.teaser }}</p>
      </div>
      <!-- Meta Information -->
      <div class="max-h-1/5 h-1/5 w-full text-xs sm:text-sm md:text-lg px-6 py-2 text-start">
        <p class="flex items-center mb-2 text-gray-300">
          <TypeIcon :type="article.source_type" class="shadow-md" />
          <FreshnessIndicator v-if="article?.publishedAt" class="ms-1 md:ms-3" :publishedAt="article.publishedAt" />
          <TldIcon v-if="article?.tld" class="ms-1 md:ms-3" :tld="article?.tld" :title="article?.tld"></TldIcon>
          <span v-else class="ms-1 md:ms-3 h-[1em] w-[1em]"></span>
          <NameIcon v-if="article?.author" class="ms-1 md:ms-3" :name="article?.author" :title="article?.author">
          </NameIcon>
          <span v-else class="ms-1 md:ms-3 h-[1em] w-[1em]"></span>
        </p>
        <p v-if="article.category" class="mb-2 text-gray-400">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </p>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-front" direction="front" />
    </div>

    <!-- Back: Detailed Summary -->
    <div class="article-detail rounded-xl bg-back text-gray-200 relative shadow-inner transition-all">
      <div class="flex flex-col items-center justify-center max-h-4/5 h-4/5 w-full p-6 text-center">
        <!-- Title -->
        <h1 class="text-2xl md:text-4xl font-bold mb-4">{{ article.title }}</h1>
        <!-- Detailed Summary -->
        <p class="text-lg md:text-2xl mb-6 text-gray-300">{{ article.summary_long }}</p>
      </div>
      <!-- Meta Information -->
      <div class="max-h-1/5 h-1/5 w-full text-xs sm:text-sm md:text-lg px-6 py-2 text-start">
        <p class="flex items-center mb-2 text-gray-400">
          <TypeIcon :type="article.source_type" class="me-1 md:me-3 shadow-md" />
          <FreshnessIndicator class="me-2" v-if="article?.publishedAt" :publishedAt="article.publishedAt" />
          {{ formatDate(article.publishedAt) }}
        </p>
        <p v-if="article.category" class="mb-2 text-gray-400">
          {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
        </p>
        <p class="mb-2">
          <NuxtLink class="text-blue-300 hover:text-blue-200" :to="article.link" :external="true" target="_blank">
            See source
          </NuxtLink>
        </p>
      </div>
      <!-- Flip Arrow -->
      <FlipArrow class="action-flip-back" direction="back" />
    </div>
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

/* Front content shadow for depth */
.article-content {
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.3);
}

/* Back content inner shadow for depth */
.article-detail {
  box-shadow: inset 0px 8px 15px rgba(0, 0, 0, 0.2);
}
</style>

<style scoped>
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