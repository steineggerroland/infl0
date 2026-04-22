<script setup lang="ts">
definePageMeta({
  layout: 'app',
  appFooter: { testId: 'settings-page-footer' },
})
</script>

<template>
  <div class="min-h-dvh bg-gray-400 text-gray-100 pb-16 pt-16">
    <div class="mx-auto w-full max-w-lg px-4">
      <header class="mb-8 text-center text-gray-900">
        <h1 class="text-2xl font-semibold">{{ $t('settingsIndex.title') }}</h1>
        <p class="mt-2 text-sm text-gray-800">
          {{ $t('settingsIndex.intro') }}
        </p>
      </header>

      <section
        class="rounded-xl border border-gray-700 bg-gray-900/95 p-5 text-sm text-gray-300 shadow-xl"
        aria-live="polite"
      >
        <p class="m-0 leading-relaxed">
          {{ $t('settingsIndex.placeholder') }}
        </p>
      </section>
    </div>
  </div>
</template>
