// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/content', '@nuxtjs/tailwindcss'],
  compatibilityDate: '2024-11-01',
  /** Node 22.5+ built-in SQLite — avoids better-sqlite3 prompt and native builds (CI/Docker). */
  content: {
    experimental: { sqliteConnector: 'native' },
  },
  runtimeConfig: {
    crawlerApiKey: '',
    /** Set NUXT_REGISTRATION_INVITE_CODE; empty = registration API returns 403 */
    registrationInviteCode: '',
  },
  devtools: { enabled: true },
  css: ['@/assets/css/tailwind.css'],
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
