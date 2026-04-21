<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    /** Match the page content column (`max-w-*`). */
    containerMax?: 'lg' | '4xl'
    /** `data-testid` on the teleported `<footer>` (stable selectors in tests). */
    testId?: string
  }>(),
  { containerMax: 'lg', testId: 'app-footer-shortcuts' },
)

const { t } = useI18n()

const innerMaxClass = computed(() =>
  props.containerMax === '4xl' ? 'max-w-4xl' : 'max-w-lg',
)
</script>

<template>
  <!--
    Teleport to `body` so `<footer>` is not nested inside `<main>`.
    Otherwise assistive tech treats it as a section footer only, not
    a page-level `contentinfo` landmark. SSR keeps the landmark in HTML.
  -->
  <Teleport to="body" defer>
    <footer
      :data-testid="testId"
      class="app-footer-shortcuts border-t border-gray-600/80 bg-gray-400"
    >
      <div
        :class="innerMaxClass"
        class="mx-auto mt-12 w-full px-4 pb-8 pt-8 text-gray-800"
      >
        <nav class="w-full" :aria-label="t('settingsCommon.footerNav')">
          <!--
            Global `@layer base` styles in `assets/css/tailwind.css` add
            `space-y-*` to every `ul`, which breaks a horizontal flex row.
          -->
          <ul
            class="m-0 flex list-none flex-row flex-nowrap items-center justify-center gap-10 space-y-0 p-0 sm:gap-14"
          >
            <li class="shrink-0">
              <NuxtLink
                class="inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-lg px-4 text-base font-semibold text-gray-900 underline decoration-2 underline-offset-4 hover:bg-gray-500/25 hover:text-gray-950"
                to="/"
              >
                {{ t('menu.timeline') }}
              </NuxtLink>
            </li>
            <li class="shrink-0">
              <NuxtLink
                class="inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-lg px-4 text-base font-semibold text-gray-900 underline decoration-2 underline-offset-4 hover:bg-gray-500/25 hover:text-gray-950"
                to="/help"
              >
                {{ t('menu.help') }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  </Teleport>
</template>
