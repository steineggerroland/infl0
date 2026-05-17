<script setup lang="ts">
import { unref } from 'vue'

/**
 * When the service worker finds a newer build, offer a reload via the shared toast host.
 * No UI when PWA is disabled (dev) or `$pwa` is unavailable.
 */
const { $pwa } = useNuxtApp()
const toast = useToast()
const { t } = useI18n()

const updateToastId = ref<string | null>(null)

watch(
  () => unref($pwa?.needRefresh),
  (needRefresh) => {
    if (!needRefresh) {
      updateToastId.value = null
      return
    }
    if (updateToastId.value || !$pwa) return

    updateToastId.value = toast.push({
      message: t('pwa.updateReady'),
      variant: 'info',
      durationMs: 0,
      actions: [
        {
          label: t('pwa.updateReload'),
          onClick: () => {
            void $pwa.updateServiceWorker(true)
          },
        },
      ],
    })
  },
  { immediate: true },
)
</script>

<template>
  <span class="sr-only" aria-live="polite" />
</template>
