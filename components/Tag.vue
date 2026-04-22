<script setup lang="ts">
defineOptions({ name: 'ArticleTag' })

defineProps<{
  tag: string
}>()
</script>
<template>
  <div
    class="h-min w-min rounded border border-[var(--infl0-panel-border)] bg-[var(--infl0-nested-surface)] px-2 py-1 text-center text-[var(--infl0-panel-text)]"
  >{{ tag }}</div>
</template>