<script setup lang="ts">
import { useEffectiveAppearance } from '~/composables/useEffectiveAppearance'
import { buildThemeHtmlStyle } from '~/utils/infl0-theme-derive'

// Keep `<html lang>` (and hreflang/meta) aligned with the active i18n locale
// (`de-DE` / `en-US` from `nuxt.config` locales), not a static default.
const i18nHead = useLocaleHead({
  lang: true,
  dir: true,
  seo: true,
})

/**
 * Writes UI prefs on `<html>`: motion, selected colour palette, and
 * light/dark. The component library and native controls follow the
 * effective light/dark appearance; app colours come from infl0 tokens
 * on the `style` attribute.
 *
 * Mount here so hydration runs once for the whole app. SSR starts from
 * `defaultUiPrefs()`; the client updates after `/api/me/ui-prefs` loads.
 */
const { prefs: uiPrefs } = useUiPrefs()
const { effectiveAppearance } = useEffectiveAppearance()

useHead(() => {
  const tokenStyle = buildThemeHtmlStyle(uiPrefs.value, {
    effectiveAppearance: effectiveAppearance.value,
  })
  const daisyTheme = effectiveAppearance.value === 'dark' ? 'dark' : 'light'
  return {
    htmlAttrs: {
      ...(i18nHead.value.htmlAttrs ?? {}),
      'data-motion': uiPrefs.value.motion,
      /** Stored colour palette (preset including custom colours). */
      'data-infl0-theme': uiPrefs.value.theme,
      /** Light or dark mode for the UI library (aligns with `effectiveAppearance`). */
      'data-theme': daisyTheme,
      /** Full infl0 colour tokens from the selected source colours. */
      style: tokenStyle,
    },
    link: i18nHead.value.link ?? [],
    meta: i18nHead.value.meta ?? [],
  }
})
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