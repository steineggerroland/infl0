<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  direction: 'front' | 'back'
}>()

const tooltip = computed(() =>
  props.direction === 'front' ? t('article.flipCard') : t('article.flipBack'),
)
</script>

<template>
  <div class="flip-arrow text-current">
    <div class="arrow-tooltip">{{ tooltip }}</div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="arrow-icon"
      :class="{ front: direction === 'front' }"
      aria-hidden="true"
    >
      <path d="M21 2v6h-6" />
      <path d="M21 8c-1.8-2.7-5-4.5-8.5-4.5C7 3.5 2.5 8 2.5 13.5S7 23.5 12.5 23.5c4.5 0 8.4-3 9.6-7.3" />
    </svg>
  </div>
</template>

<style scoped>
.flip-arrow {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 10s infinite;
}

.arrow-tooltip {
  position: absolute;
  bottom: 150%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--infl0-panel-text);
  background: color-mix(in srgb, var(--infl0-panel-bg) 88%, black 12%);
  border: 1px solid var(--infl0-panel-border);
  padding: 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease-in-out;
}

.flip-arrow:hover .arrow-tooltip {
  opacity: 1;
}

.arrow-icon {
  width: 20px;
  height: 20px;
}

.arrow-icon.front {
  transform: rotateY(180deg);
}

@keyframes pulse {
  0% { transform: scale(1); }
  80% { transform: scale(1); }
  85% { transform: scale(1.1); }
  90% { transform: scale(1); }
  95% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .flip-arrow {
    animation: none;
  }

  .arrow-tooltip {
    transition: none;
  }
}
</style>
