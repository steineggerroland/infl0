<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const options = computed(() =>
  locales.value.map((l) => ({
    code: typeof l === 'string' ? l : l.code,
    name: typeof l === 'string' ? l : (l.name ?? l.code),
  })),
)

function isLocaleCode(value: string): value is 'en' | 'de' {
  return value === 'en' || value === 'de'
}

function onChange(e: Event) {
  const code = (e.target as HTMLSelectElement).value
  if (isLocaleCode(code)) void setLocale(code)
}
</script>

<template>
  <label class="flex items-center gap-2 text-sm text-gray-300">
    <span class="sr-only">{{ $t('locale.label') }}</span>
    <select
      class="select select-bordered select-xs max-w-[9rem] bg-gray-800 border-gray-600 text-gray-200"
      :value="locale"
      @change="onChange"
    >
      <option v-for="opt in options" :key="opt.code" :value="opt.code">
        {{ opt.name }}
      </option>
    </select>
  </label>
</template>
