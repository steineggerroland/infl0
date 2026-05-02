<script setup lang="ts">
/**
 * Legacy URL (`/settings/personalization`). The content lives under
 * `/settings#personalization`; `middleware/settingsLegacyRoutes.global.ts`
 * redirects here before any layout runs.
 */
definePageMeta({
    layout: false,
})
</script>

<template>
    <div class="min-h-dvh bg-[var(--infl0-app-bg)]" aria-hidden="true" />
</template>
