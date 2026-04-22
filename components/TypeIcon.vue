<script setup lang="ts">
const props = defineProps<{
  type: string
}>()

const isPodcast = computed(() => props.type === 'rss+podcast')
</script>

<template>
  <span class="inline-flex h-[1em] w-[1em] items-center justify-center align-middle text-current">
    <svg
      v-if="isPodcast"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-full w-full"
      aria-hidden="true"
    >
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5 10.5a7 7 0 0 0 14 0" />
      <path d="M12 17.5v4" />
      <path d="M8.5 21.5h7" />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-full w-full"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.2 4 5.5 4 9s-1.5 6.8-4 9c-2.5-2.2-4-5.5-4-9s1.5-6.8 4-9z" />
    </svg>
    <span class="sr-only">{{ isPodcast ? 'Podcast' : 'Website' }}</span>
  </span>
</template>
