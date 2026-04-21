<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Match the settings page content column (`max-w-*`). */
    containerMax?: 'lg' | '4xl'
  }>(),
  { containerMax: 'lg' },
)
</script>

<template>
  <AppFooterShortcuts :container-max="containerMax" test-id="settings-page-footer" />
</template>
