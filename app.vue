<script setup lang="ts">
// Keep `<html lang>` (and hreflang/meta) aligned with the active i18n locale
// (`de-DE` / `en-US` from `nuxt.config` locales), not a static default.
const i18nHead = useLocaleHead({
  lang: true,
  dir: true,
  seo: true,
})

/**
 * Reflect the user's UI preferences on `<html>` as `data-*` attributes.
 * CSS hooks onto these attributes to honour `motion: reduced|standard`
 * regardless of the OS `prefers-reduced-motion` setting, and (future)
 * `data-theme` will select between the visual presets.
 *
 * We mount the composable in `app.vue` so hydration runs once for the
 * whole app, not once per layout. During SSR the state equals
 * `defaultUiPrefs()` (motion `system`, theme `calm-light`), so the
 * initial HTML matches the OS-controlled baseline; the client updates
 * reactively after `/api/me/ui-prefs` resolves.
 */
const { prefs: uiPrefs } = useUiPrefs()

useHead(() => ({
  htmlAttrs: {
    ...(i18nHead.value.htmlAttrs ?? {}),
    'data-motion': uiPrefs.value.motion,
    'data-theme': uiPrefs.value.theme,
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