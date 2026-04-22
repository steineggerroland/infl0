import type { UiChromeAppearance } from '~/utils/infl0-theme-derive'
import { computed, onMounted, onUnmounted, ref } from 'vue'

/** Leitet aus `appearance` und ggf. der Systemeinstellung die effektive hell/dunkel-Ansicht ab. */
export function useEffectiveAppearance() {
  const { prefs } = useUiPrefs()
  const systemPrefersDark = ref(false)

  let mq: MediaQueryList | undefined
  let handler: (() => void) | undefined

  onMounted(() => {
    if (typeof window === 'undefined') return
    mq = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mq.matches
    handler = () => {
      systemPrefersDark.value = mq!.matches
    }
    mq.addEventListener('change', handler)
  })

  onUnmounted(() => {
    if (mq && handler) mq.removeEventListener('change', handler)
  })

  const effectiveAppearance = computed<UiChromeAppearance>(() => {
    const a = prefs.value.appearance
    if (a === 'light') return 'light'
    if (a === 'dark') return 'dark'
    return systemPrefersDark.value ? 'dark' : 'light'
  })

  return { effectiveAppearance }
}
