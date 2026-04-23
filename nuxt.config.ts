// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'infl0',
    },
  },
  modules: ['@nuxt/eslint', '@nuxtjs/i18n', '@nuxt/content', '@nuxtjs/tailwindcss'],
  compatibilityDate: '2024-11-01',
  i18n: {
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
  /** Node 22.5+ built-in SQLite — avoids better-sqlite3 prompt and native builds (CI/Docker). */
  content: {
    experimental: { sqliteConnector: 'native' },
  },
  runtimeConfig: {
    crawlerApiKey: '',
    /** Set NUXT_REGISTRATION_INVITE_CODE; empty = registration API returns 403 */
    registrationInviteCode: '',
    /** POST /api/cron/recompute-timeline-scores — header x-infl0-cron-key */
    timelineScoreCronSecret: '',
  },
  devtools: { enabled: true },
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
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  imports: {
    dirs: ['composables']
  },
  /** Nuxt 3.21+ generated tsconfig uses types: []; Node globals need @types/node for server/scripts. */
  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ['node'],
      },
    },
  },
})
