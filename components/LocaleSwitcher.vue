<script setup lang="ts">
import { computed, onMounted } from 'vue'
import deMessages from '~/i18n/locales/de.json'
import enMessages from '~/i18n/locales/en.json'

defineProps<{
    /** Wider, full-width control for use inside the app menu */
    menu?: boolean
}>()

const deTagline = deMessages.login.tagline
const enTagline = enMessages.login.tagline

/** Same key on every page so the switcher can infer effective locale from `t()`. */
const MESSAGE_PROBE = 'login.tagline' as const

const { locale, locales, setLocale, t } = useI18n({ useScope: 'global' })

const options = computed(() =>
    locales.value.map((l) => ({
        code: typeof l === 'string' ? l : l.code,
        name: typeof l === 'string' ? l : (l.name ?? l.code),
    })),
)

function isLocaleCode(value: string): value is 'en' | 'de' {
    return value === 'en' || value === 'de'
}

/**
 * `composer.locale` can lag behind the messages actually used for `t()` (e.g.
 * SSR / browser detection). Derive the effective UI language from a stable
 * string comparison, then sync `setLocale` on the client so cookie + head
 * stay aligned.
 */
function effectiveLocaleCode(): 'en' | 'de' {
    const rendered = t(MESSAGE_PROBE)
    if (rendered === deTagline) return 'de'
    if (rendered === enTagline) return 'en'
    return locale.value === 'de' ? 'de' : 'en'
}

const selectedCode = computed({
    get(): 'en' | 'de' {
        return effectiveLocaleCode()
    },
    set(v: string) {
        if (isLocaleCode(v)) void setLocale(v)
    },
})

onMounted(() => {
    const resolved = effectiveLocaleCode()
    if (resolved !== locale.value) {
        void setLocale(resolved)
    }
})
</script>

<template>
  <label
    class="flex items-center gap-2 text-sm text-gray-300"
    :class="menu ? 'w-full' : ''"
  >
    <span class="sr-only">{{ $t('locale.label') }}</span>
    <select
      v-model="selectedCode"
      class="select select-bordered border-gray-500 bg-gray-900 text-gray-100 focus:border-gray-400 focus:outline-none"
      :class="menu ? 'select-sm h-10 min-h-10 w-full max-w-none' : 'select-xs max-w-[9rem] bg-gray-800 border-gray-600 text-gray-200'"
    >
      <option v-for="opt in options" :key="opt.code" :value="opt.code">
        {{ opt.name }}
      </option>
    </select>
  </label>
</template>
