import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration.
 *
 * Nuxt auto-imports Vue APIs (`ref`, `computed`, `onMounted`, …) for
 * production code. Vitest does not boot Nuxt, so we replicate the same
 * behaviour with `unplugin-auto-import` for component tests. This keeps
 * component source files framework-idiomatic (no redundant Vue imports)
 * while still letting them mount under Vitest.
 */
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      dts: false,
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
