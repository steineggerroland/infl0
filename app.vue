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
 * Schreibt UI-Prefs auf `<html>`: Bewegung, gewählte Farbpalette und
 * hell/dunkel. Komponenten-Bibliothek und native Bedienelemente folgen der
 * effektiven hell/dunkel-Ansicht; die App-Farben kommen aus den infl0-Tokens
 * im `style`-Attribut.
 *
 * Mount hier, damit Hydration einmal für die ganze App läuft. SSR startet mit
 * `defaultUiPrefs()`; nach `/api/me/ui-prefs` aktualisiert sich der Client.
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
      /** Gespeicherte Farbpalette (Preset inkl. eigene Farben). */
      'data-infl0-theme': uiPrefs.value.theme,
      /** Hell- oder dunkel-Modus für die UI-Bibliothek (passt zu `effectiveAppearance`). */
      'data-theme': daisyTheme,
      /** Vollständige infl0-Farb-Tokens aus den gewählten Quellfarben. */
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