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
 * `data-infl0-theme` carries our four presets. We intentionally do NOT
 * use `data-theme` on `<html>` — DaisyUI also binds that attribute to
 * its own colour schemes; sharing it caused a white `body` while our
 * CSS variables still assumed a dark “canvas” in high-contrast.
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
    /** Our four readability presets (CSS in `assets/css/tailwind.css`). */
    'data-infl0-theme': uiPrefs.value.theme,
    /**
     * Keep DaisyUI on a well-known built-in skin. We used to store *our*
     * preset name in `data-theme`, which is also Daisy’s theme switcher —
     * `high-contrast` / `calm-light` are not valid Daisy theme ids and the
     * whole document fell back to a light body while our tokens still
     * described a different canvas. `data-infl0-theme` is the real hook.
     */
    'data-theme': 'light',
  },
  link: i18nHead.value.link ?? [],
  meta: i18nHead.value.meta ?? [],
}))
</script>

<template>
  <div class="infl0-app-root min-h-dvh w-full max-w-full">
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