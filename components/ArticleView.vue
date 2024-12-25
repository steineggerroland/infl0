<script setup lang="ts">
// Define the props for the component
defineProps({
  article: {
    type: Object as () => {
      title: string
      teaser: string
      link: string
      publishedAt: string
      category?: string[]
    },
    required: true,
  },
})

// Import date-fns for date formatting
import { format } from 'date-fns'

// Function to format the article's publication date
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMMM dd, yyyy')
}
</script>

<template>
  <div class="flex flex-col grow rounded-xl overflow-hidden">
    <div class="flex flex-col items-center justify-center max-h-4/5 h-4/5 w-full p-6 text-center">
      <!-- Title -->
      <h1 class="text-2xl md:text-4xl font-bold mb-4">{{ article.title }}</h1>
      <!-- Teaser -->
      <p class="text-lg md:text-2xl mb-6 text-gray-300">{{ article.teaser }}</p>
    </div>
    <!-- Meta Information -->
    <div class="max-h-1/5 h-1/5 w-full text-xs sm:text-sm md:text-lg px-6 py-2 text-start">
      <p class="flex items-center mb-2 text-gray-200">
        <TypeIcon :type="article.source_type" class="me-1 md:me-3"></TypeIcon>
        {{ formatDate(article.publishedAt) }}
      </p>
      <p v-if="article.category" class="mb-2 text-gray-300">
        {{ Array.isArray(article.category) ? article.category.join(', ') : article.category }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Styling to make the component visually appealing */
div {
  transition: transform 0.2s ease-in-out, opacity 0.2s ease-in-out;
}
</style>