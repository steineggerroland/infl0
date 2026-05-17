/**
 * Web App Manifest fields shared by @vite-pwa/nuxt and unit tests.
 * Transport (link tags, Nitro route rules) stays in nuxt.config / the PWA module.
 *
 * Localized install metadata uses W3C `*_localized` maps (`description_localized`, …)
 * so OS install UI can follow the user language (aligned with `i18n` locales `en` / `de`).
 */
import deLocale from '../i18n/locales/de.json'
import enLocale from '../i18n/locales/en.json'

export const PWA_THEME_COLOR = '#CBF6F8'
export const PWA_BACKGROUND_COLOR = '#F5FCFF'
/** Safari pinned-tab / mask icon glyph (not the pastel splash background). */
export const PWA_MASK_ICON_COLOR = '#0F2940'

const descriptionDe = deLocale.pwa.description

/** BCP 47 tags for `description_localized` (matches Nuxt i18n `code` + `language`). */
export const pwaDescriptionLocalized = {
  de: descriptionDe,
  'de-DE': descriptionDe,
} as const

const pwaShortcutIcon = [
  { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
] as const

type ShortcutLabels = { name: string, shortName: string }

function localizedShortcutLabels(de: ShortcutLabels) {
  return {
    de: de.name,
    'de-DE': de.name,
  }
}

function localizedShortcutShortLabels(de: ShortcutLabels) {
  return {
    de: de.shortName,
    'de-DE': de.shortName,
  }
}

function manifestShortcut(
  url: string,
  en: ShortcutLabels,
  de: ShortcutLabels,
) {
  return {
    name: en.name,
    short_name: en.shortName,
    name_localized: localizedShortcutLabels(de),
    short_name_localized: localizedShortcutShortLabels(de),
    url,
    icons: [...pwaShortcutIcon],
  }
}

export const pwaWebManifest = {
  id: '/',
  name: 'infl0',
  short_name: 'infl0',
  description: enLocale.pwa.description,
  description_localized: pwaDescriptionLocalized,
  theme_color: PWA_THEME_COLOR,
  background_color: PWA_BACKGROUND_COLOR,
  display: 'standalone' as const,
  orientation: 'any' as const,
  start_url: '/',
  scope: '/',
  lang: 'en',
  dir: 'ltr' as const,
  categories: ['news', 'education', 'productivity'],
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  shortcuts: [
    manifestShortcut('/', enLocale.pwa.shortcuts.timeline, deLocale.pwa.shortcuts.timeline),
    manifestShortcut('/feeds', enLocale.pwa.shortcuts.feeds, deLocale.pwa.shortcuts.feeds),
    manifestShortcut('/settings', enLocale.pwa.shortcuts.settings, deLocale.pwa.shortcuts.settings),
  ],
}
