<script setup lang="ts">
import { renderSafeMarkdown } from '~/utils/safe-markdown'

const props = withDefaults(
  defineProps<{
    markdown?: string
    fallbackClass?: string
    contentClass?: string
  }>(),
  {
    markdown: '',
    fallbackClass: 'whitespace-pre-wrap',
    contentClass: '',
  },
)

const renderedHtml = computed(() => renderSafeMarkdown(props.markdown))
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- Markdown is parsed and sanitized in renderSafeMarkdown(). -->
  <div
    v-if="renderedHtml"
    :class="contentClass"
    v-html="renderedHtml"
  />
  <!-- eslint-enable vue/no-v-html -->
  <pre v-else :class="fallbackClass">{{ markdown }}</pre>
</template>
