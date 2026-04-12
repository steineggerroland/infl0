<script setup lang="ts">
defineProps<{
    /** Wider, full-width control for use inside the app menu */
    menu?: boolean
}>()

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
  <label
    class="flex items-center gap-2 text-sm text-gray-300"
    :class="menu ? 'w-full' : ''"
  >
    <span class="sr-only">{{ $t('locale.label') }}</span>
    <select
      class="select select-bordered border-gray-500 bg-gray-900 text-gray-100 focus:border-gray-400 focus:outline-none"
      :class="menu ? 'select-sm h-10 min-h-10 w-full max-w-none' : 'select-xs max-w-[9rem] bg-gray-800 border-gray-600 text-gray-200'"
      :value="locale"
      @change="onChange"
    >
      <option v-for="opt in options" :key="opt.code" :value="opt.code">
        {{ opt.name }}
      </option>
    </select>
  </label>
</template>
