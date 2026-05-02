<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    /** Match the page content column (`max-w-*`). */
    containerMax?: 'lg' | '4xl'
    /** `data-testid` on the rendered `<footer>` (stable selectors in tests). */
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
    DaisyUI footer (`footer` + `footer-center`): see https://daisyui.com/components/footer/
    Rendered as a sibling of `<main>` by `layouts/app.vue` — no Teleport (SSR order).
  -->
  <footer
    :data-testid="testId"
    class="app-footer-shortcuts footer footer-center infl0-app-footer px-4 pb-8 pt-12"
  >
    <div :class="[innerMaxClass, 'infl0-footer-text w-full']">
      <nav class="w-full" :aria-label="t('settingsCommon.footerNav')">
        <div class="grid grid-flow-col justify-center gap-6 sm:gap-10">
          <NuxtLink
            class="infl0-footer-link link link-hover inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-lg px-4 text-base font-semibold"
            to="/"
          >
            {{ t('menu.timeline') }}
          </NuxtLink>
          <NuxtLink
            class="infl0-footer-link link link-hover inline-flex min-h-11 min-w-[5.5rem] items-center justify-center rounded-lg px-4 text-base font-semibold"
            to="/help"
          >
            {{ t('menu.help') }}
          </NuxtLink>
        </div>
      </nav>
    </div>
  </footer>
</template>
