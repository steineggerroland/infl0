<script setup lang="ts">
// Keep `<html lang>` (and hreflang/meta) aligned with the active i18n locale
// (`de-DE` / `en-US` from `nuxt.config` locales), not a static default.
const i18nHead = useLocaleHead({
  lang: true,
  dir: true,
  seo: true,
})

useHead(() => ({
  htmlAttrs: {
    ...(i18nHead.value.htmlAttrs ?? {}),
  },
  link: i18nHead.value.link ?? [],
  meta: i18nHead.value.meta ?? [],
}))
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <ToastHost />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
:root {
  --color-front: #1e3a8a;
  --color-back: #1a202c;
}
</style>