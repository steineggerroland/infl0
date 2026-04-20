<script setup lang="ts">
defineOptions({ name: 'ArticleTag' })

defineProps<{
  tag: string
}>()
</script>
<template>
    <div class="bg-gray-300 text-black rounded py-1 px-2 w-min h-min text-center">{{ tag }}</div>
</template>