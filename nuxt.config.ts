// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { PWA_MASK_ICON_COLOR, PWA_THEME_COLOR, pwaWebManifest } from './utils/pwa-manifest'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'infl0',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: pwaWebManifest.description },
        { name: 'theme-color', content: PWA_THEME_COLOR },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        { rel: 'mask-icon', href: '/mask-icon.svg', color: PWA_MASK_ICON_COLOR },
      ],
    },
  },
  modules: ['@nuxt/eslint', '@nuxtjs/i18n', '@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    registerWebManifestInRouteRules: true,
    includeAssets: ['favicon-32x32.png', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: pwaWebManifest,
    workbox: {
      // SSR: do not serve `/` for navigations — breaks server routes and can confuse asset loads.
      navigateFallback: undefined,
      navigateFallbackDenylist: [/^\/api\//, /^\/operator/],
      cleanupOutdatedCaches: true,
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
  compatibilityDate: '2025-07-15',
  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL
      || process.env.NUXT_SITE_URL
      || process.env.PLAYWRIGHT_BASE_URL
      || process.env.E2E_BASE_URL
      || 'http://127.0.0.1:3000',
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      // With `strategy: 'no_prefix'`, `redirectOn: 'root'` does not apply (see
      // module docs). Use `no prefix` so browser locale matches composer
      // locale on `/login` etc., not only after visiting `/`.
      redirectOn: 'no prefix',
    },
  },
  runtimeConfig: {
    crawlerApiKey: '',
    /** Set NUXT_REGISTRATION_INVITE_CODE; empty = registration API returns 403 */
    registrationInviteCode: '',
    smtpHost: '',
    smtpUser: '',
    smtpPass: '',
    emailOtpTtlSeconds: 600,
    emailOtpResendCooldownSeconds: 60,
    public: {
      emailOtpResendCooldownSeconds: 60,
    },
  },
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss()],
  },
  /**
   * Compatibility redirects.
   *
   * `/settings/timeline-score` → `/settings#settings-sorting-heading`:
   * the sorting controls moved into the main Settings page so they are
   * reachable with a single click from the menu. Old bookmarks and deep
   * links keep working without a 404. 308 is permanent + preserves
   * method, so POSTs (unlikely but possible for future form actions)
   * would not silently turn into GET.
   */
  routeRules: {
    '/settings/timeline-score': {
      redirect: { to: '/settings#settings-sorting-heading', statusCode: 308 },
    },
  },
  // `fonts.css` = @font-face only; woff2 files live under `public/assets/fonts/`.
  css: ['@/assets/css/fonts.css', '@/assets/css/tailwind.css'],
  imports: {
    dirs: ['composables']
  },
  /** Nuxt generated tsconfig uses types: []; Node globals need @types/node for server/scripts. */
  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ['node'],
      },
    },
  },
})
