<script setup lang="ts">
defineProps<{
  title: string
  testId?: string
}>()

const open = ref(false)

function onToggle(event: Event) {
  const el = event.target
  if (el instanceof HTMLDetailsElement) open.value = el.open
}
</script>

<template>
  <details
    class="episode-collapsible rounded-md border border-[var(--infl0-article-back-fg-mute)]/25"
    :data-testid="testId"
    @toggle="onToggle"
  >
    <summary
      class="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 text-[0.82em] font-medium text-[var(--infl0-article-back-fg)]"
    >
      <span class="min-w-0 flex-1">{{ title }}</span>
      <span
        class="swap swap-rotate shrink-0 text-[var(--infl0-article-back-fg-mute)]"
        :class="{ 'swap-active': open }"
        aria-hidden="true"
      >
        <Infl0Icon name="chevron.up" size="sm" class="swap-on" />
        <Infl0Icon name="chevron.down" size="sm" class="swap-off" />
      </span>
    </summary>
    <slot />
  </details>
</template>

<style scoped>
.episode-collapsible summary::-webkit-details-marker {
  display: none;
}
</style>
