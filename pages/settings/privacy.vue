<script setup lang="ts">
definePageMeta({
  layout: 'app',
})

const { enabled, loaded, ensureLoaded, setEnabled } = useEngagementTrackingPrefs()
const busy = ref(false)

onMounted(async () => {
  await ensureLoaded()
})

async function onToggle(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  busy.value = true
  try {
    await setEnabled(checked)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-gray-400 text-gray-100 pb-16 pt-16">
    <div class="mx-auto w-full max-w-lg px-4">
      <header class="mb-8 text-center text-gray-900">
        <h1 class="text-2xl font-semibold">{{ $t('settingsPrivacy.title') }}</h1>
        <p class="mt-2 text-sm text-gray-800">
          {{ $t('settingsPrivacy.intro') }}
        </p>
      </header>

      <section
        class="rounded-xl border border-gray-700 bg-gray-900/95 p-5 shadow-xl"
        :aria-busy="busy || !loaded"
      >
        <label class="flex cursor-pointer items-start gap-4">
          <input
            type="checkbox"
            class="toggle toggle-primary mt-0.5 shrink-0"
            :checked="enabled"
            :disabled="!loaded || busy"
            @change="onToggle"
          >
          <span class="min-w-0">
            <span class="block text-sm font-medium text-gray-200">{{
              $t('settingsPrivacy.trackingLabel')
            }}</span>
            <span class="mt-1 block text-xs leading-snug text-gray-500">{{
              $t('settingsPrivacy.trackingHint')
            }}</span>
          </span>
        </label>
      </section>

      <SettingsPageFooter />
    </div>
  </div>
</template>
